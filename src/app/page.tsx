import { HardHat } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <HardHat className="h-24 w-24 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight">Under Maintenance</h1>
        <p className="text-muted-foreground">This application is currently unavailable. Please check back later.</p>
      </div>
    </div>
  );
}
