// Recent outcomes of the series as a run of pips.
//
// A row of coloured squares beats a table here: the only question a player asks
// of round history is "what has this series been doing lately", and a streak of
// six greens answers that in one glance. Pending rounds show as a dash rather
// than being hidden, so the run never silently skips a round.

import { intervalLabel, type Round } from "../lib/rounds.ts";

export function HistoryStrip({ rounds }: { rounds: Round[] }) {
  const shown = rounds.slice(0, 24);
  const decided = shown.filter((r) => r.winner !== null);
  const ups = decided.filter((r) => r.winner === "UP").length;

  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">Recent rounds</span>
        {decided.length > 0 && (
          <span className="panel-title" style={{ letterSpacing: 0 }}>
            {ups}▲ / {decided.length - ups}▼
          </span>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="empty">No settled rounds on this series yet.</p>
      ) : (
        <div className="pips">
          {shown.map((round) => (
            <span
              key={round.id}
              className={`pip ${round.winner === "UP" ? "up" : round.winner === "DOWN" ? "down" : "pend"}`}
              title={`${round.asset} ${intervalLabel(round.intervalSec)} — ${
                round.winner
                  ? `${round.winner} won`
                  : round.phase === "voided"
                    ? "voided"
                    : "awaiting the oracle"
              }`}
            >
              {round.winner === "UP" ? "▲" : round.winner === "DOWN" ? "▼" : "·"}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
