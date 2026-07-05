// Local persistence for the watch archive (localStorage). Watches own a chronological list of
// dated readings-tables. A one-time migration folds any legacy flat "chronoSessions" archive into
// the watch model so no existing data is lost.

import type { Watch, CustomerSession, TimegrapherReading } from "@/types";

const KEY = "chronoWatches";
const LEGACY_KEY = "chronoSessions";

const matchKey = (name: string, ref: string) => `${name.trim().toLowerCase()}|${ref.trim().toLowerCase()}`;

export function loadWatches(): Watch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Watch[];
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const migrated = (JSON.parse(legacy) as CustomerSession[]).map(sessionToWatch);
      if (migrated.length) localStorage.setItem(KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch (e) {
    console.error("Failed to load watches from localStorage", e);
  }
  return [];
}

export function saveWatches(watches: Watch[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(watches));
  } catch (e) {
    console.error("Failed to save watches to localStorage", e);
  }
}

// Append `readings` as a new dated table under the watch matched by (name, ref), creating the watch
// if none matches. The touched/created watch moves to the front, and its newest table is first.
export function addTableToWatches(
  watches: Watch[],
  name: string,
  refNumber: string,
  readings: TimegrapherReading[],
): Watch[] {
  const now = new Date().toISOString();
  const table = { id: `tbl-${Date.now()}`, createdAt: now, readings };
  const target = matchKey(name || "Untitled watch", refNumber);
  const idx = watches.findIndex((w) => matchKey(w.name, w.refNumber) === target);

  if (idx >= 0) {
    const updated: Watch = { ...watches[idx], tables: [table, ...watches[idx].tables] };
    return [updated, ...watches.filter((_, i) => i !== idx)];
  }
  const created: Watch = {
    id: `watch-${Date.now()}`,
    name: name.trim() || "Untitled watch",
    refNumber: refNumber.trim(),
    createdAt: now,
    tables: [table],
  };
  return [created, ...watches];
}

function sessionToWatch(s: CustomerSession): Watch {
  return {
    id: `watch-${s.id}`,
    name: s.customerName || "Untitled watch",
    refNumber: s.refNumber || "",
    createdAt: s.createdAt,
    tables: [{ id: `tbl-${s.id}`, createdAt: s.createdAt, readings: s.readings }],
  };
}
