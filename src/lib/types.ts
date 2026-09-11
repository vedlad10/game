// Shared vocabulary between the two arcade sources.
//
// STREAK runs on one of two interchangeable sources: LIVE, which talks to the
// Somnia Markets contracts through the SDK, and DEMO, a deterministic
// simulation. They implement the same `ArcadeSource` interface and produce the
// same shapes, so the entire UI is written once and neither knows which one it
// is drawing. Demo mode exists so the arcade still runs — clearly labelled —
// when the indexer or RPC is unreachable, rather than showing a dead screen.

import type { Direction, Round, RoundSource, Series } from "./rounds.ts";
import type { ScoreState } from "../game/scoring.ts";

export type ArcadeMode = "live" | "demo";

export type ConnectionStatus = "idle" | "connecting" | "ready" | "error";

/** One observation from the on-chain price oracle, in human units. */
export interface PriceTick {
  /** Milliseconds since epoch. */
  t: number;
  price: number;
}

/**
 *  The book's opinion on a round, as probabilities in [0, 1]. `up` is the YES
 *  ask (what it costs to buy UP); `down` is the NO ask. They do NOT sum to 1 —
 *  the gap between them is the spread, and showing it honestly is the point.
 */
export interface RoundOdds {
  up: number | null;
  down: number | null;
}

export type BetStatus = "pending" | "open" | "won" | "lost" | "void" | "failed";

/**
 *  A bet the player placed. Lives in the store from the moment the order is
 *  submitted until the round resolves, at which point it feeds the score.
 */
export interface PlacedBet {
  /** Local id — the tx hash once there is one, else a generated handle. */
  id: string;
  roundId: string;
  poolAddress: string;
  asset: string;
  intervalSec: number;
  direction: Direction;
  /** Collateral committed, human units. */
  stake: number;
  /** Outcome tokens received. Each pays 1 collateral if the round goes your way. */
  shares: number;
  /** Average fill price = the market's implied probability at entry, in [0, 1]. */
  entryProbability: number;
  placedAt: number;
  status: BetStatus;
  txHash?: string;
  /** Collateral returned once settled, human units. */
  payout?: number;
  settledAt?: number;
  /** Populated when `status` is "failed". */
  error?: string;
}

/** Everything the UI draws, in one immutable snapshot. */
export interface ArcadeState {
  mode: ArcadeMode;
  status: ConnectionStatus;
  /** Set when `status` is "error", or when live mode fell back to demo. */
  notice: string | null;
  /** Wall clock the UI ticks against, in unix seconds. */
  nowSec: number;

  /** Every rolling series discovered, fastest cadence first. */
  series: Series[];
  /** The series the player is watching, e.g. "BTC:60". */
  activeSeries: string | null;

  live: Round | null;
  next: Round | null;
  history: Round[];

  /** Latest oracle price for the active asset, human units. */
  price: number | null;
  /** The round's reference (opening) price the outcome is measured against. */
  openPrice: number | null;
  ticks: PriceTick[];

  odds: RoundOdds;

  bets: PlacedBet[];
  score: ScoreState;

  /** Collateral balance, human units. Null when no wallet is connected. */
  balance: number | null;
  /**
   *  Native gas balance (STT on Shannon), human units. Null when unknown.
   *
   *  This is surfaced because it is the single most common reason a bet fails:
   *  with no gas every write reverts, and the node reports it as "Missing or
   *  invalid parameters", which reads like a bug in the app rather than an
   *  empty wallet.
   */
  gas: number | null;
  /** Ticker of the venue's collateral, e.g. "USDC". */
  collateralSymbol: string;
  /** Connected account, or null. */
  account: string | null;
  /** True while an order is in flight — the UI disables the buttons. */
  betting: boolean;
}

/** What a source hands back after placing a bet. */
export interface BetResult {
  shares: number;
  entryProbability: number;
  stake: number;
  txHash?: string;
}

/**
 *  A preview of what a stake would buy at the current book, shown under the
 *  UP/DOWN buttons before the player commits.
 */
export interface StakeQuote {
  /** Outcome tokens the stake buys. */
  shares: number;
  /** Average price paid per token, = implied probability. */
  avgProbability: number;
  /** Collateral returned if the round goes your way (= shares). */
  payoutIfWin: number;
  /** payoutIfWin / stake. */
  multiple: number;
  /** True when the book is too thin to fill the whole stake. */
  partial: boolean;
}

/** How the store pushes updates in from a source. */
export interface SourcePush {
  markets(markets: RoundSource[]): void;
  price(asset: string, price: number, atMs: number): void;
  ticks(asset: string, ticks: PriceTick[]): void;
  balance(balance: number | null): void;
  gas(gas: number | null): void;
  /**
   *  The venue's collateral ticker, once the balance sheet reveals its actual
   *  spelling. Pushed rather than read once at construction, because the store
   *  is built before any wallet call has happened.
   */
  collateral(symbol: string): void;
  account(account: string | null): void;
  status(status: ConnectionStatus, notice?: string | null): void;
}

/**
 *  The contract every arcade source satisfies. Deliberately small: the store
 *  owns all derived state, so a source only has to produce raw facts and
 *  execute bets.
 */
export interface ArcadeSource {
  readonly mode: ArcadeMode;
  /** Ticker of the collateral this venue settles in. */
  readonly collateralSymbol: string;
  /** Begin pushing data. Resolves once the first snapshot has landed. */
  start(push: SourcePush): Promise<void>;
  stop(): void;
  /** Focus a series so the source can scope its watches to it. */
  focus(asset: string, poolAddress: string | null): void;
  /**
   *  The book's current odds for a round. Synchronous and pull-based: the live
   *  source answers from the locally materialized book it already keeps warm,
   *  so this costs no round-trip.
   */
  oddsOf(round: Round, nowSec: number): RoundOdds;
  /**
   *  The round's reference (opening) price — the level the outcome is measured
   *  against. Null until the oracle has posted it.
   */
  openPriceOf(round: Round): number | null;
  /** Quote a stake against the current book without committing anything. */
  quote(round: Round, direction: Direction, stake: number): StakeQuote | null;
  placeBet(round: Round, direction: Direction, stake: number): Promise<BetResult>;
  /** Settle a round the player has a bet in: returns payout in human units. */
  settle(bet: PlacedBet, round: Round): Promise<number>;
  /** Testnet only — mint collateral so a first-time player can play. */
  faucet?(): Promise<void>;
}
