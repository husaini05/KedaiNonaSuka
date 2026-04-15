import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Poppins, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AppStateProvider } from "@/components/providers/app-state-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { PWARegister } from "@/components/pwa-register";
import "./globals.css";

// Body text — clean, highly readable on Android screens
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Heading font — Poppins: rounded, friendly, very popular in Indonesian mobile apps
const poppins = Poppins({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

// Monospace for currency/numbers
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Kedai Nona Suka",
  description: "Sistem kasir & manajemen operasional Kedai Nona Suka. Makan enak, kantong aman.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kedai Nona Suka",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#E8821A",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${poppins.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ErrorBoundary>
          <AppStateProvider>
            {children}
            <Toaster richColors position="top-center" />
            <PWARegister />
          </AppStateProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
