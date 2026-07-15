import { describe, it, expect } from "vitest";
import { mergeWatches, parseBackup, buildBackup, addTableToWatches } from "./watch-store";
import type { Watch, TimegrapherReading } from "@/types";

const reading = (id: string): TimegrapherReading => ({
  id, timestamp: "2026-07-13T10:00:00Z", position: "Dial Up",
  rate: "+4", amplitude: "290", beatError: "0.2", liftAngle: "52",
});

const watch = (name: string, ref: string, tableIds: string[]): Watch => ({
  id: `w-${name}`, name, refNumber: ref, createdAt: "2026-07-13T10:00:00Z",
  tables: tableIds.map((t) => ({ id: t, createdAt: "2026-07-13T10:00:00Z", readings: [reading(t + "-r")] })),
});

describe("mergeWatches", () => {
  it("re-importing the same backup adds nothing", () => {
    const existing = [watch("Omega", "A", ["t1"])];
    const { merged, addedWatches, addedTables } = mergeWatches(existing, existing);
    expect(addedWatches).toBe(0);
    expect(addedTables).toBe(0);
    expect(merged[0].tables).toHaveLength(1);
  });

  it("unions tables by id and never deletes", () => {
    const existing = [watch("Omega", "A", ["t1"])];
    const incoming = [watch("Omega", "A", ["t1", "t2"]), watch("Rolex", "B", ["t3"])];
    const { merged, addedWatches, addedTables } = mergeWatches(existing, incoming);
    expect(addedWatches).toBe(1);
    expect(addedTables).toBe(2);
    expect(merged.find((w) => w.name === "Omega")!.tables.map((t) => t.id).sort()).toEqual(["t1", "t2"]);
  });
});

describe("parseBackup", () => {
  it("round-trips buildBackup output", () => {
    const w = [watch("Omega", "A", ["t1"])];
    expect(parseBackup(JSON.parse(JSON.stringify(buildBackup(w))))).toEqual(w);
  });

  it("rejects non-backup JSON", () => {
    expect(() => parseBackup({ hello: "world" })).toThrow(/backup/i);
  });
});

describe("addTableToWatches", () => {
  it("appends to a matching watch (case-insensitive name+ref) and moves it to front", () => {
    const existing = [watch("Rolex", "B", ["t3"]), watch("Omega", "A", ["t1"])];
    const next = addTableToWatches(existing, "omega", "a", [reading("r-new")]);
    expect(next[0].name).toBe("Omega");
    expect(next[0].tables).toHaveLength(2);
    expect(next).toHaveLength(2);
  });

  it("creates a new watch when nothing matches", () => {
    const next = addTableToWatches([], "New Watch", "X", [reading("r1")]);
    expect(next).toHaveLength(1);
    expect(next[0].tables).toHaveLength(1);
  });
});
