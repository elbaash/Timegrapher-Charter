
import { Watch } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function AppHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6 print-hidden">
      {children}
      <div className="flex items-center gap-2">
        <Watch className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-semibold tracking-tighter font-headline">ChronoGrapher</h1>
      </div>
      <Separator orientation="vertical" className="h-8 hidden md:block" />
      <p className="text-sm text-muted-foreground hidden md:block">AI-Powered Watch Regulation</p>
    </header>
  );
}
