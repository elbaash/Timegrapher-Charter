
"use client";

import { AppHeader } from "@/components/app-header";
import { Watch } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AppHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
            <Watch className="h-16 w-16 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Coming Soon</h1>
            <p className="max-w-md text-muted-foreground">
              Our AI-powered watch regulation app, ChronoGrapher, is currently under construction. Please check back later!
            </p>
        </div>
      </main>
    </div>
  );
}
