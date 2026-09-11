// The arcade store.
//
// One observable snapshot the whole UI renders from, fed by whichever
// `ArcadeSource` is mounted. The store owns everything DERIVED — which round is
// live, which bets have settled, what the score is — so a source only has to
// produce raw facts. That split is what lets live and demo mode share the
// entire UI.
//
// Settlement is the one piece of real bookkeeping here. A bet sits "open" until
// its round reaches a terminal state; then the store asks the source to settle
// it (on chain that is a redeem; in demo it is arithmetic), folds the result
// into the score, and never touches it again. Settling is guarded by an
// in-flight set so a re-render or a fast tick cannot double-redeem a position.

import {
  groupIntoSeries,
  pickLiveRound,
  pickNextRound,
  pickSettledRounds,
  seriesKey,
  type Direction,
  type Round,
  type RoundSource,
} from "./rounds.ts";
import { scoreFrom, type SettledBet } from "../game/scoring.ts";
import { EMPTY_SCORE } from "../game/scoring.ts";
import type {
  ArcadeSource,
  ArcadeState,
  ConnectionStatus,
  PlacedBet,
  PriceTick,
  StakeQuote,
} from "./types.ts";

/** How often the store recomputes the clock-derived view. */
const TICK_MS = 250;
/** Bets are kept locally so a refresh does not lose an in-flight session. */
const STORAGE_KEY = "streak.bets.v1";

function initialState(source: ArcadeSource): ArcadeState {
  return {
    mode: source.mode,
    status: "idle",
    notice: null,
    nowSec: Math.floor(Date.now() / 1000),
    series: [],
    activeSeries: null,
    live: null,
    next: null,
    history: [],
    price: null,
    openPrice: null,
    ticks: [],
    odds: { up: null, down: null },
    bets: [],
    score: EMPTY_SCORE,
    balance: null,
    gas: null,
    collateralSymbol: source.collateralSymbol,
    account: null,
    betting: false,
  };
}

/** A bet is finished once it has an outcome — those feed the score. */
function toSettledBet(bet: PlacedBet): SettledBet | null {
  if (bet.status !== "won" && bet.status !== "lost" && bet.status !== "void") return null;
  return {
    roundId: bet.roundId,
    asset: bet.asset,
    intervalSec: bet.intervalSec,
    direction: bet.direction,
    entryProbability: bet.entryProbability,
    stake: bet.stake,
    outcome: bet.status,
    payout: bet.payout ?? 0,
    settledAt: bet.settledAt ?? 0,
  };
}

function loadBets(scope: string): PlacedBet[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}.${scope}`);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PlacedBet[]) : [];
  } catch {
    // A private window, cleared site data, or storage disabled entirely — a
    // fresh session is a perfectly good outcome, never a crash.
    return [];
  }
}

function saveBets(scope: string, bets: PlacedBet[]): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}.${scope}`, JSON.stringify(bets.slice(-200)));
  } catch {
    /* storage is a convenience here, never load-bearing */
  }
}

