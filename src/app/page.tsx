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

export default function Home() {
  const [readings, setReadings] = useState<TimegrapherReading[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<Omit<TimegrapherReading, "id" | "timestamp">[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);


  const handleDataExtracted = (data: Omit<TimegrapherReading, "id" | "timestamp">[]) => {
    setExtractedData(data);
    setIsDialogOpen(true);
  };
  
  const handleDialogSave = (editedData: Omit<TimegrapherReading, "id" | "timestamp">[]) => {
     const newReadings: TimegrapherReading[] = editedData.map(reading => ({
      id: `${new Date().toISOString()}-${Math.random()}`, // simple unique id
      timestamp: new Date(),
      ...reading,
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
