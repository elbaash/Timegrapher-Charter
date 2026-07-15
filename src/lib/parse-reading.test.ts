import { describe, it, expect } from "vitest";
import { parseReadingText } from "./parse-reading";

// Smoke tests over realistic PaddleOCR output shapes seen on the 17 training photos.
describe("parseReadingText", () => {
  it("parses a clean value line", () => {
    const p = parseReadingText("RATE AMP. B.E. L.A. GAIN +34s/d 206° 2.4ms 52.0°");
    expect(p.rate).toBe("+34");
    expect(p.amplitude).toBe("206");
    expect(p.beatError).toBe("2.4");
    expect(p.liftAngle).toBe("52.0");
    expect(p.score).toBeGreaterThanOrEqual(3);
  });

  it("survives lost units and merged tokens", () => {
    const p = parseReadingText("+34s/d206 24ms 520");
    expect(p.rate).toBe("+34");
    expect(p.amplitude).toBe("206");
    expect(p.beatError).toBe("2.4"); // decimal re-inserted
  });

  it("keeps a negative rate's sign", () => {
    const p = parseReadingText("-77 s/d 255° 0.3ms 52.0°");
    expect(p.rate).toBe("-77");
    expect(p.beatError).toBe("0.3");
  });

  it("returns score 0 on garbage", () => {
    expect(parseReadingText("no reading here").score).toBe(0);
  });
});
