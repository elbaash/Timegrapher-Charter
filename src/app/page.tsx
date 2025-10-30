
"use client";

import { useState, useEffect, useCallback } from "react";
import { AppHeader } from "@/components/app-header";
import { Uploader } from "@/components/uploader";
import { ReadingsTable } from "@/components/readings-table";
import { ManualEntryForm } from "@/components/manual-entry-form";
import { Faq } from "@/components/faq";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { PanelLeft, Plus, Trash2, X } from "lucide-react";

import { TimegrapherReading, AnalyzedImage, CustomerSession, POSITIONS, TimegrapherReadingData } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [readings, setReadings] = useState<TimegrapherReading[]>([]);
  const [customerName, setCustomerName] = useState("Jane Smith");
  const [refNumber, setRefNumber] = useState("SN-456B");
  const [isProcessing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("new");
  const [reviewImages, setReviewImages] = useState<AnalyzedImage[]>([]);
  const [sessions, setSessions] = useState<CustomerSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    // Load sessions from localStorage on initial render
    try {
      const savedSessions = localStorage.getItem("chronoGrapherSessions");
      if (savedSessions) {
        setSessions(JSON.parse(savedSessions));
      } else {
        // Pre-populate with example data if no sessions exist
        const exampleSession: CustomerSession = {
          id: `session-${Date.now()}`,
          customerName: "John Appleseed",
          refNumber: "EX-123",
          createdAt: new Date().toISOString(),
          readings: [
            { id: `reading-1`, timestamp: "2025-10-31T10:00:00.000Z", position: "Dial Up", rate: "+5", amplitude: "290", beatError: "0.2", liftAngle: "52" },
            { id: `reading-2`, timestamp: "2025-10-31T10:01:00.000Z", position: "Dial Down", rate: "+3", amplitude: "285", beatError: "0.1", liftAngle: "52" },
            { id: `reading-3`, timestamp: "2025-10-31T10:02:00.000Z", position: "Crown Down", rate: "-2", amplitude: "260", beatError: "0.4", liftAngle: "52" },
            { id: `reading-4`, timestamp: "2025-10-31T10:03:00.000Z", position: "Crown Up", rate: "0", amplitude: "265", beatError: "0.3", liftAngle: "52" },
            { id: `reading-5`, timestamp: "2025-10-31T10:04:00.000Z", position: "Crown Left", rate: "+6", amplitude: "255", beatError: "0.5", liftAngle: "52" },
            { id: `reading-6`, timestamp: "2025-10-31T10:05:00.000Z", position: "Crown Right", rate: "+4", amplitude: "258", beatError: "0.2", liftAngle: "52" },
          ],
        };
        setSessions([exampleSession]);
      }
    } catch (error) {
      console.error("Failed to load sessions from localStorage", error);
    }
  }, []);

  useEffect(() => {
    // Save sessions to localStorage whenever they change
    try {
      localStorage.setItem("chronoGrapherSessions", JSON.stringify(sessions));
    } catch (error) {
      console.error("Failed to save sessions to localStorage", error);
    }
  }, [sessions]);


  const handleDataExtracted = (extractedData: AnalyzedImage[]) => {
    setReviewImages(extractedData);
    setActiveTab("review"); // Switch to the review tab
  };

  const handleManualDataAdded = (data: TimegrapherReadingData) => {
    const newReading: TimegrapherReading = {
      ...data,
      id: `reading-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    
    // If there's an active session, update it. Otherwise, add to current readings.
    if (activeSessionId) {
        setSessions(prevSessions =>
            prevSessions.map(session =>
                session.id === activeSessionId
                    ? { ...session, readings: [...session.readings, newReading] }
                    : session
            )
        );
    } else {
       setReadings(prevReadings => [...prevReadings, newReading]);
    }

    setCustomerName(data.customerName || customerName);
    setRefNumber(data.refNumber || refNumber);
  };

  const handleSaveReview = () => {
    const newReadings: TimegrapherReading[] = reviewImages.map(img => ({
      id: `reading-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      position: img.data.position,
      rate: img.data.rate,
      amplitude: img.data.amplitude,
      beatError: img.data.beatError,
      liftAngle: "52", // Assuming default, can be editable
    }));

    if (activeSessionId) {
      setSessions(prevSessions =>
        prevSessions.map(session =>
          session.id === activeSessionId
            ? { ...session, readings: [...session.readings, ...newReadings] }
            : session
        )
      );
    } else {
      setReadings(prev => [...prev, ...newReadings]);
    }

    if (reviewImages.length > 0) {
      setCustomerName(reviewImages[0].data.customerName || customerName);
      setRefNumber(reviewImages[0].data.refNumber || refNumber);
    }

    toast({
      title: "Readings Added",
      description: `${newReadings.length} new readings have been added to the session.`,
    });

    setReviewImages([]);
    setActiveTab("new");
  };

  const handleCancelReview = () => {
    setReviewImages([]);
    setActiveTab("new");
  };

  const handleSaveSession = () => {
    if (readings.length === 0) {
      toast({
        variant: "destructive",
        title: "Cannot Save",
        description: "There are no readings in the current session to save.",
      });
      return;
    }

    const newSession: CustomerSession = {
      id: `session-${Date.now()}`,
      customerName,
      refNumber,
      createdAt: new Date().toISOString(),
      readings,
    };

    setSessions(prevSessions => [...prevSessions, newSession]);
    setActiveSessionId(newSession.id);

    toast({
      title: "Session Saved",
      description: `Session for ${customerName} (${refNumber}) has been saved.`,
    });
  };

  const handleNewSession = () => {
    setReadings([]);
    setCustomerName("");
    setRefNumber("");
    setActiveSessionId(null);
    setActiveTab("new");
    toast({
      title: "New Session Started",
      description: "You can now start adding new readings.",
    });
  };

  const handleSelectSession = (session: CustomerSession) => {
    setActiveSessionId(session.id);
    setReadings(session.readings);
    setCustomerName(session.customerName);
    setRefNumber(session.refNumber);
    setActiveTab("new"); // Switch to the main tab to view readings
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      handleNewSession();
    }
    toast({
      variant: "destructive",
      title: "Session Deleted",
      description: `The selected session has been removed.`,
    });
  };
  
  const getActiveReadings = () => {
    if (activeSessionId) {
        return sessions.find(s => s.id === activeSessionId)?.readings || [];
    }
    return readings;
  };
  
  const setActiveReadings = (newReadings: TimegrapherReading[]) => {
     if (activeSessionId) {
        setSessions(prevSessions =>
            prevSessions.map(session =>
                session.id === activeSessionId
                    ? { ...session, readings: newReadings }
                    : session
            )
        );
    } else {
       setReadings(newReadings);
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AppHeader>
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="sm:hidden">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs">
            <SheetHeader>
              <SheetTitle>Sessions</SheetTitle>
            </SheetHeader>
             <div className="flex flex-col h-full">
              <div className="py-4">
                <Button onClick={handleNewSession} className="w-full">
                  <Plus className="mr-2" /> New Session
                </Button>
              </div>
              <div className="flex-grow overflow-y-auto">
                <div className="flex flex-col gap-2">
                  {sessions.map((session) => (
                    <div key={session.id} className="group flex items-center justify-between rounded-lg border bg-background p-3 text-sm">
                       <SheetClose asChild>
                        <button onClick={() => handleSelectSession(session)} className="flex-grow text-left">
                          <p className="font-semibold">{session.customerName}</p>
                          <p className="text-muted-foreground">{session.refNumber}</p>
                        </button>
                      </SheetClose>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteSession(session.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </AppHeader>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="review" className={reviewImages.length === 0 ? "hidden" : ""}>
                Review ({reviewImages.length})
            </TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>
            <Card className="rounded-t-none">
              <TabsContent value="new">
                <CardContent className="p-0">
                  <Tabs defaultValue="upload" className="w-full p-6">
                    <TabsList className="border-b">
                      <TabsTrigger value="upload" className="data-[state=active]:border-b-transparent data-[state=active]:-mb-px data-[state=active]:bg-transparent border-t-0 border-x-0 rounded-t-none">Upload Photos</TabsTrigger>
                      <TabsTrigger value="manual" className="data-[state=active]:border-b-transparent data-[state=active]:-mb-px data-[state=active]:bg-transparent border-t-0 border-x-0 rounded-t-none">Manual Entry</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload" className="pt-6">
                      <Uploader
                        onDataExtracted={handleDataExtracted}
                        isProcessing={isProcessing}
                        setProcessing={setProcessing}
                      />
                    </TabsContent>
                    <TabsContent value="manual" className="pt-6">
                      <ManualEntryForm onDataAdded={handleManualDataAdded} />
                    </TabsContent>
                  </Tabs>
                   <div className="p-6 pt-0">
                    <ReadingsTable
                        readings={getActiveReadings()}
                        setReadings={setActiveReadings}
                        customerName={customerName}
                        refNumber={refNumber}
                        onSave={handleSaveSession}
                      />
                  </div>
                </CardContent>
              </TabsContent>
              <TabsContent value="sessions">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Saved Sessions</h2>
                   <div className="flex flex-col gap-2">
                      {sessions.map((session) => (
                        <div key={session.id} className="group flex items-center justify-between rounded-lg border bg-background p-3 text-sm">
                          <button onClick={() => handleSelectSession(session)} className="flex-grow text-left">
                            <p className="font-semibold">{session.customerName}</p>
                            <p className="text-muted-foreground">{session.refNumber}</p>
                             <p className="text-xs text-muted-foreground/80">
                              {new Date(session.createdAt).toLocaleString()} - {session.readings.length} readings
                            </p>
                          </button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteSession(session.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                </CardContent>
              </TabsContent>
               <TabsContent value="review">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Review Extracted Data</h2>
                  </div>
                  <div className="space-y-6">
                    {/* Content moved from dialog */}
                     <div className="flex flex-col gap-4">
                        {reviewImages.map((img, index) => (
                            <p key={index} className="text-sm text-muted-foreground">
                                Verify the data for <span className="font-semibold">{img.data.customerName} ({img.data.refNumber})</span>.
                            </p>
                        ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={handleCancelReview}>
                      <X className="mr-2" /> Cancel
                    </Button>
                    <Button onClick={handleSaveReview}>
                      <Plus className="mr-2" /> Add to Session
                    </Button>
                  </div>
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
