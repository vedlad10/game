// The game layer.
//
// STREAK has no backend and no database. A player's score is a PURE FUNCTION of
// their settled bets, and every settled bet is an on-chain fill plus the
// market's oracle-resolved outcome. That means the score is reproducible by
// anyone from the chain alone — replay the same fills, get the same number.
// This module is that function.
//
// The scoring deliberately rewards being RIGHT WHEN THE MARKET WAS NOT, rather
// than rewarding volume. The entry probability is the market's own opinion at
// the moment the bet was taken (a YES price of 0.25 means the book gave UP a
// 25% chance), so a win against a long-shot price scores far more than a win on
// a near-certainty. Betting big on a 0.97 favourite is not skill, and the score
// should not pretend otherwise.

/** The two sides, in the game's language. */
export type Direction = "UP" | "DOWN";

export type BetOutcome = "won" | "lost" | "void";

/**
 *  One settled bet — the atom the score is computed from. Everything here comes
 *  off-chain-free: `entryProbability` from the fill price, `outcome` from the
 *  market's resolved payout vector.
 */
export interface SettledBet {
  /** Market id of the round the bet was placed in. */
  roundId: string;
  asset: string;
  intervalSec: number;
  direction: Direction;
  /**
   *  The market's implied probability of THIS direction at the moment of entry,
   *  in [0, 1] — i.e. the average fill price of the outcome token. A bet filled
   *  at 0.25 was a 4:1 long shot.
   */
  entryProbability: number;
  /** Collateral staked, in human units (e.g. USDC). */
  stake: number;
  outcome: BetOutcome;
  /** Collateral returned on settlement, in human units. */
  payout: number;
  /** Unix seconds the round settled — the ordering key. */
  settledAt: number;
}

/** Base XP for a win before the edge and streak multipliers. */
export const BASE_XP = 100;
/** Each consecutive win adds this to the multiplier. */
export const STREAK_STEP = 0.25;
/** The streak multiplier stops growing here, so a hot streak cannot run away. */
export const MAX_MULTIPLIER = 3;

/**
 *  The multiplier a player carries into their next bet, given the streak they
 *  are on. A streak of 0 is 1.0×; every consecutive win adds a quarter, capped.
 */
export function multiplierForStreak(streak: number): number {
  if (!Number.isFinite(streak) || streak <= 0) return 1;
  return Math.min(MAX_MULTIPLIER, 1 + streak * STREAK_STEP);
}

/**
 *  XP awarded for a winning bet.
 *
 *  `edge` is how much of a long shot the bet was: 1 − entryProbability. A win at
 *  0.5 scores the base; a win at 0.2 scores nearly double it; a win at 0.95
 *  barely registers. The probability is clamped into (0, 1) first — a degenerate
 *  0 or 1 price is a book artefact, not a free jackpot.
 */
export function xpForWin(entryProbability: number, streakBefore: number): number {
  const p = Math.min(0.99, Math.max(0.01, entryProbability));
  const edge = 1 - p;
  return Math.round(BASE_XP * (0.5 + edge) * multiplierForStreak(streakBefore));
}

export interface ScoreState {
  xp: number;
  /** Current consecutive-win streak. */
  streak: number;
  bestStreak: number;
  wins: number;
  losses: number;
  voids: number;
  /** Total collateral staked across settled bets, human units. */
  staked: number;
  /** Net collateral result: Σpayout − Σstake, human units. */
  pnl: number;
}

export const EMPTY_SCORE: ScoreState = {
  xp: 0,
  streak: 0,
  bestStreak: 0,
  wins: 0,
  losses: 0,
  voids: 0,
  staked: 0,
  pnl: 0,
};

/**
 *  Fold one settled bet into a score.
 *
 *  A void is a non-event for the streak: the round never produced an outcome,
 *  so it neither extends nor breaks a run. Stake and payout still flow through
 *  the PnL because the collateral genuinely moved.
 */
export function applyBet(state: ScoreState, bet: SettledBet): ScoreState {
  const staked = state.staked + bet.stake;
  const pnl = state.pnl + (bet.payout - bet.stake);

  if (bet.outcome === "void") {
    return { ...state, voids: state.voids + 1, staked, pnl };
  }

  if (bet.outcome === "lost") {
    return { ...state, streak: 0, losses: state.losses + 1, staked, pnl };
  }

  const streak = state.streak + 1;
  return {
    ...state,
    xp: state.xp + xpForWin(bet.entryProbability, state.streak),
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    wins: state.wins + 1,
    staked,
    pnl,
  };
}

/**
 *  Replay a player's settled bets into a score. Bets are sorted by settlement
 *  time first, because a streak is meaningless in arrival order — the indexer
 *  can hand back fills in any order it likes.
 */
export function scoreFrom(bets: SettledBet[]): ScoreState {
  return [...bets]
    .sort((a, b) => a.settledAt - b.settledAt || a.roundId.localeCompare(b.roundId))
    .reduce(applyBet, EMPTY_SCORE);
}

/** Win rate over decided bets only — voids are excluded from the denominator. */
export function winRate(s: ScoreState): number {
  const decided = s.wins + s.losses;
  return decided === 0 ? 0 : s.wins / decided;
}

export interface Rank {
  name: string;
  /** XP at which this rank starts. */
  min: number;
  /** Accent colour token the UI paints the rank with. */
  tone: "slate" | "cyan" | "violet" | "amber" | "rose";
}

/** The progression ladder. Ascending by `min`; the last one has no ceiling. */
export const RANKS: Rank[] = [
  { name: "ROOKIE", min: 0, tone: "slate" },
  { name: "TRADER", min: 500, tone: "cyan" },
  { name: "SHARP", min: 2_000, tone: "violet" },
  { name: "ORACLE", min: 6_000, tone: "amber" },
  { name: "LEGEND", min: 15_000, tone: "rose" },
];

export function rankFor(xp: number): Rank {
  let current = RANKS[0]!;
  for (const r of RANKS) if (xp >= r.min) current = r;
  return current;
}

/**
 *  Progress toward the next rank as `{ next, progress }`. At the top rank there
 *  is no next, and progress pins at 1.
 */
export function rankProgress(xp: number): { rank: Rank; next: Rank | null; progress: number } {
  const rank = rankFor(xp);
  const idx = RANKS.indexOf(rank);
  const next = RANKS[idx + 1] ?? null;
  if (!next) return { rank, next: null, progress: 1 };
  const span = next.min - rank.min;
  return { rank, next, progress: span <= 0 ? 1 : Math.min(1, (xp - rank.min) / span) };
}
