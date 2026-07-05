"use client";

// Compact, read-only rendering of one readings table — used in a watch's history timeline.

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TimegrapherReading } from "@/types";

export function ReadingsView({ readings }: { readings: TimegrapherReading[] }) {
  return (
    <div className="border rounded-md overflow-auto">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="text-xs w-[120px]">Position</TableHead>
            <TableHead className="text-xs">Rate</TableHead>
            <TableHead className="text-xs">Amp</TableHead>
            <TableHead className="text-xs">B.Err</TableHead>
            <TableHead className="text-xs hidden md:table-cell">Lift</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {readings.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-semibold text-xs py-2">{r.position}</TableCell>
              <TableCell className="font-mono text-xs">{r.rate}s/d</TableCell>
              <TableCell className="font-mono text-xs">{r.amplitude}°</TableCell>
              <TableCell className="font-mono text-xs">{r.beatError}ms</TableCell>
              <TableCell className="font-mono text-xs hidden md:table-cell text-muted-foreground">{r.liftAngle}°</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
