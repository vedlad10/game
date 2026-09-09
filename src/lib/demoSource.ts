// The DEMO source: a deterministic simulation of a rolling up/down series.
//
// This exists so the arcade is never a dead screen. If the indexer or the RPC
// is unreachable — a judge behind a corporate firewall, a testnet in the middle
// of an upgrade — the app says so plainly and keeps playing against a
// simulation. It is always labelled in the UI; it never pretends to be chain
// data.
//
// It is also the fixture the game logic is tested against: the price walk is
// seeded, so the same seed replays the same market, and the round boundaries
// are computed from the wall clock the same way the real series computes
// them (floor(now / cadence) * cadence), which means the demo exercises the
// identical round-rollover path as live.

import type { Direction, Round, RoundSource } from "./rounds.ts";
import type {
  ArcadeSource,
  BetResult,
  PlacedBet,
  PriceTick,
  SourcePush,
  StakeQuote,
} from "./types.ts";

/** Assets and cadences the simulation offers, mirroring a real venue's series. */
const DEMO_SERIES: { asset: string; intervalSec: number; start: number }[] = [
  { asset: "BTC", intervalSec: 60, start: 95_000 },
  { asset: "BTC", intervalSec: 300, start: 95_000 },
  { asset: "ETH", intervalSec: 60, start: 3_400 },
  { asset: "ETH", intervalSec: 900, start: 3_400 },
];

/** How many rounds of history the simulation keeps per series. */
const HISTORY_ROUNDS = 12;
/** Simulated oracle cadence — the real feed posts on block, this is close enough. */
const TICK_MS = 1_000;
/** Annualised-ish volatility knob; tuned so a 60s round is a genuine coin-flip. */
const VOL = 0.0009;

/**
 *  A small deterministic PRNG (mulberry32). Seeded from the round index so a
 *  given round always walks the same path — reload the page mid-round and the
 *  chart is continuous rather than teleporting.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box–Muller over the seeded uniform, so the walk is a proper Gaussian one. */
