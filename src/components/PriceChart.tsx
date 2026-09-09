// The round's price chart.
//
// Inline SVG rather than a charting library: the only marks needed are a line,
// a fill, and a reference rule, and shipping a chart library to draw three
// shapes would cost more bytes than the whole app.
//
// The one idea this chart has to communicate instantly is "am I winning" — so
// the line is coloured against the round's REFERENCE level (the opening price
// the outcome is measured against), not against the left edge of the window,
// and that level is drawn as a labelled dashed rule. Above the rule is green
// and UP is winning; below is red.

import { useMemo } from "react";
import type { PriceTick } from "../lib/types.ts";
import { formatPrice } from "../lib/format.ts";

interface Props {
  ticks: PriceTick[];
  /** The level the outcome is measured against; null until the oracle posts it. */
  reference: number | null;
  /** Unix seconds the round opened — everything before it is context, not the round. */
  opensAt: number;
  height?: number;
}

const PAD_L = 2;
const PAD_R = 12;
const PAD_Y = 12;
const VIEW_W = 600;

export function PriceChart({ ticks, reference, opensAt, height = 178 }: Props) {
  const view = useMemo(() => build(ticks, reference, height), [ticks, reference, height]);

  if (!view) {
    return <div className="skeleton">waiting for the price oracle…</div>;
  }

  const { path, area, refY, last, min, max } = view;
  const winning = reference != null && last.price >= reference;
  const stroke = reference == null ? "var(--accent)" : winning ? "var(--up)" : "var(--down)";
  const openX = xForTime(ticks, opensAt * 1000);

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${VIEW_W} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={
        reference == null
          ? `Price ${formatPrice(last.price)}, no reference level yet`
          : `Price ${formatPrice(last.price)}, ${winning ? "above" : "below"} the opening level ${formatPrice(reference)}`
      }
    >
      <defs>
        <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.26" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Everything left of the round's open is prior context — dim it so the
          eye lands on the window that actually decides the bet. */}
      {openX != null && openX > PAD_L && (
        <rect x="0" y="0" width={openX} height={height} fill="rgba(0,0,0,0.28)" />
      )}
      {openX != null && openX > PAD_L && (
        <line
          x1={openX}
          y1="0"
          x2={openX}
          y2={height}
          stroke="var(--line-strong)"
          strokeWidth="1"
        />
      )}

      <path d={area} fill="url(#fillGrad)" />
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {refY != null && (
        <line
          x1="0"
          y1={refY}
          x2={VIEW_W}
          y2={refY}
          stroke="var(--muted)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.75"
        />
      )}

      {/* The live end of the line, with a halo so it reads as "now". */}
      <circle cx={last.x} cy={last.y} r="8" fill={stroke} opacity="0.18" />
      <circle cx={last.x} cy={last.y} r="3.5" fill={stroke} />

      <title>{`${formatPrice(min)} – ${formatPrice(max)}`}</title>
    </svg>
  );
}

interface View {
  path: string;
  area: string;
  refY: number | null;
  last: { x: number; y: number; price: number };
  min: number;
  max: number;
}

/**
 *  Project ticks into the viewBox. The vertical scale always includes the
 *  reference level — a chart whose window excludes the line the outcome is
 *  measured against would hide the only thing that matters.
 */
function build(ticks: PriceTick[], reference: number | null, height: number): View | null {
  const points = ticks.filter((t) => Number.isFinite(t.price) && t.price > 0);
  if (points.length < 2) return null;

  const prices = points.map((p) => p.price);
  let min = Math.min(...prices);
  let max = Math.max(...prices);
  if (reference != null && Number.isFinite(reference)) {
    min = Math.min(min, reference);
    max = Math.max(max, reference);
  }
  // A dead-flat series would divide by zero; give it a sliver of range.
  if (max - min < 1e-9) {
    const pad = Math.max(1e-6, Math.abs(max) * 0.0005);
    min -= pad;
    max += pad;
  }

  const t0 = points[0]!.t;
  const t1 = points[points.length - 1]!.t;
  const span = Math.max(1, t1 - t0);
  const innerH = height - PAD_Y * 2;

  const x = (t: number) => PAD_L + ((t - t0) / span) * (VIEW_W - PAD_L - PAD_R);
  const y = (p: number) => PAD_Y + (1 - (p - min) / (max - min)) * innerH;

  const coords = points.map((p) => ({ x: x(p.t), y: y(p.price), price: p.price }));
  const path = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
    .join(" ");
  const first = coords[0]!;
  const last = coords[coords.length - 1]!;
  const area = `${path} L${last.x.toFixed(2)} ${height} L${first.x.toFixed(2)} ${height} Z`;

  return {
    path,
    area,
    refY: reference != null && Number.isFinite(reference) ? y(reference) : null,
    last,
    min,
    max,
  };
}

/** Where a wall-clock instant falls on the x axis, or null if off-chart. */
function xForTime(ticks: PriceTick[], atMs: number): number | null {
  if (ticks.length < 2) return null;
  const t0 = ticks[0]!.t;
  const t1 = ticks[ticks.length - 1]!.t;
  if (atMs <= t0 || atMs >= t1) return null;
  const span = Math.max(1, t1 - t0);
  return PAD_L + ((atMs - t0) / span) * (VIEW_W - PAD_L - PAD_R);
}
