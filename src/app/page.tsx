
"use client";

import { useState, useMemo } from "react";
import { AppHeader } from "@/components/app-header";
import { Uploader } from "@/components/uploader";
import { ReadingsTable } from "@/components/readings-table";
import type { TimegrapherReading, AnalyzedImage, CustomerSession } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManualEntryForm } from "@/components/manual-entry-form";
import { UploadCloud, PenSquare, HelpCircle, List, Trash2, PlusCircle, BookUser } from "lucide-react";
import { Faq } from "@/components/faq";
import { ExtractedDataDialog } from "@/components/extracted-data-dialog";
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarMenuAction } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const initialReadings: TimegrapherReading[] = [
    { id: '2024-01-01T12:00:00.000Z-1', timestamp: '2024-01-01T12:00:00.000Z', position: 'Dial Up', rate: '+5', amplitude: '280', beatError: '0.2', liftAngle: '52' },
    { id: '2024-01-01T12:01:00.000Z-2', timestamp: '2024-01-01T12:01:00.000Z', position: 'Dial Down', rate: '+3', amplitude: '275', beatError: '0.1', liftAngle: '52' },
    { id: '2024-01-01T12:02:00.000Z-3', timestamp: '2024-01-01T12:02:00.000Z', position: 'Crown Up', rate: '-1', amplitude: '250', beatError: '0.4', liftAngle: '52' },
    { id: '2024-01-01T12:03:00.000Z-4', timestamp: '2024-01-01T12:03:00.000Z', position: 'Crown Down', rate: '+2', amplitude: '255', beatError: '0.3', liftAngle: '52' },
    { id: '2024-01-01T12:04:00.000Z-5', timestamp: '2024-01-01T12:04:00.000Z', position: 'Crown Left', rate: '+7', amplitude: '260', beatError: '0.2', liftAngle: '52' },
    { id: '2024-01-01T12:05:00.000Z-6', timestamp: '2024-01-01T12:05:00.000Z', position: 'Crown Right', rate: '+6', amplitude: '262', beatError: '0.1', liftAngle: '52' },
];

const initialSession: CustomerSession = {
  id: 'initial-session',
  customerName: 'Jane Smith',
  refNumber: 'A246',
  createdAt: '2024-01-01T11:59:00.000Z',
  readings: initialReadings,
}


export default function Home() {
  const [sessions, setSessions] = useState<CustomerSession[]>([initialSession]);
  const [activeSessionId, setActiveSessionId] = useState<string>(initialSession.id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<AnalyzedImage[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId), [sessions, activeSessionId]);
  
  const setActiveReadings = (newReadings: TimegrapherReading[] | ((prevReadings: TimegrapherReading[]) => TimegrapherReading[])) => {
    if (!activeSession) return;
    
    const updatedReadings = typeof newReadings === 'function' 
      ? newReadings(activeSession.readings) 
      : newReadings;

    setSessions(prevSessions => prevSessions.map(s => 
      s.id === activeSessionId ? { ...s, readings: updatedReadings } : s
    ));
  };
  
  const setSessionDetails = (details: Partial<Pick<CustomerSession, 'customerName' | 'refNumber'>>) => {
     if (!activeSession) return;
     setSessions(prevSessions => prevSessions.map(s => 
      s.id === activeSessionId ? { ...s, ...details } : s
    ));
  }

  const handleDataExtracted = (data: AnalyzedImage[]) => {
    setExtractedData(data);
    setIsDialogOpen(true);
  };
  
  const handleDialogSave = (editedData: AnalyzedImage[]) => {
     const newReadings: TimegrapherReading[] = editedData.map(item => ({
      id: `${new Date().toISOString()}-${Math.random()}`, // simple unique id
      timestamp: new Date(),
      // only extract the reading data, not customer/ref
      rate: item.data.rate,
      amplitude: item.data.amplitude,
      beatError: item.data.beatError,
      position: item.data.position,
      liftAngle: item.data.liftAngle,
    }));
    
    setActiveReadings(prev => [...newReadings, ...prev]);

    // Also update the session's customer/ref info from the first uploaded item
    if(editedData.length > 0) {
      setSessionDetails({
        customerName: editedData[0].data.customerName,
        refNumber: editedData[0].data.refNumber,
      });
    }

    setIsDialogOpen(false);
  };

  const handleManualAdd = (data: Omit<TimegrapherReading, "id" | "timestamp">) => {
    const newReading: TimegrapherReading = {
      id: new Date().toISOString(), // simple unique id
      timestamp: new Date(),
      // only extract reading data, not customer/ref
      rate: data.rate,
      amplitude: data.amplitude,
      beatError: data.beatError,
      position: data.position,
      liftAngle: data.liftAngle,
    };
    setActiveReadings((prev) => [newReading, ...prev]);
    setSessionDetails({ customerName: data.customerName, refNumber: data.refNumber });
  };
  
  const handleNewSession = () => {
    const newSession: CustomerSession = {
      id: new Date().toISOString(),
      customerName: "New Customer",
      refNumber: `A${sessions.length + 1}`,
      createdAt: new Date().toISOString(),
      readings: [],
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    toast({
      title: "New Session Started",
      description: "You can now add readings for the new watch."
    });
  }

  const handleDeleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      // If we deleted the active session, select the first one remaining or create a new one
      const newActiveId = sessions[0]?.id;
      if (newActiveId && newActiveId !== sessionId) {
        setActiveSessionId(newActiveId);
      } else {
        handleNewSession();
      }
    }
     toast({
      variant: 'destructive',
      title: "Session Deleted",
    });
  };

  const readingsToDisplay = activeSession ? activeSession.readings : [];
  const customerNameToDisplay = activeSession ? activeSession.customerName : "";
  const refNumberToDisplay = activeSession ? activeSession.refNumber : "";

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <BookUser />
            <h2 className="text-lg font-semibold">Sessions</h2>
          </div>
          <p className="text-sm text-sidebar-foreground/70">Saved watch records</p>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {sessions.map(session => (
              <SidebarMenuItem key={session.id}>
                <SidebarMenuButton 
                  onClick={() => setActiveSessionId(session.id)} 
                  isActive={session.id === activeSessionId}
                  className="h-auto flex-col items-start p-2"
                >
                  <div className="font-semibold">{session.customerName}</div>
                  <div className="flex justify-between w-full text-xs text-sidebar-foreground/70">
                    <span>{session.refNumber}</span>
                    <span>{format(new Date(session.createdAt), "MM/dd/yy")}</span>
                  </div>
                </SidebarMenuButton>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <SidebarMenuAction showOnHover>
                        <Trash2 />
                      </SidebarMenuAction>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the session for <span className="font-bold">{session.customerName} ({session.refNumber})</span>. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteSession(session.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <Button onClick={handleNewSession} className="w-full">
            <PlusCircle /> New Session
          </Button>
        </SidebarFooter>
      </Sidebar>

      <div className="flex min-h-screen w-full flex-col bg-background">
        <AppHeader>
           <SidebarTrigger className="md:hidden" />
           <Separator orientation="vertical" className="h-8 md:hidden" />
        </AppHeader>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="no-print">
            <Tabs defaultValue="upload" className="grid gap-4">
              <Card>
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
          <ReadingsTable 
            readings={readingsToDisplay} 
            setReadings={setActiveReadings} 
            customerName={customerNameToDisplay}
            refNumber={refNumberToDisplay}
          />
          <ExtractedDataDialog
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            extractedData={extractedData}
            onSave={handleDialogSave}
          />
        </main>
      </div>
    </SidebarProvider>
  );
}
