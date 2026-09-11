// The round card: the thing a player actually looks at.
//
// Top to bottom it answers four questions in order — what am I trading, how
// long have I got, where is the price against the level that decides it, and
// what does each side pay. The UP/DOWN buttons carry the payout multiple in the
// largest type on the card, because that is the number a player decides on.

import { PriceChart } from "./PriceChart.tsx";
import { formatCountdown, intervalLabel, type Direction, type Round } from "../lib/rounds.ts";
import { formatDelta, formatMultiple, formatPrice, formatProbability } from "../lib/format.ts";
import type { ArcadeState } from "../lib/types.ts";

interface Props {
  state: ArcadeState;
  stake: number;
  onStake(stake: number): void;
  onBet(direction: Direction): void;
  quote(direction: Direction, stake: number): {
    shares: number;
    avgProbability: number;
    multiple: number;
    partial: boolean;
  } | null;
}

/** Stake presets, in collateral units. */
const STAKES = [1, 5, 10, 25, 100];
/** Below this many seconds the countdown turns red and pulses. */
const URGENT_SEC = 10;

export function RoundCard({ state, stake, onStake, onBet, quote }: Props) {
  const { live, price, openPrice, ticks, odds, betting } = state;

  if (!live) return <WaitingCard state={state} />;

  const urgent = live.secondsLeft <= URGENT_SEC;
  // A fixed-strike round is measured against a level struck at creation; a
  // reference round against its own opening price. Same UI, different noun.
  const fixedStrike = live.source.mode === "fixed";
  const winning = openPrice != null && price != null ? price >= openPrice : null;

  return (
    <section className="panel">
      <div className="round-top">
        <div>
          <div className="asset-line">
            <span className="asset-name">{live.asset}</span>
            <span className="cadence">{intervalLabel(live.intervalSec)}</span>
          </div>
          <p className="question">{live.source.question}</p>
        </div>
        <div className="countdown">
          <div className={`countdown-value${urgent ? " urgent" : ""}`}>
            {formatCountdown(live.secondsLeft)}
          </div>
          <div className="countdown-label">until settlement</div>
        </div>
      </div>

      <div className="progress">
        <div className="progress-fill" style={{ width: `${live.progress * 100}%` }} />
      </div>

      <div className="readout">
        <span className="price-now">{formatPrice(price)}</span>
        <span
          className={`delta ${winning === null ? "flat" : winning ? "up" : "down"}`}
          title="Move from the round's opening level"
        >
          {formatDelta(openPrice, price)}
        </span>
        {openPrice == null ? (
          <span className="ref">
            {fixedStrike
              ? "no threshold on this round"
              : "opening level not posted by the oracle yet"}
          </span>
        ) : (
          <span className="ref">
            {fixedStrike ? "target" : "opened at"} <b>{formatPrice(openPrice)}</b>
          </span>
        )}
      </div>

      <PriceChart ticks={ticks} reference={openPrice} opensAt={live.opensAt} />

      <div className="deck">
        <div className="stake-row">
          <span className="stake-label">Stake</span>
          {STAKES.map((s) => (
            <button
              key={s}
              type="button"
              className={`stake-btn${s === stake ? " on" : ""}`}
              onClick={() => onStake(s)}
            >
              {s}
            </button>
          ))}
          <span className="stake-label" style={{ marginLeft: 2 }}>
            {state.collateralSymbol}
          </span>
        </div>

        <div className="bets">
          <SideButton
            direction="UP"
            price={odds.up}
            quote={quote("UP", stake)}
            disabled={betting || live.phase !== "open"}
            onClick={() => onBet("UP")}
            symbol={state.collateralSymbol}
          />
          <SideButton
            direction="DOWN"
            price={odds.down}
            quote={quote("DOWN", stake)}
            disabled={betting || live.phase !== "open"}
            onClick={() => onBet("DOWN")}
            symbol={state.collateralSymbol}
          />
        </div>

        <p className="bet-hint">
          {betting
            ? "Submitting your order…"
            : `Each tap places a real IOC order on this round's binary pool. A winning share redeems for 1 ${state.collateralSymbol}.`}
        </p>
      </div>
    </section>
  );
}

function SideButton({
  direction,
  price,
  quote,
  disabled,
  onClick,
  symbol,
}: {
  direction: Direction;
  price: number | null;
  quote: { shares: number; avgProbability: number; multiple: number; partial: boolean } | null;
  disabled: boolean;
  onClick(): void;
  symbol: string;
}) {
  const tone = direction === "UP" ? "up" : "down";
  // The book, not the quote, decides whether a side is tradable at all.
  const dead = price == null || quote == null;

  return (
    <button
      type="button"
      className={`bet-btn ${tone}`}
      disabled={disabled || dead}
      onClick={onClick}
      title={dead ? "No resting liquidity on this side yet" : undefined}
    >
      <div className="bet-head">
        <span className="bet-dir">{direction === "UP" ? "▲ UP" : "▼ DOWN"}</span>
        <span className="bet-mult">{quote ? formatMultiple(quote.multiple) : "—"}</span>
      </div>
      <span className="bet-sub">
        {dead
          ? "no liquidity"
          : `${formatProbability(price)} implied · wins ${quote.shares.toFixed(2)} ${symbol}`}
      </span>
      {quote?.partial && <span className="bet-sub">partial fill — book is thin</span>}
    </button>
  );
}

/**
 *  Shown between rounds and while the first snapshot loads. A rolling series
 *  always has a next round, so this state is measured in seconds — say what is
 *  coming rather than showing a bare spinner.
 */
function WaitingCard({ state }: { state: ArcadeState }) {
  const { next, status, nowSec, series } = state;

  return (
    <section className="panel">
      <div className="round-top">
        <div>
          <div className="asset-line">
            <span className="asset-name">{next ? next.asset : "Standing by"}</span>
            {next && <span className="cadence">{intervalLabel(next.intervalSec)}</span>}
          </div>
          <p className="question">
            {next
              ? "The next round has not opened yet. It goes live the moment the series rolls."
              : status === "connecting"
                ? "Connecting to Somnia and loading the rolling series…"
                : series.length === 0
                  ? "No up/down series found on this venue right now."
                  : "No round is open on this series at the moment."}
          </p>
        </div>
        {next && (
          <div className="countdown">
            <div className="countdown-value">
              {formatCountdown(Math.max(0, next.opensAt - nowSec))}
            </div>
            <div className="countdown-label">until it opens</div>
          </div>
        )}
      </div>
      <div className="skeleton">
        {status === "connecting" ? "connecting…" : "waiting for the next round"}
      </div>
    </section>
  );
}

export type { Round };
