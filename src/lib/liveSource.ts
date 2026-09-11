// The LIVE source: STREAK talking to Somnia Markets for real.
//
// Every tap in the arcade becomes an actual IOC order on an actual binary pool.
// Nothing here is mocked — market discovery is an indexer read, the odds come
// off the locally materialized order book, the price is the on-chain EMA
// oracle, and settlement is a redeem against the settlement singleton.
//
// The shape of the integration:
//
//   discovery   client.listBinaryMarkets({ orderBy: "closingSoon" })
//   odds        client.watchMarket(pool) -> getLiveBinaryOrderBook(pool)
//   price       client.watchPrice(asset) -> getLivePrice / getLivePriceTicks
//   reference   client.getOpeningPrices([marketId])
//   bet         exchange.createOrder(sym, "market", "buy", shares, …, IOC)
//   settle      exchange.redeem(sym, shares)
//
// The watches are push-fed and ref-counted by the SDK, so the odds and price
// reads below are synchronous and cost no round-trip. The only polling is the
// market list, because a rolling series mints a new market every cadence and
// the arcade wants the new round the moment it exists.

import {
  SomniaMarkets,
  PRICE_FEED_DECIMALS,
  type BinaryMarket,
  type UnifiedMarket,
} from "@somnia-chain/markets-sdk";
import { createPublicClient, formatEther, http, type PublicClient } from "viem";
import type { Direction, Round } from "./rounds.ts";
import type { NetworkConfig } from "./networks.ts";
import type {
  ArcadeSource,
  BetResult,
  PlacedBet,
  RoundOdds,
  SourcePush,
  StakeQuote,
} from "./types.ts";

/** How often the market list is refreshed to catch newly minted rounds. */
const DISCOVERY_MS = 12_000;
/** Depth pulled from the book for odds and stake quoting. */
const BOOK_DEPTH = 25;
/**
 *  Slippage bound handed to a market order, as a fraction.
 *
 *  Two percent is too tight for a one-minute book: the crossing limit is
 *  computed from the best opposite level at quote time, and on a round with
 *  seconds left that level can move before the transaction lands, so the IOC
 *  crosses nothing and reverts with ImmediateOrCancelNoFill. Observed live on
 *  Shannon. Five percent still bounds the worst fill tightly -- the quote shown
 *  to the player is the book walk, not this -- while surviving normal churn.
 */
const SLIPPAGE = 0.05;
/** Ticks kept for the price chart. */
const TICK_LIMIT = 240;
/** How often the focused pool's book is re-read over plain RPC. */
const BOOK_POLL_MS = 4_000;

/**
 *  Decimals the oracle quotes a market's `strike` in.
 *
 *  The SDK does not export this — its own note calls the explorer's value "(2),
 *  which is empirical, not [guaranteed]". Verified against Shannon: a market
 *  asking "will BTC/USDC be at or above 77305.31" carries `strike: 7730531`.
 */
const ORACLE_PRICE_DECIMALS = 2;

/** UP is the YES outcome (index 0); DOWN is NO (index 1). */
const OUTCOME_OF: Record<Direction, number> = { UP: 0, DOWN: 1 };

/**
 *  Walk one side of a human-unit book, spending `stake` collateral best-price
 *  first. Returns the shares bought and the average price paid — which, on a
 *  binary market, IS the implied probability the player entered at.
 *
 *  Pure over plain numbers so it is unit-testable without a chain: see
 *  liveSource.test.ts.
 */
export function walkBook(
  levels: [number, number][],
  stake: number,
): { shares: number; avgPrice: number; spent: number; partial: boolean } {
  let remaining = stake;
  let shares = 0;
  let spent = 0;

  for (const [price, size] of levels) {
    if (remaining <= 0) break;
    // A binary outcome price outside (0, 1) is not a real crossing — skip it
    // rather than dividing the stake by garbage.
    if (!(price > 0 && price < 1) || !(size > 0)) continue;
    const affordable = remaining / price;
    const take = Math.min(size, affordable);
    shares += take;
    spent += take * price;
    remaining -= take * price;
  }

  if (shares <= 0) return { shares: 0, avgPrice: 0, spent: 0, partial: true };
  return { shares, avgPrice: spent / shares, spent, partial: remaining > 1e-9 };
}

