// Regulation calculator math — pure functions, fully unit-tested (see regulation.test.ts).
// Given a set of per-position rates and a target average, computes the single regulator
// adjustment that lands the average on target and projects every position's new rate.

export type RegulationDirection = "speed up" | "slow down" | "no change";

export type RegulationEntry = {
  /** Display label — e.g. "Crown Up", or "Rate 3" for manual entries. */
  label: string;
  /** Rate in seconds/day as typed/OCR'd — may carry a sign ("+24", "-46"). */
  rate: number;
};

export type RegulationResult = {
  /** Positions included in the calculation. */
  count: number;
  /** Entries skipped because their rate was blank or unparseable. */
  skipped: number;
  /** Arithmetic mean of the entered rates. */
  currentAverage: number;
  /** The user-chosen target average rate. */
  target: number;
  /** target − currentAverage. Positive = regulator towards faster. */
  adjustment: number;
  direction: RegulationDirection;
  /** The parseable input entries actually used, in order. */
  entries: RegulationEntry[];
  /** Original rate + adjustment, same order and labels as `entries`. */
  projected: RegulationEntry[];
  /** Always equals target (computed independently as a display check). */
  projectedAverage: number;
  /** Max − min across rates. Unchanged by a uniform adjustment. */
  spread: number;
};

const EPSILON = 1e-9;

/**
 * Parse a rate string like "+24", "-46", "12.5" or "0" into a number.
 * Tolerates stray units/whitespace (same sanitising convention as watch-compare.tsx).
 * Returns null for blank or unparseable input.
 */
export function parseRate(value: string): number | null {
  const n = parseFloat(String(value).replace(/[^0-9.+-]/g, ""));
  return Number.isNaN(n) ? null : n;
}

/** Arithmetic mean, or null when there are no rates. */
export function averageRate(rates: number[]): number | null {
  if (rates.length === 0) return null;
  return rates.reduce((sum, r) => sum + r, 0) / rates.length;
}

/**
 * Core regulation math.
 * - adjustment = target − currentAverage
 * - projected rate for each entry = original rate + adjustment
 * Returns null when no entry has a parseable rate.
 */
export function calculateRegulation(
  entries: { label: string; rate: string }[],
  target: number
): RegulationResult | null {
  const valid: RegulationEntry[] = [];
  let skipped = 0;
  for (const entry of entries) {
    const rate = parseRate(entry.rate);
    if (rate === null) {
      skipped++;
    } else {
      valid.push({ label: entry.label, rate });
    }
  }

  const currentAverage = averageRate(valid.map((e) => e.rate));
  if (currentAverage === null) return null;

  const adjustment = target - currentAverage;
  const projected = valid.map((e) => ({ label: e.label, rate: e.rate + adjustment }));
  const projectedAverage = averageRate(projected.map((e) => e.rate)) ?? target;
  const rates = valid.map((e) => e.rate);
  const spread = Math.max(...rates) - Math.min(...rates);

  return {
    count: valid.length,
    skipped,
    currentAverage,
    target,
    adjustment,
    direction:
      Math.abs(adjustment) < EPSILON ? "no change" : adjustment > 0 ? "speed up" : "slow down",
    entries: valid,
    projected,
    projectedAverage,
    spread,
  };
}

/** Signed display number: 16 → "+16", -11 → "-11", 0 → "0", 2.5 → "+2.5". */
export function formatSigned(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const str = Number.isInteger(rounded) ? String(rounded) : String(rounded);
  return rounded > 0 ? `+${str}` : str;
}

/** Human phrasing of the required regulator move, e.g. "Speed up by 16 s/d". */
export function formatAdjustment(adjustment: number): string {
  const rounded = Math.round(adjustment * 10) / 10;
  if (Math.abs(rounded) < EPSILON) return "No adjustment needed";
  return `${rounded > 0 ? "Speed up" : "Slow down"} by ${Math.abs(rounded)} s/d`;
}