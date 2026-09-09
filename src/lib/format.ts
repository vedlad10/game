// Display formatting. Kept in one place so a price never renders with six
// decimals in one panel and two in another.

/** A price with sensible precision for its magnitude: $95,412.30 · $3,412.55 · $0.9421 */
export function formatPrice(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const decimals = abs >= 1000 ? 2 : abs >= 1 ? 3 : 5;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Collateral amounts, always two decimals. */
export function formatAmount(value: number | null | undefined, decimals = 2): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** A signed amount, so PnL always carries its sign: +12.40 / −3.10 */
export function formatSigned(value: number | null | undefined, decimals = 2): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const body = formatAmount(Math.abs(value), decimals);
  if (value > 0) return `+${body}`;
  if (value < 0) return `−${body}`;
  return body;
}

/** A probability as a percentage: 0.6234 → "62.3%" */
export function formatProbability(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

/** A payout multiple: 1.87 → "1.87×" */
export function formatMultiple(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "—";
  return `${value.toFixed(2)}×`;
}

/** Percentage change between two levels, signed. */
export function formatDelta(from: number | null, to: number | null): string {
  if (from == null || to == null || !Number.isFinite(from) || !Number.isFinite(to) || from === 0) {
    return "—";
  }
  const pct = ((to - from) / from) * 100;
  const sign = pct > 0 ? "+" : pct < 0 ? "−" : "";
  return `${sign}${Math.abs(pct).toFixed(3)}%`;
}

export function formatXp(xp: number): string {
  if (xp >= 10_000) return `${(xp / 1000).toFixed(1)}k`;
  return Math.round(xp).toLocaleString("en-US");
}

/** "3m ago" — relative time for a settled round. */
export function formatAgo(fromSec: number, nowSec: number): string {
  const d = Math.max(0, nowSec - fromSec);
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}
