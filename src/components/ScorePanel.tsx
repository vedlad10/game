// Score, rank and streak.
//
// The streak is the headline because it is the game's whole loop: every
// consecutive win raises the multiplier on the next one, so the number that
// should be biggest is the one the player is trying to protect.

import { multiplierForStreak, rankProgress, winRate, type ScoreState } from "../game/scoring.ts";
import { formatAmount, formatSigned, formatXp } from "../lib/format.ts";

export function ScorePanel({ score, symbol }: { score: ScoreState; symbol: string }) {
  const { rank, next, progress } = rankProgress(score.xp);
  const decided = score.wins + score.losses;
  const multiplier = multiplierForStreak(score.streak);

  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">Your run</span>
        <span className={`rank-badge rank-${rank.tone}`}>{rank.name}</span>
      </div>

      <div className="streak-hero">
        <div>
          <div className={`streak-count${score.streak >= 3 ? " hot" : ""}`}>{score.streak}</div>
          <div className="stat-label" style={{ marginTop: 6 }}>
            streak · next win ×{multiplier.toFixed(2)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="stat-value">{formatXp(score.xp)}</div>
          <div className="stat-label">XP</div>
        </div>
      </div>

      <div className="xp-track" title={next ? `${formatXp(next.min - score.xp)} XP to ${next.name}` : "Top rank"}>
        <div className="xp-fill" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="score-grid">
        <div className="stat">
          <div className="stat-value">
            {decided === 0 ? "—" : `${Math.round(winRate(score) * 100)}%`}
          </div>
          <div className="stat-label">win rate</div>
        </div>
        <div className="stat">
          <div className="stat-value">{score.bestStreak}</div>
          <div className="stat-label">best streak</div>
        </div>
        <div className="stat">
          <div
            className="stat-value"
            style={{ color: score.pnl > 0 ? "var(--up)" : score.pnl < 0 ? "var(--down)" : undefined }}
          >
            {formatSigned(score.pnl)}
          </div>
          <div className="stat-label">net {symbol}</div>
        </div>
      </div>

      <div className="score-grid" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="stat">
          <div className="stat-value">{score.wins}</div>
          <div className="stat-label">won</div>
        </div>
        <div className="stat">
          <div className="stat-value">{score.losses}</div>
          <div className="stat-label">lost</div>
        </div>
        <div className="stat">
          <div className="stat-value">{formatAmount(score.staked)}</div>
          <div className="stat-label">volume</div>
        </div>
      </div>
    </section>
  );
}
