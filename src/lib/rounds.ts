// The round engine.
//
// An "Event Contract" on Somnia is a binary up/down market belonging to a
// ROLLING SERIES with a fixed cadence (1m, 5m, 15m, 1h, 4h, 24h). The series
// emits one market after another, back to back, so at any instant exactly one
// market of a given (asset, cadence) pair is open for trading and the next one
// is already scheduled.
//
// STREAK plays that series as a game: each market is a ROUND. This module is
// the pure kernel that turns a list of markets + "now" into the round the UI
// draws — no SDK client, no network, no React, so the whole thing is testable
// over plain objects.
//
// Everything here reads the market's own timestamps rather than its `status`
// field. That is deliberate: the SDK documents that the implicit
// Listed→Trading→Settling transitions emit no events, so `status` can lag the
// wall clock by design. Timestamps are authoritative for "can I trade this
// right now"; `status` is authoritative only for the terminal states
// (Resolved / Voided), which DO emit events.

import { resolveIntervalSec } from "@somnia-chain/markets-sdk";

/**
 *  The minimal market shape the round engine needs — a structural subset of the
 *  SDK's `BinaryMarket`, so tests can hand-build one and the real thing passes
 *  unchanged.
 */
export interface RoundSource {
  id: string;
  poolAddress: string;
  asset: string;
  question: string;
  /** Unix seconds trading opens. */
  tradingStart: string | number;
  /** Unix seconds trading ends and the outcome is decided. */
  expiry: string | number;
  /** Series cadence in seconds, when the indexer derived one. */
  intervalSec?: string | number | null;
  status?: string;
  /** 0 = YES (UP) won, 1 = NO (DOWN) won, null until resolved. */
  winningOutcome?: number | null;
  /** "reference" for a true up/down market, "fixed" for a struck threshold. */
  mode?: string;
  quoteDecimals?: number;
}

export type RoundPhase =
  /** Scheduled, trading has not opened yet. */
  | "upcoming"
  /** Trading is open — this is the only phase a bet can be placed in. */
  | "open"
  /** Past expiry, waiting on the oracle. */
  | "settling"
  /** The oracle posted a one-hot outcome. */
  | "resolved"
  /** The market was voided; stakes come back. */
  | "voided";

export interface Round {
  source: RoundSource;
  id: string;
  poolAddress: string;
  asset: string;
  /** Cadence in seconds, resolved via the SDK's canonical helper. */
  intervalSec: number;
  opensAt: number;
  expiresAt: number;
  phase: RoundPhase;
  /** Seconds until expiry; 0 once expired. */
  secondsLeft: number;
  /** 0→1 progress through the trading window, clamped. */
  progress: number;
  /** "UP" | "DOWN" once resolved, else null. */
  winner: Direction | null;
}

/** The two sides of an event contract, in the game's language. */
export type Direction = "UP" | "DOWN";

/** UP is YES (outcome index 0); DOWN is NO (outcome index 1). */
export const OUTCOME_INDEX: Record<Direction, number> = { UP: 0, DOWN: 1 };

export function directionFromOutcome(outcome: number | null | undefined): Direction | null {
  if (outcome === 0) return "UP";
  if (outcome === 1) return "DOWN";
  return null;
}

export function opposite(d: Direction): Direction {
  return d === "UP" ? "DOWN" : "UP";
}

const TERMINAL = new Set(["Resolved", "Voided", "Finalized"]);

function num(v: string | number | null | undefined): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 *  Classify a market into a game phase at `nowSec`.
 *
 *  Terminal states win over the clock: a market the oracle already resolved is
 *  "resolved" even though its expiry is also in the past. Everything else is
 *  decided by the trading window, because the Listed→Trading→Settling
 *  transitions are timestamp-implicit and emit no event to update `status`.
 */
export function phaseOf(m: RoundSource, nowSec: number): RoundPhase {
  if (m.status === "Voided") return "voided";
  if (m.status === "Resolved" || m.status === "Finalized") return "resolved";
  const opensAt = num(m.tradingStart);
  const expiresAt = num(m.expiry);
  if (nowSec < opensAt) return "upcoming";
  if (nowSec < expiresAt) return "open";
  return "settling";
}

