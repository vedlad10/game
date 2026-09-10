// LIVE PREFLIGHT — the integration check that could not run in the sandbox.
//
// Everything else in this repo's test suite is pure and offline. This file is
// the opposite: it drives the REAL `LiveSource` against a REAL Somnia venue and
// reports, step by step, exactly which part of the integration works.
//
// It is skipped by default so `npm test` and CI stay offline and green.
//
//   READ-ONLY (safe, no wallet, no gas):
//     SOMNIA_LIVE=1 npx vitest run preflight
//
//   WITH A WALLET (reads your balance, mints test collateral):
//     SOMNIA_LIVE=1 SOMNIA_KEY=0xabc… npx vitest run preflight
//
//   PLACE ONE REAL ORDER (spends collateral and gas — opt in deliberately):
//     SOMNIA_LIVE=1 SOMNIA_KEY=0xabc… SOMNIA_BET=1 npx vitest run preflight
//
//   Against mainnet instead of Shannon testnet:
//     SOMNIA_NETWORK=mainnet …
//
// Windows PowerShell uses `$env:SOMNIA_LIVE=1; npx vitest run preflight`.
//
// The steps run in dependency order and each one prints what it found, so a
// failure tells you where the integration actually stands rather than just
// going red. Read the console output, not only the pass/fail.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LiveSource } from "./liveSource.ts";
import { NETWORKS, isNetworkId } from "./networks.ts";
import { groupIntoSeries, intervalLabel, pickLiveRound, type RoundSource } from "./rounds.ts";
import type { PriceTick, SourcePush } from "./types.ts";

const LIVE = process.env.SOMNIA_LIVE === "1";
const KEY = process.env.SOMNIA_KEY as `0x${string}` | undefined;
const PLACE_BET = process.env.SOMNIA_BET === "1";
const NETWORK_ID = isNetworkId(process.env.SOMNIA_NETWORK) ? process.env.SOMNIA_NETWORK : "testnet";

/** Stake for the optional real order. Deliberately tiny. */
const BET_STAKE = Number(process.env.SOMNIA_BET_STAKE ?? "1");

/** Live calls cross a network and a chain; be patient before failing. */
const TIMEOUT = 90_000;

const log = (...args: unknown[]) => console.log("   ", ...args);

