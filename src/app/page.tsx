
"use client";

import { useState, useEffect, useRef } from "react";
import { AppHeader } from "@/components/app-header";
import { Uploader } from "@/components/uploader";
import { ReadingsTable } from "@/components/readings-table";
import { ManualEntryForm } from "@/components/manual-entry-form";
import { Faq } from "@/components/faq";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimegrapherReading, CustomerSession, AnalyzedImage, TimegrapherReadingData, Position, POSITIONS } from "@/types";
import { List, Trash2, FilePlus, ChevronLeft, Check, X, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const initialReadings: TimegrapherReading[] = [
    { id: '1', timestamp: '2025-10-30T11:00:00.000Z', position: 'Dial Up', rate: '+5', amplitude: '290', beatError: '0.2', liftAngle: '52' },
    { id: '2', timestamp: '2025-10-30T11:01:00.000Z', position: 'Dial Down', rate: '+3', amplitude: '285', beatError: '0.1', liftAngle: '52' },
    { id: '3', timestamp: '2025-10-30T11:02:00.000Z', position: 'Crown Down', rate: '-2', amplitude: '260', beatError: '0.4', liftAngle: '52' },
    { id: '4', timestamp: '2025-10-30T11:03:00.000Z', position: 'Crown Left', rate: '-1', amplitude: '255', beatError: '0.3', liftAngle: '52' },
    { id: '5', timestamp: '2025-10-30T11:04:00.000Z', position: 'Crown Up', rate: '-5', amplitude: '250', beatError: '0.5', liftAngle: '52' },
    { id: '6', timestamp: '2025-10-30T11:05:00.000Z', position: 'Crown Right', rate: '0', amplitude: '258', beatError: '0.2', liftAngle: '52' },
];

const initialCustomerName = "Jane Smith";
const initialRefNumber = "B456";

export default function Home() {
  const [activeTab, setActiveTab] = useState("new");
  const [sessions, setSessions] = useState<CustomerSession[]>([]);
  const [activeReadings, setActiveReadings] = useState<TimegrapherReading[]>([]);
  const [activeCustomerName, setActiveCustomerName] = useState<string>("");
  const [activeRefNumber, setActiveRefNumber] = useState<string>("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isProcessing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<AnalyzedImage[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedSessions = localStorage.getItem("chronoSessions");
      if (storedSessions) {
        setSessions(JSON.parse(storedSessions));
      }

      const storedCurrentSession = localStorage.getItem("chronoCurrentSession");
      if (storedCurrentSession) {
        const { readings, customerName, refNumber, sessionId } = JSON.parse(storedCurrentSession);
        setActiveReadings(readings);
        setActiveCustomerName(customerName);
        setActiveRefNumber(refNumber);
        setActiveSessionId(sessionId);
      } else {
        // If no saved session, load initial example data
        setActiveReadings(initialReadings);
        setActiveCustomerName(initialCustomerName);
        setActiveRefNumber(initialRefNumber);
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
        // Fallback to initial data if localStorage fails
        setActiveReadings(initialReadings);
        setActiveCustomerName(initialCustomerName);
        setActiveRefNumber(initialRefNumber);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("chronoSessions", JSON.stringify(sessions));
    } catch (error) {
      console.error("Failed to save sessions to localStorage", error);
    }
  }, [sessions]);
  
  useEffect(() => {
    try {
      const currentSession = {
        readings: activeReadings,
        customerName: activeCustomerName,
        refNumber: activeRefNumber,
        sessionId: activeSessionId
      };
      localStorage.setItem("chronoCurrentSession", JSON.stringify(currentSession));
    } catch (error) {
      console.error("Failed to save current session to localStorage", error);
    }
  }, [activeReadings, activeCustomerName, activeRefNumber, activeSessionId]);


  const handleDataExtracted = (data: AnalyzedImage[]) => {
    const sortOrder: Position[] = ['Dial Down', 'Crown Up', 'Crown Down', 'Crown Left', 'Crown Right', 'Dial Up'];
    
    const sortedData = [...data].sort((a, b) => {
      const posA = a.data.position;
      const posB = b.data.position;
      const indexA = sortOrder.indexOf(posA);
      const indexB = sortOrder.indexOf(posB);

      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      return indexA - indexB;
    });

    setExtractedData(sortedData);
    setActiveTab("review");
  };
  
  const handleReviewSave = () => {
    const newReadings: TimegrapherReading[] = extractedData.map((item, index) => ({
      id: `${Date.now()}-${index}`,
      timestamp: new Date().toISOString(),
      ...item.data,
      position: item.data.position || 'Unknown',
    }));

    if (!activeSessionId) {
      const firstItem = newReadings[0] as any;
      if (firstItem?.customerName) {
        setActiveCustomerName(firstItem.customerName);
      }
      if (firstItem?.refNumber) {
        setActiveRefNumber(firstItem.refNumber);
      }
    }

    setActiveReadings(prev => [...prev, ...newReadings]);
    setExtractedData([]);
    setActiveTab("new");
    toast({
        title: "Readings Added",
        description: "The new readings have been added to the current session."
    });
  };

  const handleReviewCancel = () => {
    setExtractedData([]);
    setActiveTab("new");
  };
  
  const handleExtractedDataChange = (index: number, field: keyof TimegrapherReadingData, value: string) => {
    const updatedData = [...extractedData];
    (updatedData[index].data as any)[field] = value;
    setExtractedData(updatedData);
  };

  const handleManualDataAdded = (data: TimegrapherReadingData) => {
    if(!activeCustomerName && data.customerName) {
      setActiveCustomerName(data.customerName);
    }
    if(!activeRefNumber && data.refNumber) {
      setActiveRefNumber(data.refNumber);
    }
    
    const newReading: TimegrapherReading = {
      id: `${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...data
    };
    setActiveReadings(prev => [...prev, newReading]);
  };

  const handleSaveSession = () => {
    if (activeReadings.length === 0) {
      toast({ variant: "destructive", title: "Cannot Save", description: "There are no readings to save." });
      return;
    }

    if (activeSessionId) {
      // Update existing session
      setSessions(sessions.map(s => s.id === activeSessionId ? { ...s, readings: activeReadings, customerName: activeCustomerName, refNumber: activeRefNumber } : s));
      toast({ title: "Session Updated", description: `Session for ${activeCustomerName} (${activeRefNumber}) has been updated.` });
    } else {
      // Create new session
      const newSession: CustomerSession = {
        id: `sess-${Date.now()}`,
        customerName: activeCustomerName || "Untitled",
        refNumber: activeRefNumber || "N/A",
        createdAt: new Date().toISOString(),
        readings: activeReadings
      };
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession.id); // Set the new session as active
      toast({ title: "Session Saved", description: `New session for ${activeCustomerName} (${activeRefNumber}) has been created.` });
    }
  };

  const handleNewSession = () => {
    setActiveReadings([]);
    setActiveCustomerName("");
    setActiveRefNumber("");
    setActiveSessionId(null);
    setActiveTab("new");
    toast({ title: "New Session Started", description: "You are now working on a new, unsaved session." });
  };

  const handleSelectSession = (session: CustomerSession) => {
    setActiveReadings(session.readings);
    setActiveCustomerName(session.customerName);
    setActiveRefNumber(session.refNumber);
    setActiveSessionId(session.id);
    setActiveTab("new");
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      handleNewSession();
    }
    toast({ variant: "destructive", title: "Session Deleted", description: "The session has been permanently removed." });
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="review" disabled={extractedData.length === 0}>Review</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>
          
          <Card className="rounded-t-none">
            <TabsContent value="new">
              <CardHeader>
                <CardTitle>New Regulation Session</CardTitle>
                <CardDescription>
                  {activeSessionId ? `Editing session for ${activeCustomerName} (${activeRefNumber})` : "Start a new session by adding readings."}
                </CardDescription>
              </CardHeader>
               <CardContent className="space-y-4">
                 <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">Upload Photos</TabsTrigger>
                    <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload">
                     <Card className="rounded-t-none border-t-0">
                      <CardContent className="p-6">
                        <Uploader onDataExtracted={handleDataExtracted} isProcessing={isProcessing} setProcessing={setProcessing} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="manual">
                    <Card className="rounded-t-none border-t-0">
                      <CardContent className="p-6">
                        <ManualEntryForm onDataAdded={handleManualDataAdded} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
                
                <ReadingsTable 
                  readings={activeReadings} 
                  setReadings={setActiveReadings}
                  customerName={activeCustomerName}
                  refNumber={activeRefNumber}
                  onSave={handleSaveSession}
                />
              </CardContent>
            </TabsContent>

            <TabsContent value="review">
               <CardHeader>
                <CardTitle>Review Extracted Data</CardTitle>
                <CardDescription>Verify the OCR results and make corrections before adding to the session.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-4">
                  {extractedData.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                        <div className="w-full md:w-1/3">
                           <Image src={item.imageUrl} alt={`Preview ${index + 1}`} width={300} height={200} className="rounded-md object-cover" />
                        </div>
                        <div className="w-full md:w-2/3 grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor={`rate-${index}`}>Rate (s/d)</Label>
                                <Input id={`rate-${index}`} value={item.data.rate} onChange={(e) => handleExtractedDataChange(index, 'rate', e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor={`amplitude-${index}`}>Amplitude (°)</Label>
                                <Input id={`amplitude-${index}`} value={item.data.amplitude} onChange={(e) => handleExtractedDataChange(index, 'amplitude', e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor={`beatError-${index}`}>Beat Error (ms)</Label>
                                <Input id={`beatError-${index}`} value={item.data.beatError} onChange={(e) => handleExtractedDataChange(index, 'beatError', e.target.value)} />
                            </div>
                             <div>
                                <Label htmlFor={`position-${index}`}>Position</Label>
                                <Select
                                  value={item.data.position}
                                  onValueChange={(value) => handleExtractedDataChange(index, 'position', value as Position)}
                                >
                                  <SelectTrigger id={`position-${index}`}>
                                    <SelectValue placeholder="Select a position" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {POSITIONS.map((pos) => (
                                      <SelectItem key={pos} value={pos}>
                                        {pos}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                            </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleReviewCancel}><X className="mr-2"/>Cancel</Button>
                    <Button onClick={handleReviewSave}><Check className="mr-2"/>Save Readings</Button>
                </div>
              </CardContent>
            </TabsContent>

            <TabsContent value="sessions">
               <CardHeader>
                <CardTitle>Saved Sessions</CardTitle>
                <CardDescription>Select a previous session to view or manage it. Or start a new one.</CardDescription>
                 <div className="pt-2">
                    <Button onClick={handleNewSession}><FilePlus className="mr-2" /> Start New Session</Button>
                 </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <div className="relative w-full overflow-auto">
                    {sessions.length > 0 ? (
                      <ul className="divide-y">
                        {sessions.map(session => (
                          <li key={session.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                            <button onClick={() => handleSelectSession(session)} className="flex-grow text-left">
                              <p className="font-semibold">{session.customerName} <span className="text-sm font-normal text-muted-foreground">({session.refNumber})</span></p>
                              <p className="text-sm text-muted-foreground">
                                {session.readings.length} readings, created on {new Date(session.createdAt).toLocaleDateString()}
                              </p>
                            </button>
                             <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleSelectSession(session)}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="destructive" size="icon" onClick={() => handleDeleteSession(session.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                             </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                       <div className="flex flex-col items-center justify-center gap-4 py-16">
                        <List className="h-16 w-16 text-muted-foreground/50" />
                        <h3 className="text-xl font-semibold tracking-tight">No Saved Sessions</h3>
                        <p className="text-muted-foreground">Save your first session to see it here.</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </TabsContent>

            <TabsContent value="faq">
               <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Common questions about the Weishi Timegrapher No. 1000.</CardDescription>
              </CardHeader>
              <CardContent>
                <Faq />
              </CardContent>
            </TabsContent>
          </Card>
        </Tabs>
      </main>
    </div>
  );
}
