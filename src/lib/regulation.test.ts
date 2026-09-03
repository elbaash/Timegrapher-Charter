import { describe, it, expect } from "vitest";
import { calculateRegulation, averageRate, parseRate, formatAdjustment, formatSigned } from "./regulation";

// Regulation calculator math. Spec verification example:
// rates [+24, -46], target +5 → average -11, adjustment +16, projected [+40, -30], new average +5.
describe("calculateRegulation", () => {
  const rows = (rates: string[]) => rates.map((rate, i) => ({ label: `Rate ${i + 1}`, rate }));

  it("matches the spec example: [+24, -46] with target +5", () => {
    const r = calculateRegulation(rows(["+24", "-46"]), 5);
    expect(r).not.toBeNull();
    expect(r!.count).toBe(2);
    expect(r!.currentAverage).toBe(-11);
    expect(r!.adjustment).toBe(16);
    expect(r!.direction).toBe("speed up");
    expect(r!.projected.map((p) => p.rate)).toEqual([40, -30]);
    expect(r!.projectedAverage).toBe(5);
  });

  it("recalculates when the target changes (0, -2, +10)", () => {
    expect(calculateRegulation(rows(["+24", "-46"]), 0)!.adjustment).toBe(11);
    expect(calculateRegulation(rows(["+24", "-46"]), -2)!.adjustment).toBe(9);
    expect(calculateRegulation(rows(["+24", "-46"]), 10)!.adjustment).toBe(21);
  });

  it("handles negative and zero rates", () => {
    const r = calculateRegulation(rows(["0", "-10"]), -5)!;
    expect(r.currentAverage).toBe(-5);
    expect(r.adjustment).toBe(0);
    expect(r.direction).toBe("no change");
    expect(r.projected.map((p) => p.rate)).toEqual([0, -10]);
  });

  it("reports slow down when the target is below the current average", () => {
    const r = calculateRegulation(rows(["+20", "+30"]), 5)!;
    expect(r.currentAverage).toBe(25);
    expect(r.adjustment).toBe(-20);
    expect(r.direction).toBe("slow down");
    expect(r.projected.map((p) => p.rate)).toEqual([0, 10]);
  });

  it("skips blank and unparseable rows and counts them", () => {
    const r = calculateRegulation(rows(["+24", "", "abc", "-46"]), 5)!;
    expect(r.count).toBe(2);
    expect(r.skipped).toBe(2);
    expect(r.currentAverage).toBe(-11);
  });

  it("returns null when nothing parseable is entered", () => {
    expect(calculateRegulation(rows([]), 5)).toBeNull();
    expect(calculateRegulation(rows(["", "n/a"]), 5)).toBeNull();
  });

  it("works with a single rate", () => {
    const r = calculateRegulation(rows(["-3"]), 5)!;
    expect(r.adjustment).toBe(8);
    expect(r.projected[0].rate).toBe(5);
    expect(r.spread).toBe(0);
  });

  it("keeps the spread (max − min) unchanged by the adjustment", () => {
    const r = calculateRegulation(rows(["+24", "-46", "+10"]), 5)!;
    expect(r.spread).toBe(24 - -46);
    const projRates = r.projected.map((p) => p.rate);
    expect(Math.max(...projRates) - Math.min(...projRates)).toBe(r.spread);
  });

  it("accepts decimal rates", () => {
    const r = calculateRegulation(rows(["+2.5", "-4.5"]), 1)!;
    expect(r.currentAverage).toBe(-1);
    expect(r.adjustment).toBe(2);
    expect(r.projected.map((p) => p.rate)).toEqual([4.5, -2.5]);
  });
});

describe("parseRate", () => {
  it("parses signed, plain and decimal inputs", () => {
    expect(parseRate("+24")).toBe(24);
    expect(parseRate("-46")).toBe(-46);
    expect(parseRate("0")).toBe(0);
    expect(parseRate("12.5")).toBe(12.5);
  });

  it("tolerates stray units and whitespace", () => {
    expect(parseRate(" +24 s/d ")).toBe(24);
  });

  it("returns null for blanks and garbage", () => {
    expect(parseRate("")).toBeNull();
    expect(parseRate("   ")).toBeNull();
    expect(parseRate("abc")).toBeNull();
  });
});

describe("averageRate", () => {
  it("computes the arithmetic mean", () => {
    expect(averageRate([24, -46])).toBe(-11);
    expect(averageRate([1, 2, 3])).toBe(2);
  });

  it("returns null for an empty list", () => {
    expect(averageRate([])).toBeNull();
  });
});

describe("formatting", () => {
  it("phrases the adjustment with direction", () => {
    expect(formatAdjustment(16)).toBe("Speed up by 16 s/d");
    expect(formatAdjustment(-20)).toBe("Slow down by 20 s/d");
    expect(formatAdjustment(0)).toBe("No adjustment needed");
  });

  it("signs display numbers", () => {
    expect(formatSigned(16)).toBe("+16");
    expect(formatSigned(-11)).toBe("-11");
    expect(formatSigned(0)).toBe("0");
    expect(formatSigned(2.5)).toBe("+2.5");
  });
});