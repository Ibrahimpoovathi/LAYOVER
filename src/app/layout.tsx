import type { Metadata, Viewport } from "next";
import { Sora, Space_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "LAYOVER — Turn your layover into an adventure",
  description:
    "Type any airport and your layover length. AI turns dead hours into a mission-based micro-adventure — timed, stamped, unforgettable. Built overnight at LAYOVER 2026, TinkerSpace Calicut.",
  keywords: ["layover", "travel", "adventure", "AI", "hackathon", "airport"],
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "LAYOVER — Turn your layover into an adventure",
    description:
      "Type any airport + layover length. Get a mission-based micro-adventure, stamped into a passport you keep forever.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sora.variable} ${spaceMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
