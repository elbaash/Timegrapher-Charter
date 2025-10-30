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

export default function Home() {
  const [readings, setReadings] = useState<TimegrapherReading[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDataExtracted = (data: Omit<TimegrapherReading, "id" | "timestamp">) => {
    const newReading: TimegrapherReading = {
      id: new Date().toISOString(), // simple unique id
      timestamp: new Date(),
      customerName: data.customerName || 'N/A',
      refNumber: data.refNumber || 'N/A',
      ...data,
    };
    setReadings((prev) => [newReading, ...prev]);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 print:p-0">
        <Tabs defaultValue="upload" className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 no-print">
          <Card className="lg:col-span-7">
            <CardHeader>
              <CardTitle className="font-headline">Analyze Timegrapher Data</CardTitle>
              <CardDescription>
                Upload a photo, enter data manually, or learn how to use your timegrapher.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="upload"><UploadCloud className="mr-2" /> Upload Photo</TabsTrigger>
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
                <ManualEntryForm onDataAdded={handleDataExtracted} />
              </TabsContent>
              <TabsContent value="faq">
                <Faq />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
        <ReadingsTable readings={readings} />
      </main>
    </div>
  );
}