/** Best (lowest) ask on a side of the book, or null when that side is empty. */
function bestAsk(levels: [number, number][]): number | null {
  for (const [price, size] of levels) {
    if (price > 0 && price < 1 && size > 0) return price;
  }
  return null;
}

export class LiveSource implements ArcadeSource {
  readonly mode = "live" as const;

  private exchange: SomniaMarkets;
  private push: SourcePush | null = null;
  private discoveryTimer: ReturnType<typeof setInterval> | null = null;
  private unsubLive: (() => void) | null = null;
  private unsubPrices: (() => void) | null = null;
  private marketWatch: { stop(): void } | null = null;
  private priceWatch: { stop(): void } | null = null;

  private focusedAsset: string | null = null;
  private focusedPool: string | null = null;
  private stopped = false;

  /** marketId -> reference (opening) price in human units. */
  private openPrices = new Map<string, number>();
  /** Opening-price reads already in flight, so a tick cannot re-fire them. */
  private openPriceInFlight = new Set<string>();
  /** poolAddress -> the indexed market row, for decimals. */
  private marketsByPool = new Map<string, BinaryMarket>();
  /**
   *  poolAddress -> the last book fetched over plain RPC.
   *
   *  The live book is materialized from the websocket tail, which is the fast
   *  path but not a guaranteed one: on a slow or dropped socket it stays empty
   *  indefinitely, and an empty book means no odds, no quotes, and two dead
   *  buttons. Measured on Shannon during a degraded run -- every round had
   *  three to four levels a side, yet the live book reported nothing. This
   *  one-shot read is the floor under that.
   */
  private snapshotBooks = new Map<string, { up: [number, number][]; down: [number, number][] }>();
  private bookTimer: ReturnType<typeof setInterval> | null = null;
  /**
   *  poolAddress -> the unified market, which carries the per-outcome tradable
   *  symbols createOrder takes and the venue's collateral code.
   */
  private unifiedByPool = new Map<string, UnifiedMarket>();

  private collateral = "USDC";
  /** Read-only client for the one thing the SDK does not surface: native gas. */
  private publicClient: PublicClient;
  /** Latest native balance in whole STT, or null before the first read. */
  private gasBalance: number | null = null;

  constructor(
    private network: NetworkConfig,
    /** Signer, if the player has connected one. Reads work without it. */
    private signer: { privateKey?: `0x${string}`; walletClient?: unknown } = {},
  ) {
    this.publicClient = createPublicClient({
      chain: network.chain,
      transport: http(),
    }) as PublicClient;
    this.exchange = new SomniaMarkets({
      indexerUrl: network.indexerUrl,
      chain: network.chain,
      wsRpcUrl: network.wsRpcUrl,
      addresses: network.addresses,
      priceFeed: network.priceFeed,
      ...(signer.privateKey ? { privateKey: signer.privateKey } : {}),
      ...(signer.walletClient ? { walletClient: signer.walletClient as never } : {}),
    });
  }

  get collateralSymbol(): string {
    return this.collateral;
  }

  /** Swap the signer in or out without tearing down watches or market data. */
  setSigner(signer: { privateKey?: `0x${string}`; walletClient?: unknown }): void {
    this.signer = signer;
    this.exchange.setSigner(
      signer.privateKey
        ? { privateKey: signer.privateKey }
        : signer.walletClient
          ? { walletClient: signer.walletClient as never }
          : {},
    );
    void this.refreshAccount();
  }

  async start(push: SourcePush): Promise<void> {
    this.push = push;
    push.status("connecting");

    // loadMarkets() is what makes symbols, tick/lot grids and outcome tradables
    // resolvable — createOrder throws without it.
    this.indexUnified(await this.exchange.loadMarkets());

    // The book store notifies on every materialized block; re-read the live
    // book from it rather than polling the chain.
    this.unsubLive = this.exchange.client.subscribeLive(() => this.emitBook());
    this.unsubPrices = this.exchange.client.subscribePrices(() => this.emitPrice());

    await this.discover();
    this.discoveryTimer = setInterval(() => void this.discover(), DISCOVERY_MS);
    this.bookTimer = setInterval(() => void this.refreshSnapshotBook(), BOOK_POLL_MS);
    await this.refreshAccount();

    push.status("ready");
  }

