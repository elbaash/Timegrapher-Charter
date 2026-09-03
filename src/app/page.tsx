"use client";

import { useState, useEffect, useRef } from "react";
import { AppHeader } from "@/components/app-header";
import { Uploader } from "@/components/uploader";
import { ReadingsTable } from "@/components/readings-table";
import { ReadingsView } from "@/components/readings-view";
import { WatchCompare } from "@/components/watch-compare";
import { ManualEntryForm } from "@/components/manual-entry-form";
import { RegulateCalculator, type RegulatePrefill } from "@/components/regulate-calculator";
import { parseRate } from "@/lib/regulation";
import { Faq } from "@/components/faq";
import { OnboardingDialog } from "@/components/onboarding-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimegrapherReading, AnalyzedImage, TimegrapherReadingData, Position, POSITIONS, Watch } from "@/types";
import { loadWatches, saveWatches, addTableToWatches, buildBackup, parseBackup, mergeWatches, requestPersistentStorage } from "@/lib/watch-store";
import { Trash2, FilePlus, ChevronRight, ChevronLeft, Check, X, Watch as WatchIcon, HelpCircle, PlusCircle, Download, Upload, FileText, Gauge } from "lucide-react";
import { buildTablePdf, buildComparisonPdf, sharePdf, reportFilename } from "@/lib/report";
import type { ReadingsTable as ReadingsTableType } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function Home() {
  const [activeTab, setActiveTab] = useState("new");
  const [watches, setWatches] = useState<Watch[]>([]);
  const [activeReadings, setActiveReadings] = useState<TimegrapherReading[]>([]);
  const [activeName, setActiveName] = useState<string>("");
  const [activeRefNumber, setActiveRefNumber] = useState<string>("");
  const [isProcessing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<AnalyzedImage[]>([]);
  const [selectedWatchId, setSelectedWatchId] = useState<string | null>(null);
  const [detailView, setDetailView] = useState<"timeline" | "compare">("timeline");
  const [isHydrated, setIsHydrated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [regulatePrefill, setRegulatePrefill] = useState<RegulatePrefill | null>(null);

  const { toast } = useToast();
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await loadWatches();
        if (cancelled) return;
        setWatches(stored);
        const storedWorkspace = localStorage.getItem("chronoCurrentSession");
        if (storedWorkspace) {
          const { readings, customerName, refNumber } = JSON.parse(storedWorkspace);
          setActiveReadings(readings || []);
          setActiveName(customerName || "");
          setActiveRefNumber(refNumber || "");
        }
        if (!localStorage.getItem("chronoOnboarded")) setShowOnboarding(true);
      } catch (error) {
        console.error("Failed to load stored state", error);
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    })();
    requestPersistentStorage();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    void saveWatches(watches);
  }, [watches, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      const workspace = { readings: activeReadings, customerName: activeName, refNumber: activeRefNumber };
      localStorage.setItem("chronoCurrentSession", JSON.stringify(workspace));
    } catch (error) {
      console.error("Failed to save workspace to localStorage", error);
    }
  }, [activeReadings, activeName, activeRefNumber, isHydrated]);

  // Position isn't printed on the display — it's the physical placement the watchmaker uses, in the
  // machine's fixed printed order (Dial down · Crown up · Down · Left · Right · Dial up). Since photos
  // are taken in that order, auto-label each reading by its capture position; the user can adjust in Review.
  const MACHINE_POSITION_ORDER: Position[] = ['Dial Down', 'Crown Up', 'Crown Down', 'Crown Left', 'Crown Right', 'Dial Up'];

  const handleDataExtracted = (data: AnalyzedImage[]) => {
    const labeled = data.map((item, i) =>
      item.data.position && item.data.position !== 'Unknown'
        ? item
        : { ...item, data: { ...item.data, position: MACHINE_POSITION_ORDER[i] ?? 'Unknown' } }
    );
    setExtractedData(labeled);
    setActiveTab("review");
  };

  const handleReviewSave = () => {
    const newReadings: TimegrapherReading[] = extractedData.map((item, index) => ({
      id: `${Date.now()}-${index}`,
      timestamp: new Date().toISOString(),
      ...item.data,
      position: item.data.position || 'Unknown',
    }));

    const firstItem = extractedData[0]?.data;
    if (firstItem?.customerName && !activeName) setActiveName(firstItem.customerName);
    if (firstItem?.refNumber && !activeRefNumber) setActiveRefNumber(firstItem.refNumber);

    setActiveReadings(prev => [...prev, ...newReadings]);
    setExtractedData([]);
    setActiveTab("new");
    toast({ title: "Readings Added", description: "The new readings have been added to the workspace." });
  };

  const handleReviewCancel = () => {
    setExtractedData([]);
    setActiveTab("new");
  };

  // Load a saved table's rates into the Regulate tab to plan the next regulation pass.
  const handleRegulateFromTable = (table: ReadingsTableType) => {
    const rows = table.readings
      .filter((r) => parseRate(r.rate) !== null)
      .map((r, i) => ({
        id: `table-${table.id}-${i}`,
        label: r.position === "Unknown" ? `Rate ${i + 1}` : r.position,
        rate: r.rate,
      }));
    if (rows.length === 0) {
      toast({
        variant: "destructive",
        title: "No Rates to Use",
        description: "This table has no readings with a readable rate.",
      });
      return;
    }
    setRegulatePrefill({ key: Date.now(), rows });
    setActiveTab("regulate");
    toast({
      title: "Table Loaded",
      description: `${rows.length} rate${rows.length === 1 ? "" : "s"} ready in the Regulate tab.`,
    });
  };

  const handleExtractedDataChange = (index: number, field: keyof TimegrapherReadingData, value: string) => {
    const updatedData = [...extractedData];
    (updatedData[index].data as any)[field] = value;
    setExtractedData(updatedData);
  };

  const handleManualDataAdded = (data: TimegrapherReadingData) => {
    if (!activeName && data.customerName) setActiveName(data.customerName);
    if (!activeRefNumber && data.refNumber) setActiveRefNumber(data.refNumber);
    const newReading: TimegrapherReading = { id: `${Date.now()}`, timestamp: new Date().toISOString(), ...data };
    setActiveReadings(prev => [...prev, newReading]);
  };

  // Save the current workspace as a new dated table under a watch (matched by name + ref, or created).
  const handleSaveToWatch = () => {
    if (activeReadings.length === 0) {
      toast({ variant: "destructive", title: "Cannot Save", description: "There are no readings to save." });
      return;
    }
    const name = activeName || "Untitled watch";
    setWatches(prev => addTableToWatches(prev, name, activeRefNumber, activeReadings));
    setActiveReadings([]); // table captured; keep name/ref so the next capture (e.g. "after") attaches to the same watch
    toast({ title: "Saved to Watch", description: `A new readings table was added to “${name}”.` });
  };

  const handleClearWorkspace = () => {
    setActiveReadings([]);
    setActiveName("");
    setActiveRefNumber("");
    setActiveTab("new");
    toast({ title: "New Watch", description: "Cleared the workspace for a new watch." });
  };

  const handleDeleteWatch = (watchId: string) => {
    setWatches(prev => prev.filter(w => w.id !== watchId));
    if (selectedWatchId === watchId) setSelectedWatchId(null);
    toast({ variant: "destructive", title: "Watch Deleted", description: "The watch and its history were removed." });
  };

  // Download the whole archive as a dated JSON backup file.
  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(buildBackup(watches), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chronographer-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Backup Exported", description: `${watches.length} watch${watches.length === 1 ? "" : "es"} saved to a JSON file.` });
  };

  // Restore from a backup file: merges into the current archive, never deletes or duplicates.
  const handleImportBackup = async (file: File) => {
    try {
      const imported = parseBackup(JSON.parse(await file.text()));
      const { merged, addedWatches, addedTables } = mergeWatches(watches, imported);
      setWatches(merged);
      toast({
        title: "Backup Imported",
        description: addedWatches === 0 && addedTables === 0
          ? "Everything in that backup is already here — nothing to add."
          : `Restored ${addedWatches} new watch${addedWatches === 1 ? "" : "es"} and ${addedTables} readings table${addedTables === 1 ? "" : "s"}.`,
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Import Failed", description: e instanceof Error ? e.message : "Could not read that file." });
    }
  };

  const handleShareTablePdf = async (watch: Watch, table: ReadingsTableType) => {
    try {
      const outcome = await sharePdf(
        buildTablePdf(watch.name, watch.refNumber, table),
        reportFilename(watch.name, "readings"),
        `ChronoGrapher — ${watch.name}`,
      );
      toast({ title: outcome === "shared" ? "Report Shared" : "PDF Downloaded", description: "Readings table report generated." });
    } catch {
      toast({ variant: "destructive", title: "PDF Failed", description: "Could not generate the report." });
    }
  };

  const handleShareComparisonPdf = async (watch: Watch) => {
    try {
      const outcome = await sharePdf(
        buildComparisonPdf(watch),
        reportFilename(watch.name, "comparison"),
        `ChronoGrapher — ${watch.name} progress`,
      );
      toast({ title: outcome === "shared" ? "Report Shared" : "PDF Downloaded", description: "Progress comparison report generated." });
    } catch {
      toast({ variant: "destructive", title: "PDF Failed", description: "Could not generate the report." });
    }
  };

  if (!isHydrated) return null;

  const selectedWatch = watches.find(w => w.id === selectedWatchId) ?? null;

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-background border rounded-lg p-1">
            <TabsTrigger value="new" className="data-[state=active]:bg-muted"><PlusCircle className="mr-2 h-4 w-4 hidden sm:inline" />New</TabsTrigger>
            <TabsTrigger value="review" disabled={extractedData.length === 0} className="data-[state=active]:bg-muted">Review</TabsTrigger>
            <TabsTrigger value="regulate" className="data-[state=active]:bg-muted"><Gauge className="mr-2 h-4 w-4 hidden sm:inline" />Regulate</TabsTrigger>
            <TabsTrigger value="watches" className="data-[state=active]:bg-muted"><WatchIcon className="mr-2 h-4 w-4 hidden sm:inline" />Watches</TabsTrigger>
            <TabsTrigger value="faq" className="data-[state=active]:bg-muted"><HelpCircle className="mr-2 h-4 w-4 hidden sm:inline" />FAQ</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="new">
              <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Watch</CardTitle>
                      <CardDescription>Name this watch so its readings build up over time.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="watch-name">Watch Name</Label>
                        <Input
                          id="watch-name"
                          placeholder="e.g. Omega Seamaster – J. Doe"
                          value={activeName}
                          onChange={(e) => setActiveName(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="watch-ref">Reference Number</Label>
                        <Input
                          id="watch-ref"
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
                          <TabsTrigger value="upload">Batch photos</TabsTrigger>
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
                  customerName={activeName}
                  refNumber={activeRefNumber}
                  onSave={handleSaveToWatch}
                />
              </div>
            </TabsContent>

            <TabsContent value="review">
              <Card>
                <CardHeader>
                  <CardTitle>Verify OCR Extraction</CardTitle>
                  <CardDescription>Adjust any values the OCR may have misread. Fields outlined in amber came back blank — please fill those in.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    {extractedData.map((item, index) => (
                      <Card key={index} className="bg-muted/30">
                        <CardContent className="p-4 flex flex-col md:flex-row gap-6">
                          <div className="w-full md:w-48 relative aspect-video border rounded-md overflow-hidden bg-black flex-shrink-0">
                            <Image src={item.imageUrl} alt={`Reading ${index + 1}`} fill className="object-contain" />
                          </div>
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground uppercase">Rate (s/d)</Label>
                              <Input className={cn("h-9", !item.data.rate && "ring-1 ring-amber-500/60")} placeholder="—" value={item.data.rate} onChange={(e) => handleExtractedDataChange(index, 'rate', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground uppercase">Amp (°)</Label>
                              <Input className={cn("h-9", !item.data.amplitude && "ring-1 ring-amber-500/60")} placeholder="—" value={item.data.amplitude} onChange={(e) => handleExtractedDataChange(index, 'amplitude', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground uppercase">B.E. (ms)</Label>
                              <Input className={cn("h-9", !item.data.beatError && "ring-1 ring-amber-500/60")} placeholder="—" value={item.data.beatError} onChange={(e) => handleExtractedDataChange(index, 'beatError', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground uppercase">L.A. (°)</Label>
                              <Input className={cn("h-9", !item.data.liftAngle && "ring-1 ring-amber-500/60")} placeholder="—" value={item.data.liftAngle} onChange={(e) => handleExtractedDataChange(index, 'liftAngle', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground uppercase">Position</Label>
                              <Select value={item.data.position} onValueChange={(value) => handleExtractedDataChange(index, 'position', value)}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {POSITIONS.map((pos) => (<SelectItem key={pos} value={pos}>{pos}</SelectItem>))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button variant="ghost" onClick={handleReviewCancel}><X className="mr-2 h-4 w-4" />Discard</Button>
                    <Button onClick={handleReviewSave} className="px-8"><Check className="mr-2 h-4 w-4" />Confirm All Readings</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="regulate">
              <RegulateCalculator workspaceReadings={activeReadings} prefill={regulatePrefill} />
            </TabsContent>

            <TabsContent value="watches">
              {selectedWatch ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedWatchId(null)}>
                        <ChevronLeft className="mr-1 h-4 w-4" /> All Watches
                      </Button>
                    </div>
                    <CardTitle className="text-primary pt-2">{selectedWatch.name}</CardTitle>
                    <CardDescription>
                      Ref: <span className="font-medium text-foreground">{selectedWatch.refNumber || 'N/A'}</span>
                      {"  •  "}{selectedWatch.tables.length} reading{selectedWatch.tables.length === 1 ? '' : 's'} table{selectedWatch.tables.length === 1 ? '' : 's'} over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button variant={detailView === "timeline" ? "default" : "outline"} size="sm" onClick={() => setDetailView("timeline")}>Timeline</Button>
                      <Button variant={detailView === "compare" ? "default" : "outline"} size="sm" onClick={() => setDetailView("compare")}>Compare progress</Button>
                    </div>

                    {detailView === "compare" ? (
                      <div className="space-y-4">
                        <WatchCompare watch={selectedWatch} />
                        {selectedWatch.tables.length >= 2 && (
                          <Button variant="outline" size="sm" onClick={() => handleShareComparisonPdf(selectedWatch)}>
                            <FileText className="mr-2 h-4 w-4" /> Share comparison PDF
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {selectedWatch.tables.map((table) => (
                          <div key={table.id} className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <span className="text-muted-foreground">{format(new Date(table.createdAt), "PPp")}</span>
                              <span className="text-xs text-muted-foreground">— {table.readings.length} reading{table.readings.length === 1 ? '' : 's'}</span>
                              <div className="flex gap-1 ml-auto">
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleRegulateFromTable(table)}>
                                  <Gauge className="mr-1 h-3 w-3" /> Regulate
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleShareTablePdf(selectedWatch, table)}>
                                  <FileText className="mr-1 h-3 w-3" /> Share PDF
                                </Button>
                              </div>
                            </div>
                            <ReadingsView readings={table.readings} />
                          </div>
                        ))}
                        {selectedWatch.tables.length === 0 && (
                          <p className="text-sm text-muted-foreground py-8 text-center">No readings tables yet for this watch.</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle>Watches</CardTitle>
                      <CardDescription>Every watch you&apos;ve recorded, with its history of readings.</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={handleExportBackup} disabled={watches.length === 0}><Download className="mr-2 h-4 w-4" /> Export backup</Button>
                      <Button variant="outline" size="sm" onClick={() => importInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Import backup</Button>
                      <input
                        ref={importInputRef}
                        type="file"
                        accept="application/json,.json"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleImportBackup(file);
                          e.target.value = ""; // allow re-importing the same file
                        }}
                      />
                      <Button variant="outline" size="sm" onClick={handleClearWorkspace}><FilePlus className="mr-2 h-4 w-4" /> New Watch</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border bg-background">
                      {watches.length > 0 ? (
                        <div className="divide-y">
                          {watches.map((watch) => {
                            const lastTable = watch.tables[0];
                            return (
                              <div key={watch.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
                                <button className="flex-grow text-left" onClick={() => setSelectedWatchId(watch.id)}>
                                  <h4 className="font-semibold text-primary">{watch.name}</h4>
                                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                                    <span>Ref: <span className="font-medium text-foreground">{watch.refNumber || 'N/A'}</span></span>
                                    <span>•</span>
                                    <span>{watch.tables.length} table{watch.tables.length === 1 ? '' : 's'}</span>
                                    {lastTable && (<><span>•</span><span>last {format(new Date(lastTable.createdAt), "PP")}</span></>)}
                                  </div>
                                </button>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => setSelectedWatchId(watch.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    Open <ChevronRight className="ml-1 h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteWatch(watch.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-3 py-20">
                          <div className="p-4 rounded-full bg-muted">
                            <WatchIcon className="h-8 w-8 text-muted-foreground/60" />
                          </div>
                          <h3 className="text-lg font-medium">No Watches Yet</h3>
                          <p className="text-sm text-muted-foreground text-center max-w-[260px]">Record readings on the New tab and Save to Watch — they&apos;ll build up here over time.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="faq">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle>Operator Knowledge Base</CardTitle>
                    <CardDescription>Technical documentation for the Weishi Timegrapher No. 1000.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowOnboarding(true)}>
                    <HelpCircle className="mr-2 h-4 w-4" /> Quick-start guide
                  </Button>
                </CardHeader>
                <CardContent>
                  <Faq />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </main>
      <OnboardingDialog
        open={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          try { localStorage.setItem("chronoOnboarded", "1"); } catch {}
        }}
      />
    </div>
  );
}