describe.skipIf(!LIVE)(`live preflight · ${NETWORK_ID}`, () => {
  const network = NETWORKS[NETWORK_ID];
  let source: LiveSource;

  // Latest values pushed by the source, mirroring what the store would hold.
  let markets: RoundSource[] = [];
  let price: number | null = null;
  let ticks: PriceTick[] = [];
  let balance: number | null = null;
  let account: string | null = null;
  let statusNotice: string | null = null;

  const push: SourcePush = {
    markets: (m) => {
      markets = m;
    },
    price: (_asset, p) => {
      price = p;
    },
    ticks: (_asset, t) => {
      ticks = t;
    },
    balance: (b) => {
      balance = b;
    },
    account: (a) => {
      account = a;
    },
    status: (_s, notice) => {
      statusNotice = notice ?? null;
    },
  };

  beforeAll(() => {
    log(`network      ${network.label} (chain ${network.chain.id})`);
    log(`indexer      ${network.indexerUrl}`);
    log(`ws rpc       ${network.wsRpcUrl}`);
    log(`wallet       ${KEY ? "provided" : "none — read-only checks only"}`);
    log(`real order   ${PLACE_BET && KEY ? `YES, ${BET_STAKE} collateral` : "no"}`);
    source = new LiveSource(network, KEY ? { privateKey: KEY } : {});
  });

  afterAll(() => {
    source?.stop();
  });

  it(
    "1 · connects, loads the market registry and discovers markets",
    async () => {
      await source.start(push);
      if (statusNotice) log(`notice: ${statusNotice}`);
      log(`markets discovered: ${markets.length}`);
      expect(markets.length).toBeGreaterThan(0);
    },
    TIMEOUT,
  );

  it("2 · groups markets into rolling up/down series", () => {
    const series = groupIntoSeries(markets);
    for (const s of series.slice(0, 12)) {
      log(`series ${s.asset} ${intervalLabel(s.intervalSec)} — ${s.markets.length} rounds`);
    }
    expect(series.length).toBeGreaterThan(0);
  });

  it(
    "3 · finds a round that is open for trading right now",
    async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const series = groupIntoSeries(markets);

      // Prefer a series that actually has a live round; the fastest cadence is
      // the arcade's default but may be between rounds at this instant.
      const withLive = series
        .map((s) => ({ s, round: pickLiveRound(s.markets, nowSec) }))
        .filter((x) => x.round !== null);

      for (const { s, round } of withLive.slice(0, 8)) {
        log(`open: ${s.asset} ${intervalLabel(s.intervalSec)} — ${round!.secondsLeft}s left`);
      }

      if (withLive.length === 0) {
        log("NO OPEN ROUND at this instant. That is not necessarily a failure —");
        log("a rolling series is briefly between rounds. Re-run in a few seconds.");
      }
      expect(withLive.length).toBeGreaterThan(0);

      // Point the watches at it, exactly as the store does, then let the
      // book and price subscriptions hydrate.
      const target = withLive[0]!;
      source.focus(target.s.asset, target.round!.poolAddress);
      await new Promise((r) => setTimeout(r, 8_000));
    },
    TIMEOUT,
  );

  it(
    "4 · reads live odds off the order book",
    () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const round = liveRoundOrThrow(markets, nowSec);
      const odds = source.oddsOf(round);
      log(`UP   ${odds.up ?? "—"}`);
      log(`DOWN ${odds.down ?? "—"}`);
      if (odds.up == null && odds.down == null) {
        log("Both sides empty. Either the watch has not hydrated, or this pool");
        log("genuinely has no resting liquidity — the UI disables betting then.");
      }
      // A one-sided book is legitimate; no book at all means the read failed.
      expect(odds.up != null || odds.down != null).toBe(true);
    },
    TIMEOUT,
  );

  it("5 · reads the on-chain price oracle", () => {
    log(`price ${price ?? "—"}, ticks ${ticks.length}`);
    expect(price).not.toBeNull();
  });

  it(
    "6 · resolves the round's reference (opening) price",
    async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const round = liveRoundOrThrow(markets, nowSec);
      // The first call kicks off the fetch and returns null by design.
      source.openPriceOf(round);
      await new Promise((r) => setTimeout(r, 6_000));
      const opening = source.openPriceOf(round);
      log(`opening level: ${opening ?? "not posted yet"}`);
      // A reference-mode market may legitimately not have its opening answer
      // yet, so this step reports rather than asserts.
      expect(opening === null || Number.isFinite(opening)).toBe(true);
    },
    TIMEOUT,
  );

  it(
    "7 · quotes a stake against the live book",
    () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const round = liveRoundOrThrow(markets, nowSec);
      for (const direction of ["UP", "DOWN"] as const) {
        const quote = source.quote(round, direction, BET_STAKE);
        log(
          quote
            ? `${direction}: ${quote.shares.toFixed(4)} shares @ ${quote.avgProbability.toFixed(4)} (${quote.multiple.toFixed(2)}x)${quote.partial ? " PARTIAL" : ""}`
            : `${direction}: no quote — that side has no crossable liquidity`,
        );
      }
      expect(true).toBe(true);
    },
    TIMEOUT,
  );

  it.skipIf(!KEY)(
    "8 · reports the wallet and its collateral balance",
    async () => {
      await new Promise((r) => setTimeout(r, 3_000));
      log(`account ${account ?? "—"}`);
      log(`balance ${balance ?? "—"} ${source.collateralSymbol}`);
      expect(account).not.toBeNull();
      if (balance === 0) {
        log("Zero collateral. Run the faucet step, or mint from the UI.");
      }
    },
    TIMEOUT,
  );

  it.skipIf(!KEY || !network.hasFaucet)(
    "9 · mints test collateral from the faucet",
    async () => {
      // Needs gas (STT on Shannon). A revert here is almost always an empty
      // gas balance, not a broken faucet.
      await source.faucet();
      await new Promise((r) => setTimeout(r, 4_000));
      log(`balance after faucet: ${balance ?? "—"} ${source.collateralSymbol}`);
      expect(balance).not.toBeNull();
    },
    TIMEOUT,
  );

  it.skipIf(!KEY || !PLACE_BET)(
    "10 · places a REAL order on the live round",
    async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const round = liveRoundOrThrow(markets, nowSec);

      // Take whichever side the book can actually fill.
      const direction = source.quote(round, "UP", BET_STAKE) ? "UP" : "DOWN";
      log(`placing ${direction} for ${BET_STAKE} on ${round.asset} ${intervalLabel(round.intervalSec)}`);

      const result = await source.placeBet(round, direction, BET_STAKE);
      log(`filled ${result.shares} shares at ${result.entryProbability}`);
      log(`tx ${result.txHash ?? "—"}`);
      if (result.txHash) log(`${network.explorerUrl}/tx/${result.txHash}`);

      expect(result.shares).toBeGreaterThan(0);
      expect(result.entryProbability).toBeGreaterThan(0);
      expect(result.entryProbability).toBeLessThan(1);
    },
    TIMEOUT,
  );
});

