// Persistence for the watch archive. Primary store is IndexedDB (durable against phone-browser
// quota pressure); localStorage keeps a best-effort mirror as a second copy and is the migration
// source for data saved by older builds ("chronoWatches", and the legacy flat "chronoSessions").
// Export/import round-trips the whole archive as a versioned JSON backup file.

import type { Watch, CustomerSession, TimegrapherReading } from "@/types";
import { idbGet, idbSet } from "@/lib/db";

const KEY = "chronoWatches";
const LEGACY_KEY = "chronoSessions";
const IDB_KEY = "watches";

export const BACKUP_SCHEMA = 1;

export type Backup = {
  app: "chronographer";
  schema: number;
  exportedAt: string;
  watches: Watch[];
};

const matchKey = (name: string, ref: string) => `${name.trim().toLowerCase()}|${ref.trim().toLowerCase()}`;

export async function loadWatches(): Promise<Watch[]> {
  if (typeof window === "undefined") return [];
  try {
    const stored = await idbGet<Watch[]>(IDB_KEY);
    if (stored) return stored;
    // First run on this build: migrate whatever localStorage holds into IndexedDB.
    const migrated = loadFromLocalStorage();
    if (migrated.length) await idbSet(IDB_KEY, migrated);
    return migrated;
  } catch (e) {
    console.error("Failed to load watches from IndexedDB; falling back to localStorage", e);
    return loadFromLocalStorage();
  }
}

function loadFromLocalStorage(): Watch[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Watch[];
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) return (JSON.parse(legacy) as CustomerSession[]).map(sessionToWatch);
  } catch (e) {
    console.error("Failed to load watches from localStorage", e);
  }
  return [];
}

export async function saveWatches(watches: Watch[]): Promise<void> {
  try {
    await idbSet(IDB_KEY, watches);
  } catch (e) {
    console.error("Failed to save watches to IndexedDB", e);
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(watches)); // second copy, best effort
  } catch {
    // localStorage full or unavailable — IndexedDB is the primary store, so ignore.
  }
}

// Ask the browser not to evict our storage under pressure. Best effort; browsers may ignore it.
export function requestPersistentStorage(): void {
  if (typeof navigator !== "undefined" && navigator.storage?.persist) {
    navigator.storage.persist().catch(() => {});
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

export function buildBackup(watches: Watch[]): Backup {
  return { app: "chronographer", schema: BACKUP_SCHEMA, exportedAt: new Date().toISOString(), watches };
}

// Accepts a parsed backup file. Throws with a human-readable message if the shape is wrong.
export function parseBackup(json: unknown): Watch[] {
  const obj = json as Partial<Backup> | null;
  if (!obj || obj.app !== "chronographer" || !Array.isArray(obj.watches)) {
    throw new Error("Not a ChronoGrapher backup file.");
  }
  if (typeof obj.schema !== "number" || obj.schema > BACKUP_SCHEMA) {
    throw new Error("This backup was made by a newer version of the app.");
  }
  for (const w of obj.watches) {
    if (typeof w?.id !== "string" || typeof w?.name !== "string" || !Array.isArray(w?.tables)) {
      throw new Error("Backup file is damaged: a watch entry is malformed.");
    }
  }
  return obj.watches as Watch[];
}

// Merge imported watches into the existing archive. Watches are matched by (name, ref); tables are
// unioned by id so re-importing the same backup never duplicates data, and importing never deletes
// anything already present. Returns the merged list plus counts for the confirmation toast.
export function mergeWatches(
  existing: Watch[],
  imported: Watch[],
): { merged: Watch[]; addedWatches: number; addedTables: number } {
  const merged = [...existing];
  let addedWatches = 0;
  let addedTables = 0;

  for (const inc of imported) {
    const idx = merged.findIndex((w) => matchKey(w.name, w.refNumber) === matchKey(inc.name, inc.refNumber));
    if (idx < 0) {
      merged.push(inc);
      addedWatches++;
      addedTables += inc.tables.length;
      continue;
    }
    const have = new Set(merged[idx].tables.map((t) => t.id));
    const newTables = inc.tables.filter((t) => !have.has(t.id));
    if (newTables.length) {
      const tables = [...merged[idx].tables, ...newTables].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      merged[idx] = { ...merged[idx], tables };
      addedTables += newTables.length;
    }
  }
  return { merged, addedWatches, addedTables };
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
