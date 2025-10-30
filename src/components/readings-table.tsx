
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
import { Clock, Gauge, Activity, HeartPulse, Share2, Printer, ListX, User, Hash, Zap, Trash2, MapPin } from "lucide-react";
import { format } from "date-fns";

type ReadingsTableProps = {
  readings: TimegrapherReading[];
  setReadings: React.Dispatch<React.SetStateAction<TimegrapherReading[]>>;
};

export function ReadingsTable({ readings, setReadings }: ReadingsTableProps) {
  const { toast } = useToast();

  const handleClearAll = () => {
    setReadings([]);
    toast({
      title: "Readings Cleared",
      description: "All entries have been removed from the table.",
    });
  };

  const formatReadingsAsText = () => {
    if (readings.length === 0) return "No readings to share.";

    let text = "ChronoGrapher Readings:\n\n";
    readings.forEach((reading, index) => {
      text += `${index + 1}. ${format(reading.timestamp, 'Pp')}\n`;
      text += `   - Customer: ${reading.customerName}\n`;
      text += `   - Ref #: ${reading.refNumber}\n`;
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
        // Don't log an error if the user cancels the share dialog (AbortError).
        if (error.name !== 'AbortError') {
          console.error("Error sharing:", error);
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
        console.error("Error copying to clipboard:", error);
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

  return (
    <Card className="print:shadow-none print:border-none">
      <div className="no-print">
        <CardHeader>
          <CardTitle className="font-headline">Recorded Readings</CardTitle>
          <CardDescription>
            This table contains all the timegrapher data you've analyzed in this session.
          </CardDescription>
        </CardHeader>
      </div>
       <div className="print-only hidden">
        <div className="pt-8">
            <h1 className="text-2xl font-bold text-center mb-2 font-headline">ChronoGrapher Readings</h1>
            <p className="text-center text-sm text-muted-foreground mb-6">{format(new Date(), 'PP')}</p>
        </div>
      </div>
      <CardContent>
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
                  <User className="h-4 w-4" /> Customer
                </div>
              </TableHead>
               <TableHead>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4" /> Ref #
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Position
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
                  <TableCell>{format(reading.timestamp, "Pp")}</TableCell>
                  <TableCell>{reading.customerName}</TableCell>
                  <TableCell>{reading.refNumber}</TableCell>
                  <TableCell>{reading.position}</TableCell>
                  <TableCell className="font-medium">{reading.rate}</TableCell>
                  <TableCell>{reading.amplitude}</TableCell>
                  <TableCell>{reading.beatError}</TableCell>
                  <TableCell>{reading.liftAngle}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No readings yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
         {readings.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 no-print">
            <ListX className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold tracking-tight font-headline">No Readings Yet</h3>
            <p className="text-muted-foreground">Upload an image or enter data manually to start.</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-end gap-2 no-print">
        <Button variant="destructive" onClick={handleClearAll} disabled={readings.length === 0}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear All
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
  );
}
