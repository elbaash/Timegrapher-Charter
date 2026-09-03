"use client";

// Watch regulation calculator — enter per-position rates (or one-tap import from the
// workspace), set a target average, and get the required regulator adjustment plus the
// projected new rates. Pure math lives in src/lib/regulation.ts (unit-tested).

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { calculateRegulation, formatAdjustment, formatSigned, parseRate } from "@/lib/regulation";
import { cn } from "@/lib/utils";
import type { TimegrapherReading } from "@/types";
import { CheckCircle2, Download, Info, Plus, TrendingDown, TrendingUp, Trash2 } from "lucide-react";

type RateRow = { id: string; label: string; rate: string };

export function RegulateCalculator({ workspaceReadings }: { workspaceReadings: TimegrapherReading[] }) {
  const { toast } = useToast();
  const [rows, setRows] = useState<RateRow[]>([
    { id: "row-1", label: "Rate 1", rate: "" },
    { id: "row-2", label: "Rate 2", rate: "" },
  ]);
  const [target, setTarget] = useState("5");

  const targetNum = parseFloat(target.replace(",", "."));
  const validTarget = target.trim() !== "" && !Number.isNaN(targetNum);
  const result = validTarget ? calculateRegulation(rows, targetNum) : null;

  const updateRow = (id: string, rate: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, rate } : r)));

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  const addRow = () =>
    setRows((prev) => [...prev, { id: `row-${Date.now()}`, label: `Rate ${prev.length + 1}`, rate: "" }]);

  const handleImport = () => {
    const importable = workspaceReadings.filter((r) => parseRate(r.rate) !== null);
    if (importable.length === 0) {
      toast({
        variant: "destructive",
        title: "Nothing to Import",
        description: "The current workspace has no readings with a readable rate. Scan or enter readings on the New tab first.",
      });
      return;
    }
    setRows(
      importable.map((r, i) => ({
        id: `imp-${Date.now()}-${i}`,
        label: r.position === "Unknown" ? `Rate ${i + 1}` : r.position,
        rate: r.rate,
      }))
    );
    toast({
      title: "Rates Imported",
      description: `${importable.length} rate${importable.length === 1 ? "" : "s"} loaded from the workspace.`,
    });
  };

  return (
    <div className="grid gap-4 w-full max-w-3xl mx-auto">
      {/* Rates input */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">Rates</CardTitle>
            <CardDescription>One rate per position in s/d — signs matter (+ fast, − slow).</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleImport} disabled={workspaceReadings.length === 0}>
            <Download className="mr-2 h-4 w-4" />Use workspace
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center gap-2">
              <span className="w-28 sm:w-32 shrink-0 text-sm text-muted-foreground truncate">{row.label}</span>
              <Input
                inputMode="decimal"
                placeholder="+24"
                value={row.rate}
                onChange={(e) => updateRow(row.id, e.target.value)}
                className="h-9 flex-1"
              />
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeRow(row.id)} aria-label="Remove rate">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus className="mr-2 h-4 w-4" />Add rate
          </Button>
        </CardContent>
      </Card>

      {/* Current average */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Average</CardTitle>
          <CardDescription>Where the watch is sitting right now.</CardDescription>
        </CardHeader>
        <CardContent>
          {result ? (
            <div>
              <div className="text-4xl font-bold tabular-nums">
                {formatSigned(result.currentAverage)}{" "}
                <span className="text-base font-normal text-muted-foreground">s/d</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                across {result.count} rate{result.count === 1 ? "" : "s"}
                {result.skipped > 0
                  ? ` — ${result.skipped} empty row${result.skipped === 1 ? "" : "s"} ignored`
                  : ""}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Enter at least one rate to see the average.</p>
          )}
        </CardContent>
      </Card>

      {/* Target & adjustment results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Target &amp; Adjustment</CardTitle>
          <CardDescription>
            Set the average you want — results recalculate as you type.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 max-w-[220px]">
            <Label htmlFor="reg-target">Target average rate (s/d)</Label>
            <Input
              id="reg-target"
              inputMode="decimal"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="+5"
            />
          </div>
          {!validTarget && (
            <p className="text-xs text-amber-600">Enter a target — zero and negative values are fine.</p>
          )}

          {result ? (
            <div className="space-y-4 pt-2 border-t">
              <div className="flex items-center gap-3">
                {result.direction === "no change" ? (
                  <CheckCircle2 className="h-8 w-8 shrink-0 text-green-600" />
                ) : result.direction === "speed up" ? (
                  <TrendingUp className="h-8 w-8 shrink-0 text-green-600" />
                ) : (
                  <TrendingDown className="h-8 w-8 shrink-0 text-orange-600" />
                )}
                <div>
                  <p className="text-xl font-semibold">{formatAdjustment(result.adjustment)}</p>
                  <p className="text-xs text-muted-foreground">
                    Moves the average from {formatSigned(result.currentAverage)} to{" "}
                    {formatSigned(result.target)} s/d.
                  </p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead className="text-right">Current (s/d)</TableHead>
                    <TableHead className="text-right">Projected (s/d)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.projected.map((p, i) => (
                    <TableRow key={`${p.label}-${i}`}>
                      <TableCell className="font-medium">{p.label}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatSigned(result.entries[i]?.rate ?? 0)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums font-medium",
                          Math.abs(p.rate) <= Math.abs(result.entries[i]?.rate ?? Infinity)
                            ? "text-green-600"
                            : ""
                        )}
                      >
                        {formatSigned(p.rate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <p>
                  New average:{" "}
                  <span className="font-semibold tabular-nums">{formatSigned(result.projectedAverage)} s/d</span>{" "}
                  <span className="text-green-600">= target ✓</span>
                </p>
                <p>
                  Spread (max − min):{" "}
                  <span className="font-semibold tabular-nums">{Math.round(result.spread * 100) / 100} s/d</span>
                </p>
              </div>

              <div className="flex gap-2 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  A single regulator move shifts every position equally — the spread stays the same. Positions
                  that still differ widely need individual mechanical correction (poising, beat adjustment) on
                  later passes.
                </p>
              </div>
            </div>
          ) : validTarget ? (
            <p className="text-sm text-muted-foreground pt-2 border-t">
              Enter at least one rate to calculate the adjustment.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}