  /** Index the unified registry by pool address so lookups are O(1). */
  private indexUnified(registry: Record<string, UnifiedMarket>): void {
    for (const market of Object.values(registry)) {
      if (market.type !== "binary") continue;
      this.unifiedByPool.set(market.info.poolAddress.toLowerCase(), market);
      if (market.quote) this.collateral = market.quote;
    }
  }

  stop(): void {
    this.stopped = true;
    if (this.discoveryTimer) clearInterval(this.discoveryTimer);
    this.discoveryTimer = null;
    if (this.bookTimer) clearInterval(this.bookTimer);
    this.bookTimer = null;
    this.unsubLive?.();
    this.unsubPrices?.();
    this.marketWatch?.stop();
    this.priceWatch?.stop();
    void this.exchange.close();
    this.push = null;
  }

  /** Pull the current set of rounds from the indexer, newest series first. */
  private async discover(): Promise<void> {
    if (this.stopped) return;
    try {
      // "newest" and NOT "closingSoon": closingSoon sorts by expiry ASCENDING
      // across every market the venue has ever had, so it returns the oldest
      // settled rounds first and a limited page of it contains no open round at
      // all. Verified against Shannon -- closingSoon returned 200 markets that
      // expired seven weeks ago, all Finalized, zero open; newest returned the
      // ten rounds actually trading right now.
      const markets = await this.exchange.client.listBinaryMarkets({
        orderBy: "newest",
        limit: 200,
      });
      for (const m of markets) this.marketsByPool.set(m.poolAddress.toLowerCase(), m);
      // A rolling series mints a new pool every cadence; without reloading, its
      // outcome symbols are unresolvable and createOrder would throw.
      const unknown = markets.some((m) => !this.unifiedByPool.has(m.poolAddress.toLowerCase()));
      if (unknown) this.indexUnified(await this.exchange.loadMarkets(true));
      this.push?.markets(markets);
      this.push?.status("ready", null);
    } catch (err) {
      // A discovery failure is survivable: the last snapshot stays on screen and
      // the next interval retries. Only say so if there is nothing to show.
      if (this.marketsByPool.size === 0) {
        this.push?.status("error", describe(err));
      }
    }
  }

  /**
   *  Point the watches at one series. Watches are ref-counted by the SDK, so the
   *  previous one is closed before the new one opens.
   */
  focus(asset: string, poolAddress: string | null): void {
    const nextAsset = asset.toUpperCase();
    if (nextAsset !== this.focusedAsset) {
      this.focusedAsset = nextAsset;
      this.priceWatch?.stop();
      this.priceWatch = null;
      void this.exchange.client
        .watchPrice(nextAsset)
        .then((h) => {
          if (this.stopped) h.stop();
          else this.priceWatch = h;
          this.emitPrice();
        })
        .catch(() => {
          /* the price strip simply stays empty; the round still trades */
        });
    }

    if (poolAddress && poolAddress !== this.focusedPool) {
      this.focusedPool = poolAddress;
      this.marketWatch?.stop();
      this.marketWatch = null;
      // Fetch the book over RPC immediately so the round is playable on the
      // first frame, rather than only once the socket has hydrated.
      void this.refreshSnapshotBook();
      void this.exchange.client
        .watchMarket(poolAddress)
        .then((h) => {
          if (this.stopped) h.stop();
          else this.marketWatch = h;
          this.emitBook();
        })
        .catch(() => {
          /* the RPC snapshot carries the odds on its own */
        });
    }
  }

  private emitBook(): void {
    // The book is read synchronously in oddsOf(); this only nudges the store to
    // recompute, which it does on its own tick anyway.
  }