/**
 *  The end-to-end check: not "can the source read", but "does the STORE derive a
 *  round a player could actually bet on". This is the whole app data path minus
 *  React, so a pass here means the UI has everything it needs to draw.
 */
describe.skipIf(!LIVE)(`live store · ${NETWORK_ID}`, () => {
  it(
    "derives a complete, playable round from live chain data",
    async () => {
      const { ArcadeStore } = await import("./store.ts");
      const network = NETWORKS[NETWORK_ID];
      const source = new LiveSource(network, KEY ? { privateKey: KEY } : {});
      const store = new ArcadeStore(source, `preflight.${NETWORK_ID}`);
      try {
        await store.start();
        // Let discovery, the book watch and the price feed hydrate.
        await new Promise((r) => setTimeout(r, 12_000));

        const st = store.getState();
        log(`status        ${st.status}`);
        log(`series        ${st.series.length}`);
        log(`active        ${st.activeSeries}`);
        log(`live round    ${st.live ? `${st.live.asset} ${intervalLabel(st.live.intervalSec)} — ${st.live.secondsLeft}s left` : "NONE"}`);
        log(`price         ${st.price ?? "—"}`);
        log(`reference     ${st.openPrice ?? "—"}`);
        log(`odds          UP ${st.odds.up ?? "—"} / DOWN ${st.odds.down ?? "—"}`);
        log(`chart ticks   ${st.ticks.length}`);
        log(`collateral    ${st.collateralSymbol}`);

        const upQuote = store.quote("UP", 1);
        const downQuote = store.quote("DOWN", 1);
        log(`quote UP      ${upQuote ? `${upQuote.multiple.toFixed(2)}x` : "none"}`);
        log(`quote DOWN    ${downQuote ? `${downQuote.multiple.toFixed(2)}x` : "none"}`);

        expect(st.status).toBe("ready");
        expect(st.series.length).toBeGreaterThan(0);
        expect(st.live).not.toBeNull();
        expect(st.price).not.toBeNull();
        expect(st.ticks.length).toBeGreaterThan(0);
        // At least one side must be quotable, or there is nothing to play.
        expect(upQuote !== null || downQuote !== null).toBe(true);
      } finally {
        store.stop();
      }
    },
    TIMEOUT,
  );
});

/** The live round of whichever series currently has one. */
function liveRoundOrThrow(markets: RoundSource[], nowSec: number) {
  for (const series of groupIntoSeries(markets)) {
    const round = pickLiveRound(series.markets, nowSec);
    if (round) return round;
  }
  throw new Error("no round is open right now — re-run in a few seconds");
}