/** Build the full round view of a market at `nowSec`. */
export function toRound(m: RoundSource, nowSec: number): Round {
  const opensAt = num(m.tradingStart);
  const expiresAt = num(m.expiry);
  const window = Math.max(1, expiresAt - opensAt);
  const phase = phaseOf(m, nowSec);
  const secondsLeft = Math.max(0, expiresAt - nowSec);
  const progress = Math.min(1, Math.max(0, (nowSec - opensAt) / window));
  return {
    source: m,
    id: m.id,
    poolAddress: m.poolAddress,
    asset: m.asset,
    intervalSec: resolveIntervalSec(m) ?? window,
    opensAt,
    expiresAt,
    phase,
    secondsLeft,
    progress,
    winner: TERMINAL.has(m.status ?? "") ? directionFromOutcome(m.winningOutcome) : null,
  };
}

/**
 *  The market a player can bet on right now for a given series: the one whose
 *  trading window contains `nowSec`.
 *
 *  When a series overlaps (a bootstrap market and a full-cadence one both
 *  covering the instant), the one closing SOONEST wins — that is the round a
 *  player watching a countdown believes they are in.
 */
export function pickLiveRound(markets: RoundSource[], nowSec: number): Round | null {
  const open = markets
    .map((m) => toRound(m, nowSec))
    .filter((r) => r.phase === "open")
    .sort((a, b) => a.expiresAt - b.expiresAt);
  return open[0] ?? null;
}

/** The next round to open after `nowSec` — what the "up next" strip shows. */
export function pickNextRound(markets: RoundSource[], nowSec: number): Round | null {
  const upcoming = markets
    .map((m) => toRound(m, nowSec))
    .filter((r) => r.phase === "upcoming")
    .sort((a, b) => a.opensAt - b.opensAt);
  return upcoming[0] ?? null;
}

/**
 *  Rounds that have closed and are either awaiting the oracle or already
 *  decided, newest first — the game's results feed.
 */
export function pickSettledRounds(markets: RoundSource[], nowSec: number, limit = 20): Round[] {
  return markets
    .map((m) => toRound(m, nowSec))
    .filter((r) => r.phase === "settling" || r.phase === "resolved" || r.phase === "voided")
    .sort((a, b) => b.expiresAt - a.expiresAt)
    .slice(0, limit);
}

/**
 *  Group markets into series keyed by `asset:intervalSec` — the unit the game's
 *  table picker offers ("BTC 1m", "ETH 15m").
 */
export function seriesKey(m: RoundSource): string {
  const iv = resolveIntervalSec(m) ?? Math.max(1, num(m.expiry) - num(m.tradingStart));
  return `${m.asset.toUpperCase()}:${iv}`;
}

export interface Series {
  key: string;
  asset: string;
  intervalSec: number;
  markets: RoundSource[];
}

export function groupIntoSeries(markets: RoundSource[]): Series[] {
  const byKey = new Map<string, Series>();
  for (const m of markets) {
    const key = seriesKey(m);
    let s = byKey.get(key);
    if (!s) {
      const [asset, iv] = key.split(":");
      s = { key, asset: asset ?? m.asset, intervalSec: Number(iv), markets: [] };
      byKey.set(key, s);
    }
    s.markets.push(m);
  }
  // Fastest cadence first — the arcade wants the twitchiest table on top.
  return [...byKey.values()].sort(
    (a, b) => a.intervalSec - b.intervalSec || a.asset.localeCompare(b.asset),
  );
}

/** "1m" · "15m" · "4h" · "24h" — the compact cadence label. */
export function intervalLabel(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return "—";
  if (sec < 60) return `${Math.round(sec)}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  if (sec < 86400) return `${Math.round(sec / 3600)}h`;
  return `${Math.round(sec / 86400)}d`;
}

/** mm:ss for a countdown; hh:mm:ss once over an hour. */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return hh > 0 ? `${hh}:${pad(mm)}:${pad(ss)}` : `${pad(mm)}:${pad(ss)}`;
}
