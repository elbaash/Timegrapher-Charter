"use client";

// Progression view for a watch: a grid of position × every dated attempt (oldest → newest) for a
// chosen metric, so the watchmaker can watch the readings converge across as many regulation
// passes as it takes. Not limited to two — every table the watch has is a column.

import { useState } from "react";
import type { Watch, Position } from "@/types";
import { POSITIONS } from "@/types";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const METRICS = [
  { key: "rate", label: "Rate", suffix: "s/d", towardZero: true },
  { key: "amplitude", label: "Amplitude", suffix: "°", towardZero: false },
  { key: "beatError", label: "Beat Error", suffix: "ms", towardZero: true },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];

function toNumber(value: string): number | null {
  const n = parseFloat(String(value).replace(/[^0-9.+-]/g, ""));
  return Number.isNaN(n) ? null : n;
}

export function WatchCompare({ watch }: { watch: Watch }) {
  const [metricKey, setMetricKey] = useState<MetricKey>("rate");
  const metric = METRICS.find((m) => m.key === metricKey)!;

  // Oldest → newest so progress reads left-to-right.
  const tables = [...watch.tables].reverse();
  // Positions that appear in any table, in canonical order.
  const positions = POSITIONS.filter((p) => tables.some((t) => t.readings.some((r) => r.position === p)));

  const valueAt = (tableIndex: number, pos: Position): string => {
    const r = tables[tableIndex]?.readings.find((rr) => rr.position === pos);
    return r ? (r[metricKey] ?? "") : "";
  };

  if (tables.length < 2) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Add at least two readings tables to this watch to see its progress. Each “Save to Watch” adds another.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {METRICS.map((m) => (
          <Button key={m.key} variant={m.key === metricKey ? "default" : "outline"} size="sm" onClick={() => setMetricKey(m.key)}>
            {m.label}
          </Button>
        ))}
      </div>

      <div className="border rounded-md overflow-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-xs sticky left-0 bg-muted/30 z-10">Position</TableHead>
              {tables.map((t, i) => (
                <TableHead key={t.id} className="text-xs whitespace-nowrap text-right">
                  <div>#{i + 1}</div>
                  <div className="text-[10px] font-normal text-muted-foreground">{format(new Date(t.createdAt), "d MMM HH:mm")}</div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((pos) => (
              <TableRow key={pos}>
                <TableCell className="text-xs font-semibold sticky left-0 bg-background z-10">{pos}</TableCell>
                {tables.map((t, i) => {
                  const raw = valueAt(i, pos);
                  const curr = toNumber(raw);
                  const prev = i > 0 ? toNumber(valueAt(i - 1, pos)) : null;
                  let trend: "better" | "worse" | null = null;
                  if (metric.towardZero && curr !== null && prev !== null) {
                    if (Math.abs(curr) < Math.abs(prev)) trend = "better";
                    else if (Math.abs(curr) > Math.abs(prev)) trend = "worse";
                  }
                  return (
                    <TableCell
                      key={t.id}
                      className={cn(
                        "text-xs font-mono text-right",
                        trend === "better" && "text-green-500",
                        trend === "worse" && "text-amber-500",
                      )}
                    >
                      {raw !== "" ? `${raw}${metric.suffix}` : "—"}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Oldest attempt on the left. For rate and beat error, <span className="text-green-500">green</span> means closer to zero than the previous attempt,{" "}
        <span className="text-amber-500">amber</span> means further away.
      </p>
    </div>
  );
}