  private emitPrice(): void {
    const asset = this.focusedAsset;
    if (!asset || !this.push) return;
    const live = this.exchange.client.getLivePrice(asset);
    if (live) this.push.price(asset, live.price, live.blockTimestamp * 1000);
    const ticks = this.exchange.client.getLivePriceTicks(asset, { limit: TICK_LIMIT });
    if (ticks.length > 0) {
      this.push.ticks(
        asset,
        ticks.map((p) => ({ t: p.blockTimestamp * 1000, price: p.price })),
      );
    }
  }

  /** Collateral units per whole outcome share for a pool. */
  private oneShareOf(poolAddress: string): number {
    return 10 ** (this.marketsByPool.get(poolAddress.toLowerCase())?.quoteDecimals ?? 6);
  }

  /**
   *  Re-read the focused pool's book over plain RPC and cache it. Runs on a
   *  timer and on focus, so the odds survive a socket that never hydrates.
   */
  private async refreshSnapshotBook(): Promise<void> {
    const pool = this.focusedPool;
    if (!pool || this.stopped) return;
    try {
      const book = await this.exchange.client.getBinaryOrderBook(pool as `0x${string}`, {
        depth: BOOK_DEPTH,
      });
      const one = this.oneShareOf(pool);
      const toHuman = (levels: { price: bigint; quantity: bigint }[]): [number, number][] =>
        levels.map((l) => [Number(l.price) / one, Number(l.quantity) / one]);
      this.snapshotBooks.set(pool.toLowerCase(), {
        up: toHuman(book.yesAsks),
        down: toHuman(book.noAsks),
      });
    } catch {
      // Keep whatever was cached; a stale book beats no book, and the next
      // tick retries.
    }
  }

  /**
   *  The four-sided book for a round, preferring the live socket-fed one and
   *  falling back to the RPC snapshot when it is empty.
   */
  private bookFor(round: Round): { up: [number, number][]; down: [number, number][] } | null {
    const snapshot = this.snapshotBooks.get(round.poolAddress.toLowerCase()) ?? null;
    try {
      const one = this.oneShareOf(round.poolAddress);
      const book = this.exchange.client.getLiveBinaryOrderBook(round.poolAddress, {
        depth: BOOK_DEPTH,
      });
      const toHuman = (levels: { price: bigint; quantity: bigint }[]): [number, number][] =>
        levels.map((l) => [Number(l.price) / one, Number(l.quantity) / one]);
      // The SDK pre-inverts the NO sides, so a DOWN buy simply consumes noAsks.
      const live = { up: toHuman(book.yesAsks), down: toHuman(book.noAsks) };
      if (live.up.length > 0 || live.down.length > 0) return live;
      return snapshot;
    } catch {
      return snapshot;
    }
  }

  oddsOf(round: Round): RoundOdds {
    const book = this.bookFor(round);
    if (!book) return { up: null, down: null };
    return { up: bestAsk(book.up), down: bestAsk(book.down) };
  }

  /**
   *  The level a round's outcome is measured against.
   *
   *  Two kinds of market wear the same UI, and Shannon runs both:
   *
   *  - FIXED  the threshold was struck at creation and IS `strike`. No oracle
   *           round-trip, available immediately, and it never changes.
   *  - REFERENCE  the threshold is another question's answer (the opening
   *           price), so it must be fetched and may not exist yet.
   *
   *  Treating every market as reference-mode -- which this did at first --
   *  leaves every fixed-strike round with no reference line on the chart and a
   *  permanent "not posted yet", even though the number was known all along.
   */
  openPriceOf(round: Round): number | null {
    if (round.source.mode === "fixed") {
      const raw = Number(round.source.strike ?? 0);
      return Number.isFinite(raw) && raw > 0 ? raw / 10 ** ORACLE_PRICE_DECIMALS : null;
    }

    const cached = this.openPrices.get(round.id);
    if (cached !== undefined) return cached;

    // A reference-mode market's threshold is another question's answer, so it
    // only exists once the oracle has posted it. Fetch once per market.
    if (!this.openPriceInFlight.has(round.id)) {
      this.openPriceInFlight.add(round.id);
      void this.exchange.client
        .getOpeningPrices([round.id])
        .then((map) => {
          const raw = map[round.id.toLowerCase()] ?? map[round.id];
          if (raw != null) {
            this.openPrices.set(round.id, Number(raw) / 10 ** PRICE_FEED_DECIMALS);
          }
        })
        .catch(() => {
          /* no opening price yet — the UI shows a dash */
        })
        .finally(() => this.openPriceInFlight.delete(round.id));
    }
    return null;
  }