export class ArcadeStore {
  private state: ArcadeState;
  private listeners = new Set<() => void>();
  private markets: RoundSource[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  /** Round ids currently being settled, so a tick cannot double-redeem. */
  private settling = new Set<string>();
  private priceByAsset = new Map<string, number>();
  private ticksByAsset = new Map<string, PriceTick[]>();
  /**
   *  The series key the source is currently focused on. recompute() runs on
   *  every push and every tick, so re-focusing unconditionally would hammer the
   *  source — and a source that emits on focus would recurse straight back into
   *  here. Focus is therefore driven by CHANGE, never by frequency.
   */
  private focusedKey: string | null = null;

  constructor(
    private source: ArcadeSource,
    /** Namespaces persisted bets, so testnet and mainnet never mix. */
    private scope: string,
  ) {
    this.state = { ...initialState(source), bets: loadBets(scope) };
    this.state.score = scoreFrom(this.state.bets.map(toSettledBet).filter(isPresent));
  }

  getState = (): ArcadeState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private set(patch: Partial<ArcadeState>): void {
    this.state = { ...this.state, ...patch };
    for (const l of this.listeners) l();
  }

  async start(): Promise<void> {
    await this.source.start({
      markets: (markets) => {
        this.markets = markets;
        this.recompute();
      },
      price: (asset, price) => {
        this.priceByAsset.set(asset.toUpperCase(), price);
        this.recompute();
      },
      ticks: (asset, ticks) => {
        this.ticksByAsset.set(asset.toUpperCase(), ticks);
        this.recompute();
      },
      balance: (balance) => this.set({ balance }),
      gas: (gas) => this.set({ gas }),
      collateral: (collateralSymbol) => this.set({ collateralSymbol }),
      account: (account) => this.set({ account }),
      status: (status: ConnectionStatus, notice = null) => this.set({ status, notice }),
    });
    this.timer = setInterval(() => this.recompute(), TICK_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.source.stop();
    this.listeners.clear();
  }

  /** Switch the series the player is watching. */
  selectSeries(key: string): void {
    const series = this.state.series.find((s) => s.key === key);
    if (!series) return;
    this.set({ activeSeries: key });
    this.recompute();
  }

  /**
   *  Recompute everything clock-derived. Runs on every tick and every push, so
   *  it must stay cheap and allocation-light.
   */
  private recompute(): void {
    const nowSec = Math.floor(Date.now() / 1000);
    const series = groupIntoSeries(this.markets);

    // Hold the player's chosen series if it still exists; otherwise fall to the
    // fastest one, which is what a first visit lands on.
    let activeSeries = this.state.activeSeries;
    if (!activeSeries || !series.some((s) => s.key === activeSeries)) {
      activeSeries = series[0]?.key ?? null;
    }

    const active = series.find((s) => s.key === activeSeries) ?? null;
    const scoped = active?.markets ?? [];
    const live = pickLiveRound(scoped, nowSec);
    const next = pickNextRound(scoped, nowSec);
    const history = pickSettledRounds(scoped, nowSec, 24);

    // Re-point the watches only when the series or its live pool actually
    // moved — a rolling series mints a new pool every cadence, and that
    // rollover IS a change worth following.
    const focusKey = active ? `${active.key}:${live?.poolAddress ?? ""}` : null;
    if (active && focusKey !== this.focusedKey) {
      this.focusedKey = focusKey;
      this.source.focus(active.asset, live?.poolAddress ?? null);
    }

    const asset = active?.asset ?? "";
    const odds = live ? this.source.oddsOf(live, nowSec) : { up: null, down: null };
    const openPrice = live ? this.source.openPriceOf(live) : null;

    this.set({
      nowSec,
      series,
      activeSeries,
      live,
      next,
      history,
      odds,
      openPrice,
      price: this.priceByAsset.get(asset) ?? null,
      ticks: this.ticksByAsset.get(asset) ?? [],
    });

    void this.settleFinishedBets([...scoped, ...this.markets], nowSec);
  }

  /**
   *  Settle every open bet whose round has reached a terminal state. Guarded by
   *  `settling` so overlapping ticks cannot redeem the same position twice.
   */
  private async settleFinishedBets(markets: RoundSource[], nowSec: number): Promise<void> {
    const open = this.state.bets.filter((b) => b.status === "open");
    if (open.length === 0) return;

    const byId = new Map(markets.map((m) => [m.id, m]));
    for (const bet of open) {
      if (this.settling.has(bet.id)) continue;
      const market = byId.get(bet.roundId);
      if (!market) continue;
      const round = pickSettledRounds([market], nowSec, 1)[0];
      if (!round || (round.phase !== "resolved" && round.phase !== "voided")) continue;

      this.settling.add(bet.id);
      try {
        const payout = await this.source.settle(bet, round);
        const status =
          round.phase === "voided" ? "void" : round.winner === bet.direction ? "won" : "lost";
        this.patchBet(bet.id, { status, payout, settledAt: round.expiresAt });
      } catch (err) {
        // A failed redeem is not a failed bet: the outcome is on chain either
        // way, so record the result and leave the collateral claimable.
        const status =
          round.phase === "voided" ? "void" : round.winner === bet.direction ? "won" : "lost";
        this.patchBet(bet.id, {
          status,
          payout: status === "won" ? bet.shares : status === "void" ? bet.stake : 0,
          settledAt: round.expiresAt,
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        this.settling.delete(bet.id);
      }
    }
  }

  private patchBet(id: string, patch: Partial<PlacedBet>): void {
    const bets = this.state.bets.map((b) => (b.id === id ? { ...b, ...patch } : b));
    saveBets(this.scope, bets);
    this.set({ bets, score: scoreFrom(bets.map(toSettledBet).filter(isPresent)) });
  }

  /** Preview what a stake buys, without committing anything. */
  quote(direction: Direction, stake: number): StakeQuote | null {
    const live = this.state.live;
    if (!live || live.phase !== "open") return null;
    return this.source.quote(live, direction, stake);
  }

  /**
   *  Place a bet on the live round. The bet lands in the list immediately as
   *  "pending" so the UI can show it, then flips to "open" once the order is
   *  filled — or to "failed" with the reason if the chain rejected it.
   */
  async bet(direction: Direction, stake: number): Promise<void> {
    const live = this.state.live;
    if (!live || live.phase !== "open") throw new Error("no round is open right now");
    if (this.state.betting) return;

    const id = `${live.id}-${direction}-${Date.now()}`;
    const pending: PlacedBet = {
      id,
      roundId: live.id,
      poolAddress: live.poolAddress,
      asset: live.asset,
      intervalSec: live.intervalSec,
      direction,
      stake,
      shares: 0,
      entryProbability: 0,
      placedAt: Date.now(),
      status: "pending",
    };
    const withPending = [...this.state.bets, pending];
    this.set({ bets: withPending, betting: true });

    try {
      const result = await this.source.placeBet(live, direction, stake);
      this.patchBet(id, {
        status: "open",
        shares: result.shares,
        entryProbability: result.entryProbability,
        stake: result.stake,
        txHash: result.txHash,
      });
    } catch (err) {
      this.patchBet(id, {
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    } finally {
      this.set({ betting: false });
    }
  }

  /**
   *  Record that live mode could not start and the arcade is running on the
   *  simulation instead. The reason is shown to the player verbatim — a silent
   *  downgrade to fake data would be the one genuinely dishonest thing this app
   *  could do.
   */
  noticeFallback(reason: string): void {
    this.set({
      notice: `Live chain data unavailable (${reason}) — running the built-in simulation.`,
    });
  }

  /**
   *  Point the source at a different wallet without disturbing market data.
   *  Returns false when the source cannot do it, so the caller can fall back to
   *  rebuilding.
   */
  setSigner(signer: { privateKey?: `0x${string}`; walletClient?: unknown }): boolean {
    if (!this.source.setSigner) return false;
    this.source.setSigner(signer);
    return true;
  }

  async faucet(): Promise<void> {
    await this.source.faucet?.();
  }

  /** Wipe the local session — the score is derived, so this only clears history. */
  reset(): void {
    saveBets(this.scope, []);
    this.set({ bets: [], score: EMPTY_SCORE });
  }

  /** Bets on the round currently open, newest first. */
  betsOnLiveRound(): PlacedBet[] {
    const id = this.state.live?.id;
    if (!id) return [];
    return this.state.bets.filter((b) => b.roundId === id).reverse();
  }
}

function isPresent<T>(v: T | null): v is T {
  return v !== null;
}

export { seriesKey };
export type { Round };
