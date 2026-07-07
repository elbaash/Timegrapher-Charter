// Parses raw OCR text from a Weishi timegrapher photo into structured fields.
//
// The readout is a value line like:  +34s/d  206°  2.4ms  52.0°  [18000]  under fixed headers.
// Real-world OCR frequently DROPS or mangles the unit symbols (° and ms) and loses the +/- sign,
// so anchoring on units is fragile. Instead we take the rate from just before the "s/d" token, then
// assign the remaining numbers by VALUE RANGE in their fixed on-screen order. Everything is optional;
// the human review step corrects the rest. `score` counts fields found, used to pick the best rotation.
//
// Lift angle is deliberately NOT parsed: it's effectively always the machine default (52), OCRs
// unreliably, and a stray graph marker could be mistaken for it — the caller defaults it instead.

export type ParsedReading = {
  rate: string;       // s/d, e.g. "34" / "-77"  (sign often lost to OCR; user re-adds in Review)
  amplitude: string;  // degrees, e.g. "206"
  beatError: string;  // ms, e.g. "2.4"
  liftAngle: string;  // left empty here; caller defaults to "52"
  beatRate: string;   // bph, e.g. "18000" (informational; not yet stored)
  score: number;
};

export function parseReadingText(raw: string): ParsedReading {
  const text = raw.replace(/\s+/g, " ").trim();
  const out: ParsedReading = { rate: "", amplitude: "", beatError: "", liftAngle: "", beatRate: "", score: 0 };

  // Rate: 1–3 digit number (optional sign) before an "s/d"-like token. The unit letter often garbles
  // (s → ¢/c) or drops entirely, so allow an optional letter and optional slash before a terminal "d".
  // "…d" may be followed immediately by the amplitude digits (e.g. PaddleOCR emits "+34s/d206"),
  // so match the trailing d when it's NOT followed by another letter rather than requiring a word break.
  const rateM = text.match(/([+\-]?\d{1,3})\s*(?:[a-z¢$]\s*)?\/?\s*d(?![a-zA-Z])/i);
  let region = text;
  if (rateM) {
    out.rate = rateM[1].replace(/\s+/g, "");
    region = text.slice((rateM.index ?? 0) + rateM[0].length);
  }

  // Numeric tokens after the rate, assigned by range in on-screen order.
  const toks = (region.match(/[+\-]?\d+(?:\.\d+)?/g) ?? []).map((s) => ({ s, n: parseFloat(s) }));
  const isInt = (t: { s: string }) => !t.s.includes(".");
  const clean = (s: string) => s.replace(/^\+/, "");

  const amp = toks.find((t) => isInt(t) && t.n >= 100 && t.n < 360);   // amplitude 100–359°
  if (amp) out.amplitude = clean(amp.s);

  // Beat error: prefer an explicit small decimal (0.0–11.9). If OCR dropped the decimal point
  // ("0.2ms" → "02ms"), fall back to the integer that sits right after amplitude and re-insert it.
  const be = toks.find((t) => t.s.includes(".") && t.n >= 0 && t.n < 12);
  if (be) {
    out.beatError = clean(be.s);
  } else if (amp) {
    const next = toks[toks.indexOf(amp) + 1];
    // The value right after amplitude is beat error. If OCR dropped the decimal, re-insert it
    // ("24"→"2.4", "07"→"0.7"). Skip values ~52 so we don't mistake the lift angle for beat error.
    const liftLike = !!next && next.n >= 48 && next.n <= 56;
    if (next && isInt(next) && next.n >= 0 && next.n < 100 && !liftLike) {
      const d = clean(next.s);
      out.beatError = d.length >= 2 ? `${d[0]}.${d[1]}` : `0.${d}`;
    }
  }

  const br = toks.find((t) => isInt(t) && t.n >= 10000 && t.n < 30000); // beat rate (bph)
  if (br) out.beatRate = br.s;

  // Lift angle (L.A. on the display) sits around 52°, a distinct range from the other fields.
  // Clean OCR reads it reliably off the value line; the caller still defaults to "52" if it's missing.
  const la = toks.find((t) => t.n >= 45 && t.n <= 58);
  if (la) out.liftAngle = clean(la.s);

  out.score = [out.rate, out.amplitude, out.beatError, out.beatRate].filter(Boolean).length;
  return out;
}
