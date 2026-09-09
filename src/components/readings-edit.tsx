"use client";

// Inline edit mode for one saved readings table in a watch's timeline — correct values/positions
// or remove individual readings, then Save or Cancel. Draft state is local; the parent persists.

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Trash2 } from "lucide-react";
import { POSITIONS, type TimegrapherData, type TimegrapherReading } from "@/types";

type EditableReadingsViewProps = {
  readings: TimegrapherReading[];
  onSave: (readings: TimegrapherReading[]) => void;
  onCancel: () => void;
};

export function EditableReadingsView({ readings, onSave, onCancel }: EditableReadingsViewProps) {
  const [draft, setDraft] = useState<TimegrapherReading[]>(() => readings.map((r) => ({ ...r })));

  const updateField = (id: string, field: keyof TimegrapherData, value: string) => {
    setDraft((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const removeReading = (id: string) => {
    setDraft((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-2">
      <div className="border rounded-md overflow-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-xs w-[130px]">Position</TableHead>
              <TableHead className="text-xs">Rate</TableHead>
              <TableHead className="text-xs">Amp</TableHead>
              <TableHead className="text-xs">B.E.</TableHead>
              <TableHead className="text-xs">L.A.</TableHead>
              <TableHead className="text-xs w-[40px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {draft.length > 0 ? (
              draft.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="py-1.5 pr-1">
                    <Select value={r.position} onValueChange={(value) => updateField(r.id, "position", value)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {POSITIONS.map((pos) => (<SelectItem key={pos} value={pos}>{pos}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="py-1.5 px-1">
                    <Input className="h-8 font-mono text-xs px-2" value={r.rate} onChange={(e) => updateField(r.id, "rate", e.target.value)} />
                  </TableCell>
                  <TableCell className="py-1.5 px-1">
                    <Input className="h-8 font-mono text-xs px-2" value={r.amplitude} onChange={(e) => updateField(r.id, "amplitude", e.target.value)} />
                  </TableCell>
                  <TableCell className="py-1.5 px-1">
                    <Input className="h-8 font-mono text-xs px-2" value={r.beatError} onChange={(e) => updateField(r.id, "beatError", e.target.value)} />
                  </TableCell>
                  <TableCell className="py-1.5 px-1">
                    <Input className="h-8 font-mono text-xs px-2" value={r.liftAngle} onChange={(e) => updateField(r.id, "liftAngle", e.target.value)} />
                  </TableCell>
                  <TableCell className="py-1.5 pl-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeReading(r.id)} title="Remove reading">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                  All readings removed — saving will delete this dated table.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="mr-1 h-4 w-4" /> Cancel
        </Button>
        <Button size="sm" onClick={() => onSave(draft)}>
          <Check className="mr-1 h-4 w-4" /> Save changes
        </Button>
      </div>
    </div>
  );
}
