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
import { Clock, Gauge, Activity, HeartPulse, Share2, Printer, ListX } from "lucide-react";
import { format } from "date-fns";

type ReadingsTableProps = {
  readings: TimegrapherReading[];
};

export function ReadingsTable({ readings }: ReadingsTableProps) {
  const { toast } = useToast();

  const formatReadingsAsText = () => {
    if (readings.length === 0) return "No readings to share.";

    let text = "ChronoGrapher Readings:\n\n";
    readings.forEach((reading, index) => {
      text += `${index + 1}. ${format(reading.timestamp, 'Pp')}\n`;
      text += `   - Rate: ${reading.rate}\n`;
      text += `   - Amplitude: ${reading.amplitude}\n`;
      text += `   - Beat Error: ${reading.beatError}\n\n`;
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
      } catch (error) {
        console.error("Error sharing:", error);
        toast({
          variant: "destructive",
          title: "Sharing failed",
          description: "Could not share the readings.",
        });
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
       <div className="print-only hidden pt-8">
        <h1 className="text-2xl font-bold text-center mb-2 font-headline">ChronoGrapher Readings</h1>
        <p className="text-center text-sm text-muted-foreground mb-6">{format(new Date(), 'PP')}</p>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {readings.length > 0 ? (
              readings.map((reading) => (
                <TableRow key={reading.id}>
                  <TableCell>{format(reading.timestamp, "Pp")}</TableCell>
                  <TableCell className="font-medium">{reading.rate}</TableCell>
                  <TableCell>{reading.amplitude}</TableCell>
                  <TableCell>{reading.beatError}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="no-print">
                <TableCell colSpan={4} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <ListX className="h-16 w-16 text-muted-foreground/50" />
                    <h3 className="text-xl font-semibold tracking-tight font-headline">No Readings Yet</h3>
                    <p className="text-muted-foreground">Upload an image to start recording data.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
       {readings.length > 0 && (
        <CardFooter className="justify-end gap-2 no-print">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
