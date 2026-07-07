
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
      title: "Workspace Cleared",
      description: "Removed all readings from the active session.",
    });
  };

  const formatReadingsAsText = () => {
    if (readings.length === 0) return "No readings to share.";

    let text = `ChronoGrapher Report\n`;
    text += `Customer: ${customerName || 'N/A'}\n`;
    text += `Reference: ${refNumber || 'N/A'}\n`;
    text += `Date: ${format(new Date(), 'PP')}\n\n`;
    
    readings.forEach((reading) => {
      text += `[${reading.position}]\n`;
      text += `Rate: ${reading.rate} s/d | Amp: ${reading.amplitude}° | BE: ${reading.beatError} ms\n\n`;
    });
    return text;
  };

  const handleShare = async () => {
    const shareText = formatReadingsAsText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ChronoGrapher Report - ${customerName || 'Watch'}`,
          text: shareText,
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          toast({ variant: "destructive", title: "Share Error", description: "Could not open share menu." });
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        toast({ title: "Copied", description: "Report text copied to clipboard." });
      } catch (error) {
         toast({ variant: "destructive", title: "Copy Error", description: "Could not copy to clipboard." });
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };
  
  return (
    <>
      {/* Hidden Print Only Section */}
      <div className="hidden print:block print:p-8">
          <div className="text-center mb-10">
              <h1 className="text-3xl font-bold uppercase tracking-widest border-b-2 border-black pb-2 inline-block">Regulation Certificate</h1>
              <div className="mt-4 grid grid-cols-2 text-sm text-left gap-4">
                <div>
                  <p className="font-bold">CUSTOMER:</p>
                  <p>{customerName || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-bold">REFERENCE:</p>
                  <p>{refNumber || 'N/A'}</p>
                </div>
                 <div>
                  <p className="font-bold">DATE:</p>
                  <p>{format(new Date(), 'PPPP')}</p>
                </div>
              </div>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-black bg-muted">
                <th className="py-2 text-left text-xs uppercase">Position</th>
                <th className="py-2 text-right text-xs uppercase">Rate (s/d)</th>
                <th className="py-2 text-right text-xs uppercase">Amplitude (°)</th>
                <th className="py-2 text-right text-xs uppercase">Beat Error (ms)</th>
                <th className="py-2 text-right text-xs uppercase">Lift (°)</th>
              </tr>
            </thead>
            <tbody>
              {readings.map((r) => (
                <tr key={r.id} className="border-b border-gray-200">
                  <td className="py-3 font-semibold">{r.position}</td>
                  <td className="py-3 text-right">{r.rate}</td>
                  <td className="py-3 text-right">{r.amplitude}</td>
                  <td className="py-3 text-right">{r.beatError}</td>
                  <td className="py-3 text-right">{r.liftAngle}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-20 border-t pt-4 grid grid-cols-2 text-xs">
            <p>CHRONOGRAPHER PROFESSIONAL SYSTEM</p>
            <p className="text-right italic">CERTIFIED WATCHMAKER SIGNATURE: ____________________</p>
          </div>
      </div>

      <Card className="flex flex-col h-full no-print bg-card shadow-sm border-muted">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Active Session
              </CardTitle>
              <CardDescription>
                {customerName ? `${customerName} (${refNumber || 'N/A'})` : "Configure customer info to start."}
              </CardDescription>
            </div>
            {readings.length > 0 && (
              <div className="flex gap-2">
                 <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={handleClearAll} title="Clear Session">
                   <Trash2 className="h-4 w-4" />
                 </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-0">
          <div className="border-y overflow-auto max-h-[500px]">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[120px] text-xs">Position</TableHead>
                  <TableHead className="text-xs">Rate</TableHead>
                  <TableHead className="text-xs">Amp</TableHead>
                  <TableHead className="text-xs">B.E.</TableHead>
                  <TableHead className="text-xs">L.A.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readings.length > 0 ? (
                  readings.map((reading) => (
                    <TableRow key={reading.id} className="hover:bg-accent/10">
                      <TableCell className="font-semibold text-xs py-3">{reading.position}</TableCell>
                      <TableCell className="font-mono text-xs">{reading.rate}s/d</TableCell>
                      <TableCell className="font-mono text-xs">{reading.amplitude}°</TableCell>
                      <TableCell className="font-mono text-xs">{reading.beatError}ms</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{reading.liftAngle}°</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64">
                      <div className="flex flex-col items-center justify-center gap-4 text-center opacity-60">
                        <div className="p-4 rounded-full bg-muted">
                          <ListX className="h-10 w-10" />
                        </div>
                        <p className="text-sm font-medium">Ready for input</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="pt-4 gap-2 no-print flex-wrap">
          <Button variant="outline" className="flex-1" onClick={handleShare} disabled={readings.length === 0}>
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
          <Button variant="outline" className="flex-1" onClick={handlePrint} disabled={readings.length === 0}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button className="w-full sm:w-auto px-8" onClick={onSave} disabled={readings.length === 0}>
            <Save className="mr-2 h-4 w-4" /> Save to Watch
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
