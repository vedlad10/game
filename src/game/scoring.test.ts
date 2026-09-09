import { describe, expect, it } from "vitest";
import {
  applyBet,
  EMPTY_SCORE,
  MAX_MULTIPLIER,
  multiplierForStreak,
  rankFor,
  rankProgress,
  scoreFrom,
  winRate,
  xpForWin,
  type SettledBet,
} from "./scoring.ts";

function bet(over: Partial<SettledBet> = {}): SettledBet {
  return {
    roundId: "r1",
    asset: "BTC",
    intervalSec: 60,
    direction: "UP",
    entryProbability: 0.5,
    stake: 10,
    outcome: "won",
    payout: 20,
    settledAt: 1_000,
    ...over,
  };
}

describe("multiplierForStreak", () => {
  it("starts at 1 and grows a quarter per consecutive win", () => {
    expect(multiplierForStreak(0)).toBe(1);
    expect(multiplierForStreak(1)).toBe(1.25);
    expect(multiplierForStreak(4)).toBe(2);
  });

  it("caps so a long streak cannot run away", () => {
    expect(multiplierForStreak(8)).toBe(MAX_MULTIPLIER);
    expect(multiplierForStreak(500)).toBe(MAX_MULTIPLIER);
  });

  it("treats a negative or non-finite streak as no streak", () => {
    expect(multiplierForStreak(-3)).toBe(1);
    expect(multiplierForStreak(Number.NaN)).toBe(1);
  });
});

describe("xpForWin", () => {
  it("pays more for beating a long shot than a favourite", () => {
    expect(xpForWin(0.2, 0)).toBeGreaterThan(xpForWin(0.8, 0));
  });

  it("clamps a degenerate 0 price instead of paying a jackpot", () => {
    // p=0 would otherwise imply infinite edge; the clamp lands it at p=0.01.
    expect(xpForWin(0, 0)).toBe(xpForWin(0.01, 0));
    expect(Number.isFinite(xpForWin(0, 0))).toBe(true);
  });

  it("clamps a degenerate 1 price to a floor rather than zero", () => {
    expect(xpForWin(1, 0)).toBe(xpForWin(0.99, 0));
    expect(xpForWin(1, 0)).toBeGreaterThan(0);
  });

  it("scales with the streak the player carried in", () => {
    expect(xpForWin(0.5, 4)).toBe(xpForWin(0.5, 0) * 2);
  });
});

describe("applyBet", () => {
  it("extends the streak and banks XP on a win", () => {
    const s = applyBet(EMPTY_SCORE, bet());
    expect(s.streak).toBe(1);
    expect(s.bestStreak).toBe(1);
    expect(s.wins).toBe(1);
    expect(s.xp).toBe(xpForWin(0.5, 0));
    expect(s.pnl).toBe(10);
  });

  it("breaks the streak on a loss but keeps the best", () => {
    const won = applyBet(applyBet(EMPTY_SCORE, bet()), bet({ roundId: "r2" }));
    const lost = applyBet(won, bet({ roundId: "r3", outcome: "lost", payout: 0 }));
    expect(won.streak).toBe(2);
    expect(lost.streak).toBe(0);
    expect(lost.bestStreak).toBe(2);
    expect(lost.pnl).toBe(20 - 10); // two +10 wins, then a −10 loss
  });

  it("leaves the streak untouched on a void but still moves collateral", () => {
    const won = applyBet(EMPTY_SCORE, bet());
    const voided = applyBet(won, bet({ roundId: "r2", outcome: "void", stake: 10, payout: 10 }));
    expect(voided.streak).toBe(1);
    expect(voided.voids).toBe(1);
    expect(voided.wins).toBe(1);
    expect(voided.pnl).toBe(won.pnl); // stake returned in full
    expect(voided.staked).toBe(20);
  });

  it("awards no XP for a loss", () => {
    const s = applyBet(EMPTY_SCORE, bet({ outcome: "lost", payout: 0 }));
    expect(s.xp).toBe(0);
  });
});

describe("scoreFrom", () => {
  it("replays in settlement order, not arrival order", () => {
    const out = [
      bet({ roundId: "c", settledAt: 300 }),
      bet({ roundId: "a", settledAt: 100 }),
      bet({ roundId: "b", settledAt: 200, outcome: "lost", payout: 0 }),
    ];
    const s = scoreFrom(out);
    // a(win) → b(loss, breaks) → c(win): ends on a streak of exactly 1.
    expect(s.streak).toBe(1);
    expect(s.bestStreak).toBe(1);
    expect(s.wins).toBe(2);
    expect(s.losses).toBe(1);
  });

  it("is deterministic — the same bets always yield the same score", () => {
    const bets = [bet({ roundId: "a", settledAt: 1 }), bet({ roundId: "b", settledAt: 2 })];
    expect(scoreFrom(bets)).toEqual(scoreFrom([...bets].reverse()));
  });

  it("returns the empty score for no bets", () => {
    expect(scoreFrom([])).toEqual(EMPTY_SCORE);
  });
});

describe("winRate", () => {
  it("excludes voids from the denominator", () => {
    const s = scoreFrom([
      bet({ roundId: "a", settledAt: 1 }),
      bet({ roundId: "b", settledAt: 2, outcome: "lost", payout: 0 }),
      bet({ roundId: "c", settledAt: 3, outcome: "void", payout: 10 }),
    ]);
    expect(winRate(s)).toBe(0.5);
  });

  it("is zero rather than NaN with nothing decided", () => {
    expect(winRate(EMPTY_SCORE)).toBe(0);
  });
});

describe("ranks", () => {
  it("climbs the ladder with XP", () => {
    expect(rankFor(0).name).toBe("ROOKIE");
    expect(rankFor(1_000).name).toBe("TRADER");
    expect(rankFor(999_999).name).toBe("LEGEND");
  });

  it("reports progress toward the next rank", () => {
    const { rank, next, progress } = rankProgress(1_250);
    expect(rank.name).toBe("TRADER");
    expect(next?.name).toBe("SHARP");
    expect(progress).toBeCloseTo((1_250 - 500) / (2_000 - 500));
  });

  it("pins at the top rank with no next", () => {
    const { next, progress } = rankProgress(50_000);
    expect(next).toBeNull();
    expect(progress).toBe(1);
  });
});
