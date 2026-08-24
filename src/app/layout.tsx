import type {Metadata, Viewport} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { SwRegister } from "@/components/sw-register";

// Self-hosted at build time by next/font — no network needed at runtime (offline PWA).
const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'ChronoGrapher',
  description: 'Photograph a Weishi timegrapher display and keep a dated regulation history per watch — fully offline.',
  manifest: '/Timegrapher-Charter/manifest.webmanifest',
  icons: {
    icon: '/Timegrapher-Charter/icons/icon-192.png',
    apple: '/Timegrapher-Charter/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ChronoGrapher',
  },
};

export const viewport: Viewport = {
  themeColor: '#0c0a09',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} font-body antialiased`}>
        {children}
        <Toaster />
        <SwRegister />
      </body>
    </html>
  );
}
