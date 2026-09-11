import { describe, expect, it } from "vitest";
import { build } from "./PriceChart.tsx";
import type { PriceTick } from "../lib/types.ts";

const H = 178;

/** An ascending ramp, oldest first. */
function ramp(n = 10, startMs = 1_000_000): PriceTick[] {
  return Array.from({ length: n }, (_, i) => ({ t: startMs + i * 1000, price: 100 + i }));
}

/** Every x coordinate in a path string. */
function xs(path: string): number[] {
  return [...path.matchAll(/[ML]([\d.]+)\s/g)].map((m) => Number(m[1]));
}

describe("PriceChart projection", () => {
  it("projects an ascending series across the full width", () => {
    const view = build(ramp(), null, H)!;
    const x = xs(view.path);
    expect(x[0]).toBeLessThan(x[x.length - 1]!);
    expect(Math.min(...x)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...x)).toBeLessThanOrEqual(600);
  });

  it("renders a newest-first feed identically to an oldest-first one", () => {
    // The live oracle tape arrives newest-first. Projecting it unsorted made
    // span negative, clamped it to 1, and threw the line thousands of units
    // off-canvas — the chart looked empty.
    const asc = build(ramp(), null, H)!;
    const desc = build([...ramp()].reverse(), null, H)!;
    expect(desc.path).toBe(asc.path);
  });

  it("keeps a reversed feed's coordinates on canvas", () => {
    const view = build([...ramp()].reverse(), null, H)!;
    const x = xs(view.path);
    expect(Math.min(...x)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...x)).toBeLessThanOrEqual(600);
  });

  it("ends the line at the newest point regardless of input order", () => {
    const view = build([...ramp()].reverse(), null, H)!;
    expect(view.last.price).toBe(109);
  });

  it("includes the reference level in the vertical range", () => {
    // A window that excluded the deciding level would hide the only thing
    // that matters.
    const view = build(ramp(), 500, H)!;
    expect(view.max).toBeGreaterThanOrEqual(500);
    expect(view.refY).not.toBeNull();
    expect(view.refY!).toBeGreaterThanOrEqual(0);
    expect(view.refY!).toBeLessThanOrEqual(H);
  });

  it("survives a dead-flat series instead of dividing by zero", () => {
    const flat: PriceTick[] = [
      { t: 1, price: 50 },
      { t: 2, price: 50 },
      { t: 3, price: 50 },
    ];
    const view = build(flat, null, H)!;
    expect(view).not.toBeNull();
    expect(xs(view.path).every(Number.isFinite)).toBe(true);
  });

  it("returns null with too few usable points", () => {
    expect(build([], null, H)).toBeNull();
    expect(build([{ t: 1, price: 10 }], null, H)).toBeNull();
    expect(build([{ t: 1, price: 0 }, { t: 2, price: -5 }], null, H)).toBeNull();
  });
});
