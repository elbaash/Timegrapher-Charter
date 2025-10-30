
"use client";

import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Uploader } from "@/components/uploader";
import { ReadingsTable } from "@/components/readings-table";
import type { TimegrapherReading } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManualEntryForm } from "@/components/manual-entry-form";
import { UploadCloud, PenSquare, HelpCircle } from "lucide-react";
import { Faq } from "@/components/faq";
import { ExtractedDataDialog } from "@/components/extracted-data-dialog";
import { AnalyzedImage } from "@/types";

const initialReadings: TimegrapherReading[] = [
    {
        id: new Date().toISOString() + '-1',
        timestamp: new Date(new Date().getTime() - 5 * 60000),
        customerName: 'Jane Smith',
        refNumber: 'A246',
        position: 'Dial Up',
        rate: '+4',
        amplitude: '285',
        beatError: '0.1',
        liftAngle: '52',
    },
    {
        id: new Date().toISOString() + '-2',
        timestamp: new Date(new Date().getTime() - 4 * 60000),
        customerName: 'Jane Smith',
        refNumber: 'A246',
        position: 'Dial Down',
        rate: '+6',
        amplitude: '281',
        beatError: '0.2',
        liftAngle: '52',
    },
    {
        id: new Date().toISOString() + '-3',
        timestamp: new Date(new Date().getTime() - 3 * 60000),
        customerName: 'Jane Smith',
        refNumber: 'A246',
        position: 'Crown Down',
        rate: '-2',
        amplitude: '260',
        beatError: '0.4',
        liftAngle: '52',
    },
    {
        id: new Date().toISOString() + '-4',
        timestamp: new Date(new Date().getTime() - 2 * 60000),
        customerName: 'Jane Smith',
        refNumber: 'A246',
        position: 'Crown Up',
        rate: '0',
        amplitude: '255',
        beatError: '0.5',
        liftAngle: '52',
    },
    {
        id: new Date().toISOString() + '-5',
        timestamp: new Date(new Date().getTime() - 1 * 60000),
        customerName: 'Jane Smith',
        refNumber: 'A246',
        position: 'Crown Left',
        rate: '-5',
        amplitude: '251',
        beatError: '0.3',
        liftAngle: '52',
    },
    {
        id: new Date().toISOString() + '-6',
        timestamp: new Date(),
        customerName: 'Jane Smith',
        refNumber: 'A246',
        position: 'Crown Right',
        rate: '-3',
        amplitude: '258',
        beatError: '0.4',
        liftAngle: '52',
    },
];

export default function Home() {
  const [readings, setReadings] = useState<TimegrapherReading[]>(initialReadings);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<AnalyzedImage[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);


  const handleDataExtracted = (data: AnalyzedImage[]) => {
    setExtractedData(data);
    setIsDialogOpen(true);
  };
  
  const handleDialogSave = (editedData: AnalyzedImage[]) => {
     const newReadings: TimegrapherReading[] = editedData.map(item => ({
      id: `${new Date().toISOString()}-${Math.random()}`, // simple unique id
      timestamp: new Date(),
      ...item.data,
    }));
    setReadings(prev => [...newReadings, ...prev]);
    setIsDialogOpen(false);
  };

  const handleManualAdd = (data: Omit<TimegrapherReading, "id" | "timestamp">) => {
    const newReading: TimegrapherReading = {
      id: new Date().toISOString(), // simple unique id
      timestamp: new Date(),
      ...data,
    };
    setReadings((prev) => [newReading, ...prev]);
  };


  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 print:p-0">
        <div className="no-print">
          <Tabs defaultValue="upload" className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-7">
              <CardHeader>
                <CardTitle className="font-headline">Analyze Timegrapher Data</CardTitle>
                <CardDescription>
                  Upload photos, enter data manually, or learn how to use your timegrapher.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="upload"><UploadCloud className="mr-2" /> Upload Photos</TabsTrigger>
                  <TabsTrigger value="manual"><PenSquare className="mr-2" /> Manual Entry</TabsTrigger>
                  <TabsTrigger value="faq"><HelpCircle className="mr-2" /> FAQ</TabsTrigger>
                </TabsList>
                <TabsContent value="upload">
                  <Uploader 
                    onDataExtracted={handleDataExtracted} 
                    isProcessing={isProcessing}
                    setProcessing={setIsProcessing} 
                  />
                </TabsContent>
                <TabsContent value="manual">
                  <ManualEntryForm onDataAdded={handleManualAdd} />
                </TabsContent>
                <TabsContent value="faq">
                  <Faq />
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>
        <ReadingsTable readings={readings} setReadings={setReadings} />
        <ExtractedDataDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          extractedData={extractedData}
          onSave={handleDialogSave}
        />
      </main>
    </div>
  );
}
