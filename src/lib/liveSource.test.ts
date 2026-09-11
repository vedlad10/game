import { describe, expect, it } from "vitest";
import { averageFillProbability, pickCollateralCode, walkBook } from "./liveSource.ts";

describe("walkBook", () => {
  it("spends the stake best-price first", () => {
    // 10 collateral against 100 shares offered at 0.20 → 50 shares, all at 0.20.
    const got = walkBook(
      [
        [0.2, 100],
        [0.3, 100],
      ],
      10,
    );
    expect(got.shares).toBeCloseTo(50);
    expect(got.avgPrice).toBeCloseTo(0.2);
    expect(got.partial).toBe(false);
  });

  it("sweeps into deeper levels and averages across them", () => {
    // 0.20 level holds only 10 shares (2 collateral); the rest goes at 0.50.
    const got = walkBook(
      [
        [0.2, 10],
        [0.5, 100],
      ],
      12,
    );
    expect(got.shares).toBeCloseTo(10 + 20); // 10 @ 0.20, then 10 collateral @ 0.50
    expect(got.spent).toBeCloseTo(12);
    expect(got.avgPrice).toBeCloseTo(12 / 30);
  });

  it("flags a partial fill when the book runs out", () => {
    const got = walkBook([[0.5, 4]], 100);
    expect(got.shares).toBeCloseTo(4);
    expect(got.spent).toBeCloseTo(2);
    expect(got.partial).toBe(true);
  });

  it("returns nothing on an empty book rather than dividing by zero", () => {
    const got = walkBook([], 10);
    expect(got.shares).toBe(0);
    expect(got.avgPrice).toBe(0);
    expect(got.partial).toBe(true);
  });

  it("skips levels outside (0, 1) — those are not real binary crossings", () => {
    const got = walkBook(
      [
        [0, 100],
        [1, 100],
        [1.4, 100],
        [-0.2, 100],
        [0.25, 100],
      ],
      10,
    );
    expect(got.avgPrice).toBeCloseTo(0.25);
    expect(got.shares).toBeCloseTo(40);
  });

  it("skips zero-size levels", () => {
    const got = walkBook(
      [
        [0.1, 0],
        [0.4, 50],
      ],
      4,
    );
    expect(got.avgPrice).toBeCloseTo(0.4);
  });

  it("never spends more than the stake", () => {
    const got = walkBook(
      [
        [0.1, 1_000],
        [0.9, 1_000],
      ],
      7,
    );
    expect(got.spent).toBeLessThanOrEqual(7 + 1e-9);
  });
});

describe("averageFillProbability", () => {
  const one = 10 ** 6; // 6-decimal collateral

  it("volume-weights the fills rather than averaging prices", () => {
    const info = {
      fills: [
        { fillPrice: 0.2 * one, quantityFilled: 90 * one },
        { fillPrice: 0.9 * one, quantityFilled: 10 * one },
      ],
    };
    // VWAP = (0.2*90 + 0.9*10) / 100 = 0.27 — a plain mean would say 0.55.
    expect(averageFillProbability(info, "UP", 6)).toBeCloseTo(0.27);
  });

  it("takes the complement for a DOWN buy, since fills are quoted in YES terms", () => {
    const info = { fills: [{ fillPrice: 0.3 * one, quantityFilled: 5 * one }] };
    expect(averageFillProbability(info, "UP", 6)).toBeCloseTo(0.3);
    expect(averageFillProbability(info, "DOWN", 6)).toBeCloseTo(0.7);
  });

  it("returns null with no usable fills so the caller keeps its estimate", () => {
    expect(averageFillProbability({ fills: [] }, "UP", 6)).toBeNull();
    expect(averageFillProbability({}, "UP", 6)).toBeNull();
    expect(averageFillProbability(null, "UP", 6)).toBeNull();
    expect(averageFillProbability({ fills: "nope" }, "UP", 6)).toBeNull();
  });

  it("ignores malformed fills instead of poisoning the average with NaN", () => {
    const info = {
      fills: [
        { fillPrice: "abc", quantityFilled: 5 * one },
        { fillPrice: 0.4 * one, quantityFilled: 5 * one },
        { fillPrice: 0.4 * one, quantityFilled: 0 },
      ],
    };
    expect(averageFillProbability(info, "UP", 6)).toBeCloseTo(0.4);
  });

  it("clamps a degenerate result into a usable probability", () => {
    const info = { fills: [{ fillPrice: 0, quantityFilled: 5 * one }] };
    const p = averageFillProbability(info, "UP", 6);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(1);
  });
});

describe("pickCollateralCode", () => {
  const sheet = ["tUSDC", "STT", "WETH", "SOL"];

  it("matches the testnet spelling of the venue's collateral", () => {
    // The unified market quotes "USDC"; the token on Shannon is "tUSDC".
    expect(pickCollateralCode(sheet, "USDC")).toBe("tUSDC");
  });

  it("prefers an exact match over a prefixed one", () => {
    expect(pickCollateralCode(["USDC", "tUSDC"], "USDC")).toBe("USDC");
  });

  it("matches case-insensitively", () => {
    expect(pickCollateralCode(["usdc"], "USDC")).toBe("usdc");
  });

  it("strips a t prefix in the other direction too", () => {
    expect(pickCollateralCode(["USDC"], "tUSDC")).toBe("USDC");
  });

  it("returns null rather than guessing an unrelated token", () => {
    // The old fallback took the first key, reporting WETH under a USDC label.
    expect(pickCollateralCode(["WETH", "SOL"], "USDC")).toBeNull();
    expect(pickCollateralCode([], "USDC")).toBeNull();
  });
});
