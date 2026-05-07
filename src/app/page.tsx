"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/app-header";
import { Uploader } from "@/components/uploader";
import { ReadingsTable } from "@/components/readings-table";
import { ManualEntryForm } from "@/components/manual-entry-form";
import { Faq } from "@/components/faq";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimegrapherReading, CustomerSession, AnalyzedImage, TimegrapherReadingData, Position, POSITIONS } from "@/types";
import { List, Trash2, FilePlus, ChevronRight, Check, X, History, HelpCircle, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Home() {
  const [activeTab, setActiveTab] = useState("new");
  const [sessions, setSessions] = useState<CustomerSession[]>([]);
  const [activeReadings, setActiveReadings] = useState<TimegrapherReading[]>([]);
  const [activeCustomerName, setActiveCustomerName] = useState<string>("");
  const [activeRefNumber, setActiveRefNumber] = useState<string>("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isProcessing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<AnalyzedImage[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

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
        setActiveReadings(readings || []);
        setActiveCustomerName(customerName || "");
        setActiveRefNumber(refNumber || "");
        setActiveSessionId(sessionId || null);
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem("chronoSessions", JSON.stringify(sessions));
    } catch (error) {
      console.error("Failed to save sessions to localStorage", error);
    }
  }, [sessions, isHydrated]);
  
  useEffect(() => {
    if (!isHydrated) return;
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
  }, [activeReadings, activeCustomerName, activeRefNumber, activeSessionId, isHydrated]);


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
      const firstItem = extractedData[0]?.data;
      if (firstItem?.customerName && !activeCustomerName) setActiveCustomerName(firstItem.customerName);
      if (firstItem?.refNumber && !activeRefNumber) setActiveRefNumber(firstItem.refNumber);
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
    if(!activeCustomerName && data.customerName) setActiveCustomerName(data.customerName);
    if(!activeRefNumber && data.refNumber) setActiveRefNumber(data.refNumber);
    
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
      setSessions(sessions.map(s => s.id === activeSessionId ? { ...s, readings: activeReadings, customerName: activeCustomerName, refNumber: activeRefNumber } : s));
      toast({ title: "Session Updated", description: `Session for ${activeCustomerName || 'Unnamed'} has been updated.` });
    } else {
      const newSession: CustomerSession = {
        id: `sess-${Date.now()}`,
        customerName: activeCustomerName || "Untitled Session",
        refNumber: activeRefNumber || "N/A",
        createdAt: new Date().toISOString(),
        readings: activeReadings
      };
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession.id);
      toast({ title: "Session Saved", description: `New session created for ${newSession.customerName}.` });
    }
  };

  const handleNewSession = () => {
    setActiveReadings([]);
    setActiveCustomerName("");
    setActiveRefNumber("");
    setActiveSessionId(null);
    setActiveTab("new");
    toast({ title: "New Session", description: "Cleared workspace for a new regulation session." });
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

  if (!isHydrated) return null;

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-background border rounded-lg p-1">
            <TabsTrigger value="new" className="data-[state=active]:bg-muted"><PlusCircle className="mr-2 h-4 w-4 hidden sm:inline" />New</TabsTrigger>
            <TabsTrigger value="review" disabled={extractedData.length === 0} className="data-[state=active]:bg-muted">Review</TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-muted"><History className="mr-2 h-4 w-4 hidden sm:inline" />Sessions</TabsTrigger>
            <TabsTrigger value="faq" className="data-[state=active]:bg-muted"><HelpCircle className="mr-2 h-4 w-4 hidden sm:inline" />FAQ</TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
            <TabsContent value="new">
              <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Customer Info</CardTitle>
                      <CardDescription>Associate these readings with a client.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="main-customer">Customer Name</Label>
                        <Input 
                          id="main-customer" 
                          placeholder="e.g. Rolex Service Center" 
                          value={activeCustomerName} 
                          onChange={(e) => setActiveCustomerName(e.target.value)} 
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="main-ref">Reference Number</Label>
                        <Input 
                          id="main-ref" 
                          placeholder="e.g. 116610LN" 
                          value={activeRefNumber} 
                          onChange={(e) => setActiveRefNumber(e.target.value)} 
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Data Input</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="upload">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                          <TabsTrigger value="upload">AI OCR</TabsTrigger>
                          <TabsTrigger value="manual">Manual</TabsTrigger>
                        </TabsList>
                        <TabsContent value="upload">
                          <Uploader onDataExtracted={handleDataExtracted} isProcessing={isProcessing} setProcessing={setProcessing} />
                        </TabsContent>
                        <TabsContent value="manual">
                          <ManualEntryForm onDataAdded={handleManualDataAdded} />
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>

                <ReadingsTable 
                  readings={activeReadings} 
                  setReadings={setActiveReadings}
                  customerName={activeCustomerName}
                  refNumber={activeRefNumber}
                  onSave={handleSaveSession}
                />
              </div>
            </TabsContent>

            <TabsContent value="review">
               <Card>
                <CardHeader>
                  <CardTitle>Verify OCR Extraction</CardTitle>
                  <CardDescription>Adjust any values that Gemini may have misread from the timegrapher display.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    {extractedData.map((item, index) => (
                      <Card key={index} className="bg-muted/30">
                        <CardContent className="p-4 flex flex-col md:flex-row gap-6">
                          <div className="w-full md:w-48 relative aspect-video border rounded-md overflow-hidden bg-black flex-shrink-0">
                             <Image src={item.imageUrl} alt={`Reading ${index + 1}`} fill className="object-contain" />
                          </div>
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground uppercase">Rate (s/d)</Label>
                                  <Input className="h-9" value={item.data.rate} onChange={(e) => handleExtractedDataChange(index, 'rate', e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground uppercase">Amplitude (°)</Label>
                                  <Input className="h-9" value={item.data.amplitude} onChange={(e) => handleExtractedDataChange(index, 'amplitude', e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground uppercase">Beat Error (ms)</Label>
                                  <Input className="h-9" value={item.data.beatError} onChange={(e) => handleExtractedDataChange(index, 'beatError', e.target.value)} />
                              </div>
                               <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground uppercase">Position</Label>
                                  <Select
                                    value={item.data.position}
                                    onValueChange={(value) => handleExtractedDataChange(index, 'position', value)}
                                  >
                                    <SelectTrigger className="h-9">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {POSITIONS.map((pos) => (
                                        <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                              </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="flex justify-end gap-3 pt-6 border-t">
                      <Button variant="ghost" onClick={handleReviewCancel}><X className="mr-2 h-4 w-4"/>Discard</Button>
                      <Button onClick={handleReviewSave} className="px-8"><Check className="mr-2 h-4 w-4"/>Confirm All Readings</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sessions">
               <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Session Archives</CardTitle>
                    <CardDescription>A history of all completed watch regulations.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleNewSession}><FilePlus className="mr-2 h-4 w-4" /> New Session</Button>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border bg-background">
                      {sessions.length > 0 ? (
                        <div className="divide-y">
                          {sessions.map(session => (
                            <div key={session.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
                              <div className="flex-grow">
                                <h4 className="font-semibold text-primary">{session.customerName}</h4>
                                <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                                  <span>Ref: <span className="font-medium text-foreground">{session.refNumber}</span></span>
                                  <span>•</span>
                                  <span>{session.readings.length} readings</span>
                                  <span>•</span>
                                  <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                               <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => handleSelectSession(session)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                      Open <ChevronRight className="ml-1 h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteSession(session.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                               </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                         <div className="flex flex-col items-center justify-center gap-3 py-20">
                          <div className="p-4 rounded-full bg-muted">
                            <History className="h-8 w-8 text-muted-foreground/60" />
                          </div>
                          <h3 className="text-lg font-medium">No Archives Found</h3>
                          <p className="text-sm text-muted-foreground text-center max-w-[250px]">Your saved regulation reports will appear here for future reference.</p>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="faq">
               <Card>
                <CardHeader>
                  <CardTitle>Operator Knowledge Base</CardTitle>
                  <CardDescription>Technical documentation for the Weishi Timegrapher No. 1000.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Faq />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}