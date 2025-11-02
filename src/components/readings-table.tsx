
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { TimegrapherReading } from "@/types";
import { Clock, Gauge, Activity, HeartPulse, Share2, Printer, ListX, Zap, Trash2, Save } from "lucide-react";
import { format } from "date-fns";

type ReadingsTableProps = {
  readings: TimegrapherReading[];
  setReadings: React.Dispatch<React.SetStateAction<TimegrapherReading[]>>;
  customerName: string;
  refNumber: string;
  onSave: () => void;
};

export function ReadingsTable({ readings, setReadings, customerName, refNumber, onSave }: ReadingsTableProps) {
  const { toast } = useToast();

  const handleClearAll = () => {
    setReadings([]);
    toast({
      title: "Readings Cleared",
      description: "All entries have been removed from the current session.",
    });
  };

  const formatReadingsAsText = () => {
    if (readings.length === 0) return "No readings to share.";

    let text = `ChronoGrapher Readings for ${customerName} (${refNumber}):\n\n`;
    readings.forEach((reading) => {
      text += `${format(new Date(reading.timestamp), 'Pp')}\n`;
      text += `   - Position: ${reading.position}\n`;
      text += `   - Rate: ${reading.rate} s/d\n`;
      text += `   - Amplitude: ${reading.amplitude}°\n`;
      text += `   - Beat Error: ${reading.beatError} ms\n`;
      text += `   - Lift Angle: ${reading.liftAngle}°\n\n`;
    });
    return text;
  };

  const handleShare = async () => {
    const shareText = formatReadingsAsText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: "ChronoGrapher Readings",
          text: shareText,
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          toast({
            variant: "destructive",
            title: "Sharing failed",
            description: "Could not share the readings.",
          });
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied to clipboard",
          description: "Readings have been copied to your clipboard.",
        });
      } catch (error) {
         toast({
          variant: "destructive",
          title: "Copy failed",
          description: "Could not copy readings to clipboard.",
        });
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };
  
  const printHeader = (
    <div className="print-only hidden">
        <div className="pt-8">
            <h1 className="text-2xl font-bold text-center mb-2 font-headline">ChronoGrapher Readings</h1>
            <div className="text-center text-sm text-muted-foreground mb-6">
              <p>{format(new Date(), 'PP')}</p>
              <p>Customer: <span className="font-semibold">{customerName}</span> | Ref #: <span className="font-semibold">{refNumber}</span></p>
            </div>
        </div>
    </div>
  );

  return (
    <>
      <div className="print-container hidden print:block">
        {printHeader}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Rate (s/d)</TableHead>
              <TableHead>Amplitude (°)</TableHead>
              <TableHead>Beat Error (ms)</TableHead>
              <TableHead>Lift Angle (°)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {readings.map((reading) => (
              <TableRow key={reading.id}>
                <TableCell>{format(new Date(reading.timestamp), "Pp")}</TableCell>
                <TableCell>{reading.position}</TableCell>
                <TableCell className="font-medium">{reading.rate}</TableCell>
                <TableCell>{reading.amplitude}</TableCell>
                <TableCell>{reading.beatError}</TableCell>
                <TableCell>{reading.liftAngle}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Card className="flex flex-col flex-grow no-print">
        <CardHeader>
          <CardTitle className="font-headline">Current Session</CardTitle>
          <CardDescription>
            Readings for <span className="font-bold">{customerName || "New Customer"} ({refNumber || "N/A"})</span>. Add or upload data to this session.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex-grow">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Timestamp
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Position
                    </div>
                  </TableHead>
                  <TableHead>
                     <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4" /> Rate (s/d)
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" /> Amplitude (°)
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <HeartPulse className="h-4 w-4" /> Beat Error (ms)
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" /> Lift Angle (°)
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readings.length > 0 ? (
                  readings.map((reading) => (
                    <TableRow key={reading.id}>
                      <TableCell>{format(new Date(reading.timestamp), "Pp")}</TableCell>
                      <TableCell>{reading.position}</TableCell>
                      <TableCell className="font-medium">{reading.rate}</TableCell>
                      <TableCell>{reading.amplitude}</TableCell>
                      <TableCell>{reading.beatError}</TableCell>
                      <TableCell>{reading.liftAngle}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No readings yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
           {readings.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 h-full">
              <ListX className="h-16 w-16 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold tracking-tight font-headline">No Readings Yet</h3>
              <p className="text-muted-foreground">Upload an image or enter data manually to start.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-end gap-2 mt-auto no-print">
          <Button variant="destructive" onClick={handleClearAll} disabled={readings.length === 0}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Current
          </Button>
           <Button variant="secondary" onClick={onSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Session
          </Button>
          <Button variant="outline" onClick={handleShare} disabled={readings.length === 0}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button onClick={handlePrint} disabled={readings.length === 0}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}

    