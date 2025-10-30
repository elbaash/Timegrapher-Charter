
"use client";

import { useState, useMemo, useEffect } from "react";
import { AppHeader } from "@/components/app-header";
import { Uploader } from "@/components/uploader";
import { ReadingsTable } from "@/components/readings-table";
import type { TimegrapherReading, AnalyzedImage, CustomerSession, Position, TimegrapherReadingData } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManualEntryForm } from "@/components/manual-entry-form";
import { UploadCloud, PenSquare, HelpCircle, List, Trash2, PlusCircle, BookUser, FileCheck, Save, LoaderCircle, X } from "lucide-react";
import { Faq } from "@/components/faq";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/alert-dialog";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { POSITIONS } from "@/types";


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
  const { toast } = useToast();
  const [mainTab, setMainTab] = useState("new");
  const [editableData, setEditableData] = useState<AnalyzedImage[]>([]);
  const [isSaving, setIsSaving] = useState(false);


  useEffect(() => {
    if (extractedData.length > 0) {
      setEditableData(JSON.parse(JSON.stringify(extractedData))); // Deep copy
    }
  }, [extractedData]);

  const handleInputChange = (index: number, field: keyof TimegrapherReadingData, value: string) => {
    const newData = [...editableData];
    newData[index] = { 
        ...newData[index],
        data: {
            ...newData[index].data,
            [field]: value 
        }
    };
    setEditableData(newData);
  };
  
  const handlePositionChange = (index: number, value: Position) => {
    const newData = [...editableData];
    newData[index] = { 
        ...newData[index],
        data: {
            ...newData[index].data,
            position: value 
        }
    };
    setEditableData(newData);
  };

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
    setMainTab("review");
  };
  
  const handleReviewSave = (editedData: AnalyzedImage[]) => {
     setIsSaving(true);
    // Simulate a save operation
    setTimeout(() => {
      const newReadings: TimegrapherReading[] = editedData.map(item => ({
        id: `${new Date().toISOString()}-${Math.random()}`, // simple unique id
        timestamp: new Date().toISOString(),
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
      setIsSaving(false);
      setExtractedData([]); // Clear extracted data
      setMainTab("new"); // Go back to new
       toast({
        title: "Readings Saved",
        description: `${newReadings.length} new readings have been added to the current session.`,
      });
    }, 500);
  };
  
  const handleReviewCancel = () => {
    setExtractedData([]);
    setMainTab('new');
  }

  const handleManualAdd = (data: Omit<TimegrapherReading, "id" | "timestamp">) => {
    const newReading: TimegrapherReading = {
      id: new Date().toISOString(), // simple unique id
      timestamp: new Date().toISOString(),
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
    setMainTab("new");
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

  const selectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setMainTab("new");
  }

  const readingsToDisplay = activeSession ? activeSession.readings : [];
  const customerNameToDisplay = activeSession ? activeSession.customerName : "";
  const refNumberToDisplay = activeSession ? activeSession.refNumber : "";

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="new">New</TabsTrigger>
            {extractedData.length > 0 && <TabsTrigger value="review"><FileCheck /> Review</TabsTrigger>}
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>
          <Card className="rounded-t-none">
            <TabsContent value="new" className="space-y-4">
               <div className="p-6">
                <Card>
                    <CardHeader>
                      <CardTitle className="font-headline">Analyze Timegrapher Data</CardTitle>
                      <CardDescription>
                        Upload photos or enter data manually for the current session.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="upload" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                          <TabsTrigger value="upload"><UploadCloud className="mr-2" /> Upload Photos</TabsTrigger>
                          <TabsTrigger value="manual"><PenSquare className="mr-2" /> Manual Entry</TabsTrigger>
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
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
                <div className="px-6 pb-6">
                  <ReadingsTable 
                    readings={readingsToDisplay} 
                    setReadings={setActiveReadings} 
                    customerName={customerNameToDisplay}
                    refNumber={refNumberToDisplay}
                  />
                </div>
            </TabsContent>

             <TabsContent value="review">
               <CardHeader>
                <CardTitle>Review Extracted Data</CardTitle>
                <CardDescription>
                  Check the AI-extracted data below and make any necessary corrections before saving.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="space-y-6">
                    {editableData.map((item, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-4">
                        <div className="flex gap-4">
                          <div className="w-1/4 flex-shrink-0">
                            <Popover>
                              <PopoverTrigger asChild>
                                <div 
                                  className="aspect-square relative rounded-md overflow-hidden border bg-black cursor-zoom-in"
                                >
                                  <Image src={item.imageUrl} alt={`Preview ${index + 1}`} layout="fill" objectFit="contain" />
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Image src={item.imageUrl} alt="Zoomed image" width={400} height={400} className="rounded-md" />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="flex-grow space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor={`customerName-${index}`}>Customer Name</Label>
                                    <Input
                                    id={`customerName-${index}`}
                                    value={item.data.customerName}
                                    onChange={(e) => handleInputChange(index, 'customerName', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor={`refNumber-${index}`}>Ref. Number</Label>
                                    <Input
                                    id={`refNumber-${index}`}
                                    value={item.data.refNumber}
                                    onChange={(e) => handleInputChange(index, 'refNumber', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                              <Label htmlFor={`position-${index}`}>Position</Label>
                              <Select
                                value={item.data.position}
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
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor={`rate-${index}`}>Rate (s/d)</Label>
                            <Input
                              id={`rate-${index}`}
                              value={item.data.rate}
                              onChange={(e) => handleInputChange(index, 'rate', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`amplitude-${index}`}>Amplitude (°)</Label>
                            <Input
                              id={`amplitude-${index}`}
                              value={item.data.amplitude}
                              onChange={(e) => handleInputChange(index, 'amplitude', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`beatError-${index}`}>Beat Error (ms)</Label>
                            <Input
                              id={`beatError-${index}`}
                              value={item.data.beatError}
                              onChange={(e) => handleInputChange(index, 'beatError', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`liftAngle-${index}`}>Lift Angle (°)</Label>
                            <Input
                              id={`liftAngle-${index}`}
                              value={item.data.liftAngle || "52"}
                              onChange={(e) => handleInputChange(index, 'liftAngle', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={handleReviewCancel} disabled={isSaving}>
                      <X className="mr-2" /> Cancel
                    </Button>
                    <Button onClick={() => handleReviewSave(editableData)} disabled={isSaving}>
                      {isSaving ? <LoaderCircle className="animate-spin mr-2" /> : <Save className="mr-2" />}
                      Save Readings
                    </Button>
                  </div>
              </CardContent>
            </TabsContent>

            <TabsContent value="sessions">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>All Sessions</CardTitle>
                  <CardDescription>Select a session to view its details or create a new one.</CardDescription>
                </div>
                <Button onClick={handleNewSession}>
                  <PlusCircle /> New Session
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {sessions.map(session => (
                  <div key={session.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted">
                     <Button 
                        variant={session.id === activeSessionId ? 'secondary' : 'ghost'}
                        onClick={() => selectSession(session.id)}
                        className="h-auto flex-1 flex-col items-start p-2 text-left"
                      >
                        <div className="font-semibold">{session.customerName}</div>
                        <div className="flex justify-between w-full text-xs text-muted-foreground">
                          <span>{session.refNumber}</span>
                          <span>{format(new Date(session.createdAt), "MM/dd/yy")}</span>
                        </div>
                      </Button>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="text-destructive"/>
                            </Button>
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
                  </div>
                ))}
              </CardContent>
            </TabsContent>
            
            <TabsContent value="faq">
                <CardContent className="p-6">
                  <Faq />
                </CardContent>
            </TabsContent>
          </Card>
        </Tabs>

      </main>
    </div>
  );
}