function gaussian(rnd: () => number): number {
  const u = Math.max(1e-9, rnd());
  const v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 *  The simulated price of `asset` at `tSec`, as a geometric random walk anchored
 *  to a fixed epoch. Pure: the same (asset, tSec) always gives the same price,
 *  which is what makes the chart stable across renders and reloads.
 */
function priceAt(asset: string, base: number, tSec: number): number {
  const stepSec = 5;
  const epoch = Math.floor(tSec / stepSec);
  // Anchor 1 hour back so there is always history to draw.
  const anchor = epoch - 720;
  const assetSeed = [...asset].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  let p = base;
  for (let i = anchor; i <= epoch; i++) {
    const rnd = mulberry32((assetSeed ^ (i * 2654435761)) >>> 0);
    p *= Math.exp(gaussian(rnd) * VOL);
  }
  return p;
}

function roundIdFor(asset: string, intervalSec: number, index: number): string {
  return `demo-${asset}-${intervalSec}-${index}`;
}

/**
 *  Build the markets of one series around `nowSec`: `HISTORY_ROUNDS` settled
 *  rounds, the live one, and the next one — exactly the window the UI draws.
 *
 *  Round boundaries are `floor(now / cadence) * cadence`, the same rule a real
 *  rolling series uses, so rollover behaves identically in both modes.
 */
function seriesMarkets(
  spec: { asset: string; intervalSec: number; start: number },
  nowSec: number,
): RoundSource[] {
  const { asset, intervalSec, start } = spec;
  const currentIndex = Math.floor(nowSec / intervalSec);
  const out: RoundSource[] = [];

  for (let i = currentIndex - HISTORY_ROUNDS; i <= currentIndex + 1; i++) {
    const opensAt = i * intervalSec;
    const expiresAt = opensAt + intervalSec;
    const settled = expiresAt <= nowSec;
    const open = priceAt(asset, start, opensAt);
    const close = priceAt(asset, start, expiresAt);
    out.push({
      id: roundIdFor(asset, intervalSec, i),
      poolAddress: `0xdemo${asset}${intervalSec}`,
      asset,
      question: `${asset} closes at or above its opening price`,
      tradingStart: opensAt,
      expiry: expiresAt,
      intervalSec,
      mode: "reference",
      status: settled ? "Resolved" : opensAt <= nowSec ? "Trading" : "Listed",
      // UP (outcome 0) wins when the close is at or above the open.
      winningOutcome: settled ? (close >= open ? 0 : 1) : null,
      quoteDecimals: 6,
    });
  }
  return out;
}

/**
 *  The simulated book's odds for a round. Derived from how far price has already
 *  moved from the open relative to the volatility left in the round — so the
 *  price genuinely responds to the chart, the way a real book would, instead of
 *  drifting randomly.
 */
function oddsFor(asset: string, base: number, round: Round, nowSec: number): number {
  const open = priceAt(asset, base, round.opensAt);
  const now = priceAt(asset, base, nowSec);
  const secsLeft = Math.max(1, round.expiresAt - nowSec);
  // Standard deviation of the remaining walk, in log terms.
  const sigma = VOL * Math.sqrt(secsLeft / 5);
  const z = Math.log(now / open) / Math.max(1e-9, sigma);
  // Normal CDF via erf approximation — the probability the close stays above.
  const cdf = 0.5 * (1 + Math.tanh(0.8 * z));
  return Math.min(0.97, Math.max(0.03, cdf));
}

/** Half the simulated spread, in probability terms. */
const HALF_SPREAD = 0.015;

export class DemoSource implements ArcadeSource {
  readonly mode = "demo" as const;
  readonly collateralSymbol = "tUSDC";

  private push: SourcePush | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private focused: { asset: string } = { asset: "BTC" };
  /** Play money, so the demo has a balance that actually moves. */
  private balance = 1_000;

  async start(push: SourcePush): Promise<void> {
    this.push = push;
    push.status("connecting");
    this.emit();
    push.status("ready");
    this.timer = setInterval(() => this.emit(), TICK_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.push = null;
  }

  focus(asset: string): void {
    // Re-emitting on an unchanged focus would re-enter the store's recompute,
    // which is what calls focus in the first place — a guaranteed stack
    // overflow. Only a genuine change is worth a frame.
    if (asset === this.focused.asset) return;
    this.focused = { asset };
    this.emit();
  }

  private baseFor(asset: string): number {
    return DEMO_SERIES.find((s) => s.asset === asset)?.start ?? 100;
  }

  /** Push one frame: markets, price, ticks, odds and balance. */
  private emit(): void {
    const push = this.push;
    if (!push) return;
    const nowSec = Math.floor(Date.now() / 1000);

    push.markets(DEMO_SERIES.flatMap((s) => seriesMarkets(s, nowSec)));

    const asset = this.focused.asset;
    const base = this.baseFor(asset);
    push.price(asset, priceAt(asset, base, nowSec), Date.now());

    const ticks: PriceTick[] = [];
    for (let t = nowSec - 300; t <= nowSec; t += 5) {
      ticks.push({ t: t * 1000, price: priceAt(asset, base, t) });
    }
    push.ticks(asset, ticks);
    push.balance(this.balance);
  }

  /**
   *  The simulated opening price of a round — the reference the outcome is
   *  measured against, mirroring the real `getOpeningPrices` read.
   */
  openPriceOf(round: Round): number {
    return priceAt(round.asset, this.baseFor(round.asset), round.opensAt);
  }

  oddsOf(round: Round, nowSec: number): { up: number; down: number } {
    const up = oddsFor(round.asset, this.baseFor(round.asset), round, nowSec);
    return {
      up: Math.min(0.99, up + HALF_SPREAD),
      down: Math.min(0.99, 1 - up + HALF_SPREAD),
    };
  }

  quote(round: Round, direction: Direction, stake: number): StakeQuote | null {
    if (stake <= 0) return null;
    const nowSec = Math.floor(Date.now() / 1000);
    const odds = this.oddsOf(round, nowSec);
    const p = direction === "UP" ? odds.up : odds.down;
    const shares = stake / p;
    return {
      shares,
      avgProbability: p,
      payoutIfWin: shares,
      multiple: shares / stake,
      partial: false,
    };
  }

  async placeBet(round: Round, direction: Direction, stake: number): Promise<BetResult> {
    const quote = this.quote(round, direction, stake);
    if (!quote) throw new Error("stake must be greater than zero");
    if (stake > this.balance) throw new Error("not enough play collateral — use the faucet");
    this.balance -= stake;
    this.emit();
    return {
      shares: quote.shares,
      entryProbability: quote.avgProbability,
      stake,
    };
  }

  async settle(bet: PlacedBet, round: Round): Promise<number> {
    const payout = round.winner === bet.direction ? bet.shares : 0;
    this.balance += payout;
    this.emit();
    return payout;
  }

  async faucet(): Promise<void> {
    this.balance += 1_000;
    this.emit();
  }
}