  /** The tradable symbol for one side of a round, e.g. "…/USDC#YES". */
  private symbolFor(round: Round, direction: Direction): string {
    const market = this.unifiedByPool.get(round.poolAddress.toLowerCase());
    const outcome = market?.outcomes?.[OUTCOME_OF[direction]];
    if (!outcome) throw new Error(`this round is not tradable yet — no ${direction} outcome`);
    return outcome.symbol;
  }

  quote(round: Round, direction: Direction, stake: number): StakeQuote | null {
    if (stake <= 0) return null;
    const book = this.bookFor(round);
    if (!book) return null;
    const levels = direction === "UP" ? book.up : book.down;
    const walked = walkBook(levels, stake);
    if (walked.shares <= 0) return null;
    return {
      shares: walked.shares,
      avgProbability: walked.avgPrice,
      payoutIfWin: walked.shares,
      multiple: walked.shares / stake,
      partial: walked.partial,
    };
  }

  /**
   *  Buy the outcome at market, IOC.
   *
   *  The stake is a COLLATERAL budget, but `createOrder` sizes in outcome
   *  tokens — so the book is walked first to turn the budget into a share
   *  count. What comes back is authoritative: `filled` is what actually
   *  executed, and the fill prices decoded from the same round-trip give the
   *  true average entry, which is what the score is computed from.
   */
  async placeBet(round: Round, direction: Direction, stake: number): Promise<BetResult> {
    await this.assertCanTransact();
    const quote = this.quote(round, direction, stake);
    if (!quote) throw new Error("the book is too thin to fill that stake");

    const symbol = this.symbolFor(round, direction);
    let order;
    try {
      order = await this.exchange.createOrder(symbol, "market", "buy", quote.shares, undefined, {
        timeInForce: "IOC",
        slippage: SLIPPAGE,
      });
    } catch (err) {
      // A no-fill IOC is the book moving, not a broken app. Say that, rather
      // than surfacing "placeBinaryOrder reverted: ImmediateOrCancelNoFill()".
      if (/ImmediateOrCancelNoFill/i.test(describe(err))) {
        throw new Error("The book moved before your order landed and nothing filled. Try again.");
      }
      throw err;
    }

    if (order.filled <= 0) {
      throw new Error("The book moved before your order landed and nothing filled. Try again.");
    }

    const market = this.marketsByPool.get(round.poolAddress.toLowerCase());
    const entry =
      averageFillProbability(order.info, direction, market?.quoteDecimals ?? 6) ??
      quote.avgProbability;

    return {
      shares: order.filled,
      entryProbability: entry,
      // What was actually spent, not what was budgeted.
      stake: order.filled * entry,
      txHash: order.txHash,
    };
  }

  /**
   *  Redeem a settled position. A losing outcome redeems to zero, so this is
   *  only worth sending on a win or a void.
   */
  async settle(bet: PlacedBet, round: Round): Promise<number> {
    const won = round.winner === bet.direction;
    if (round.phase === "resolved" && !won) return 0;
    if (bet.shares <= 0) return 0;
    const symbol = this.symbolFor(round, bet.direction);
    await this.exchange.redeem(symbol, bet.shares);
    return round.phase === "voided" ? bet.stake : bet.shares;
  }

  async faucet(): Promise<void> {
    if (!this.network.hasFaucet) throw new Error("no faucet on mainnet");
    // The collateral faucet is itself a transaction, so it needs gas too --
    // which is the trap: a brand-new wallet cannot even mint its own play
    // money. Say so instead of letting it revert.
    await this.assertCanTransact();
    await this.exchange.trader.faucet();
    await this.refreshAccount();
  }

