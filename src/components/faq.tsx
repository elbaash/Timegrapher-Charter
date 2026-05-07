
"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Info, Settings, Timer, BookOpen } from "lucide-react";

export function Faq() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="p-4 rounded-lg border bg-muted/20 flex gap-3">
          <Settings className="h-5 w-5 text-primary shrink-0" />
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-1">Standard Setup</h4>
            <p className="text-xs text-muted-foreground">Most modern calibers require a Lift Angle of 52° and a stabilization period of 30-60 seconds.</p>
          </div>
        </div>
        <div className="p-4 rounded-lg border bg-muted/20 flex gap-3">
          <Info className="h-5 w-5 text-primary shrink-0" />
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-1">Pass/Fail Targets</h4>
            <p className="text-xs text-muted-foreground">Aim for Beat Error under 0.5ms and Amplitude between 270°-310° at full wind.</p>
          </div>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1" className="border-none mb-2">
          <AccordionTrigger className="hover:no-underline bg-muted/40 px-4 rounded-md font-semibold">
            <div className="flex items-center gap-3">
              <BookOpen className="h-4 w-4" />
              Machine Preparation
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 py-4 text-muted-foreground leading-relaxed">
            <ol className="list-decimal list-inside space-y-3">
              <li><strong>Power Sequence:</strong> Ensure stable AC power. The No. 1000 performs a self-test on boot.</li>
              <li><strong>Microphone Alignment:</strong> Secure the watch case. Avoid clamping directly on the crown to prevent feedback noise or stem damage.</li>
              <li><strong>Acoustic Isolation:</strong> Minimize ambient workshop noise, as it can cause "snow" (scattered dots) on the graph.</li>
            </ol>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2" className="border-none mb-2">
          <AccordionTrigger className="hover:no-underline bg-muted/40 px-4 rounded-md font-semibold">
            <div className="flex items-center gap-3">
              <Settings className="h-4 w-4" />
              Interface Navigation
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 py-4 text-muted-foreground leading-relaxed">
            <ul className="list-disc list-inside space-y-3">
              <li><strong>Start/Stop:</strong> Toggle to pause the trace and lock the numeric readings.</li>
              <li><strong>Beat/Rate:</strong> Long-press to toggle Automatic Beat Detection (Auto). Use Manual for non-standard vintage movements (e.g., 19,800 bph).</li>
              <li><strong>Lift Angle Adjustment:</strong> Essential for accurate Amplitude. Consult the Technical Guide for the specific movement (e.g. ETA 2824-2 = 50°, Sellita SW200 = 50°, Seiko 4R = 52°).</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3" className="border-none mb-2">
          <AccordionTrigger className="hover:no-underline bg-muted/40 px-4 rounded-md font-semibold">
            <div className="flex items-center gap-3">
              <Timer className="h-4 w-4" />
              Reading Interpretation
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 py-4 space-y-4">
             <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <h5 className="font-bold text-foreground text-sm">Rate (s/d)</h5>
                  <p className="text-xs text-muted-foreground">The daily variance. Chronometer standards (COSC) require -4/+6 s/d across multiple positions.</p>
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-foreground text-sm">Amplitude (°)</h5>
                  <p className="text-xs text-muted-foreground">Indicates escapement health. Low amplitude often signals a need for service (old oils, worn mainspring).</p>
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-foreground text-sm">Beat Error (ms)</h5>
                  <p className="text-xs text-muted-foreground">Symmetry of the balance wheel. High error leads to "lopsided" ticking and potential starting issues.</p>
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-foreground text-sm">Line Graph</h5>
                  <p className="text-xs text-muted-foreground">A clean, parallel set of lines indicates a healthy escapement. "Snow" or diverging lines suggest mechanical debris or pallet fork issues.</p>
                </div>
             </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
