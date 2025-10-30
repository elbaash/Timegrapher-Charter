
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimegrapherReading, POSITIONS, Position } from "@/types";
import { Save, LoaderCircle } from "lucide-react";

type ExtractedDataDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  extractedData: Omit<TimegrapherReading, "id" | "timestamp">[];
  onSave: (editedData: Omit<TimegrapherReading, "id" | "timestamp">[]) => void;
};

export function ExtractedDataDialog({ isOpen, onOpenChange, extractedData, onSave }: ExtractedDataDialogProps) {
  const [editableData, setEditableData] = useState<Omit<TimegrapherReading, "id" | "timestamp">[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditableData(JSON.parse(JSON.stringify(extractedData))); // Deep copy
    }
  }, [isOpen, extractedData]);

  const handleInputChange = (index: number, field: keyof Omit<TimegrapherReading, "id" | "timestamp" | "position">, value: string) => {
    const newData = [...editableData];
    newData[index] = { ...newData[index], [field]: value };
    setEditableData(newData);
  };
  
  const handlePositionChange = (index: number, value: Position) => {
    const newData = [...editableData];
    newData[index] = { ...newData[index], position: value };
    setEditableData(newData);
  };

  const handleSaveClick = () => {
    setIsSaving(true);
    // Simulate a save operation
    setTimeout(() => {
      onSave(editableData);
      setIsSaving(false);
      onOpenChange(false);
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Review Extracted Data</DialogTitle>
          <DialogDescription>
            Check the AI-extracted data below and make any necessary corrections before saving.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4">
          <div className="space-y-6">
            {editableData.map((data, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor={`customerName-${index}`}>Customer Name</Label>
                        <Input
                        id={`customerName-${index}`}
                        value={data.customerName}
                        onChange={(e) => handleInputChange(index, 'customerName', e.target.value)}
                        />
                    </div>
                    <div>
                        <Label htmlFor={`refNumber-${index}`}>Ref. Number</Label>
                        <Input
                        id={`refNumber-${index}`}
                        value={data.refNumber}
                        onChange={(e) => handleInputChange(index, 'refNumber', e.target.value)}
                        />
                    </div>
                </div>
                 <div>
                  <Label htmlFor={`position-${index}`}>Position</Label>
                  <Select
                    value={data.position}
                    onValueChange={(value: Position) => handlePositionChange(index, value)}
                  >
                    <SelectTrigger id={`position-${index}`}>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map(pos => <SelectItem key={pos} value={pos}>{pos}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor={`rate-${index}`}>Rate (s/d)</Label>
                    <Input
                      id={`rate-${index}`}
                      value={data.rate}
                      onChange={(e) => handleInputChange(index, 'rate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`amplitude-${index}`}>Amplitude (°)</Label>
                    <Input
                      id={`amplitude-${index}`}
                      value={data.amplitude}
                      onChange={(e) => handleInputChange(index, 'amplitude', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`beatError-${index}`}>Beat Error (ms)</Label>
                    <Input
                      id={`beatError-${index}`}
                      value={data.beatError}
                      onChange={(e) => handleInputChange(index, 'beatError', e.target.value)}
                    />
                  </div>
                   <div>
                    <Label htmlFor={`liftAngle-${index}`}>Lift Angle (°)</Label>
                    <Input
                      id={`liftAngle-${index}`}
                      value={data.liftAngle || "52"}
                       onChange={(e) => handleInputChange(index, 'liftAngle', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSaveClick} disabled={isSaving}>
            {isSaving ? <LoaderCircle className="animate-spin mr-2" /> : <Save className="mr-2" />}
            Save Readings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
