"use client";

import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Uploader } from "@/components/uploader";
import { ReadingsTable } from "@/components/readings-table";
import type { TimegrapherReading } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const [readings, setReadings] = useState<TimegrapherReading[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDataExtracted = (data: Omit<TimegrapherReading, "id" | "timestamp">) => {
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 no-print">
          <Card className="lg:col-span-7">
            <CardHeader>
              <CardTitle className="font-headline">Analyze Timegrapher Data</CardTitle>
              <CardDescription>
                Upload a photo of your timegrapher to automatically extract the performance metrics of your watch.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Uploader 
                onDataExtracted={handleDataExtracted} 
                isProcessing={isProcessing}
                setProcessing={setIsProcessing} 
              />
            </CardContent>
          </Card>
        </div>
        <ReadingsTable readings={readings} />
      </main>
    </div>
  );
}