  /**
   *  Refuse to send a transaction from a wallet that cannot pay for it.
   *
   *  Without this the node rejects the send and the SDK surfaces "Missing or
   *  invalid parameters", which sounds like the app built a bad transaction.
   *  The real cause is almost always an empty gas balance, and the user can fix
   *  that in thirty seconds if -- and only if -- someone tells them.
   */
  private async assertCanTransact(): Promise<void> {
    const gas = await this.refreshGas();
    if (gas !== null && gas <= 0) {
      throw new Error(
        `This wallet has no ${this.network.gasSymbol} for gas, so the transaction cannot be sent. ` +
          `Fund ${this.exchange.walletAddress ?? "it"} from the Somnia faucet, then try again.`,
      );
    }
  }

  /** Read the native gas balance and push it to the store. */
  private async refreshGas(): Promise<number | null> {
    const address = this.exchange.walletAddress;
    if (!address) {
      this.gasBalance = null;
      this.push?.gas(null);
      return null;
    }
    try {
      const wei = await this.publicClient.getBalance({ address });
      this.gasBalance = Number(formatEther(wei));
    } catch {
      // A failed balance read must not block a write -- the chain is the
      // authority, and a false "no gas" would be worse than no warning.
      this.gasBalance = null;
    }
    this.push?.gas(this.gasBalance);
    return this.gasBalance;
  }

  /** Refresh the connected account and its collateral balance. */
  private async refreshAccount(): Promise<void> {
    if (!this.push) return;
    if (!this.signer.privateKey && !this.signer.walletClient) {
      this.push.account(null);
      this.push.balance(null);
      this.push.gas(null);
      return;
    }
    try {
      this.push.account(this.exchange.walletAddress ?? null);
      const balances = await this.exchange.fetchBalance();
      const code = pickCollateralCode(Object.keys(balances), this.collateral);
      if (code) {
        this.collateral = code;
        this.push.collateral(code);
        this.push.balance(balances[code]?.free ?? 0);
      } else {
        // Better an unknown balance than a confident wrong one: falling back to
        // "whatever key came first" once showed a random token's balance under
        // the collateral label.
        this.push.balance(null);
      }
      await this.refreshGas();
    } catch (err) {
      this.push.balance(null);
      this.push.status("ready", describe(err));
    }
  }
}

/**
 *  Volume-weighted average fill price from the decoded fills of a placement,
 *  expressed as a probability of the side that was bought.
 *
 *  Binary fill prices are always quoted in YES terms, so a DOWN (NO) buy enters
 *  at the complement. Returns null when the result carries no usable fills, so
 *  the caller can fall back to its pre-trade estimate.
 */
export function averageFillProbability(
  info: unknown,
  direction: Direction,
  quoteDecimals: number,
): number | null {
  const fills = (info as { fills?: { fillPrice?: unknown; quantityFilled?: unknown }[] } | null)
    ?.fills;
  if (!Array.isArray(fills) || fills.length === 0) return null;

  const one = 10 ** quoteDecimals;
  let weighted = 0;
  let total = 0;
  for (const fill of fills) {
    const price = Number(fill.fillPrice);
    const quantity = Number(fill.quantityFilled);
    if (!Number.isFinite(price) || !Number.isFinite(quantity) || quantity <= 0) continue;
    weighted += (price / one) * quantity;
    total += quantity;
  }
  if (total <= 0) return null;

  const yesProbability = weighted / total;
  const own = direction === "UP" ? yesProbability : 1 - yesProbability;
  return Math.min(0.999, Math.max(0.001, own));
}

/**
 *  Match the venue's collateral code against the balance sheet's own spelling.
 *
 *  The unified market quotes in "USDC" but the token on Shannon is "tUSDC", so
 *  an exact lookup misses and the naive fallback -- first key on the object --
 *  reports an unrelated token's balance. Accepts an exact match, then a
 *  case-insensitive one, then a testnet "t" prefix in either direction. Returns
 *  null rather than guessing.
 */
export function pickCollateralCode(codes: string[], preferred: string): string | null {
  const want = preferred.toLowerCase();
  return (
    codes.find((c) => c === preferred) ??
    codes.find((c) => c.toLowerCase() === want) ??
    codes.find((c) => c.toLowerCase() === `t${want}`) ??
    codes.find((c) => `t${c.toLowerCase()}` === want) ??
    null
  );
}

function describe(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
