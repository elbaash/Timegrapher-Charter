"use client";

// First-run walkthrough for watchmakers new to the app. Shows once (localStorage flag); can be
// reopened any time from the FAQ tab.

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Camera, Crop, ClipboardCheck, DownloadCloud } from "lucide-react";

const STEPS = [
  {
    icon: Camera,
    title: "Photograph the display",
    body: "Work through the machine's printed order — Dial Down, Crown Up, Crown Down, Crown Left, Crown Right, Dial Up — taking one photo per position. The app labels them in that order automatically.",
  },
  {
    icon: Crop,
    title: "Crop to the screen",
    body: "On wide or angled shots, tap the crop icon on a photo and frame just the timegrapher screen. It makes the reading far more reliable.",
  },
  {
    icon: ClipboardCheck,
    title: "Review, then save",
    body: "Check the extracted numbers (amber fields came back blank — fill those in), confirm, and Save to Watch. Each save adds a dated table, so you can compare progress across regulation passes.",
  },
  {
    icon: DownloadCloud,
    title: "Back up now and then",
    body: "Everything lives on this device only. Use Export backup on the Watches tab occasionally — the file restores your whole history on any device.",
  },
];

export function OnboardingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to ChronoGrapher</DialogTitle>
          <DialogDescription>
            Photograph your Weishi timegrapher, keep a dated history per watch, and prove the
            improvement — all offline, free, no accounts.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {STEPS.map((s) => (
            <div key={s.title} className="flex gap-3">
              <div className="mt-0.5 p-2 rounded-md bg-muted h-fit">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="w-full">Get started</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
