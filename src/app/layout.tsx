import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NavBar from "@/components/NavBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "mapleboss — MSN Boss Calculator",
  description:
    "Can you clear? Check DPS requirements for MapleStory N bosses.",
  openGraph: {
    title: "mapleboss — MSN Boss Calculator",
    description: "Can you clear? Check DPS requirements for MapleStory N bosses.",
    url: "https://mapleboss.com",
    siteName: "mapleboss",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "mapleboss — MSN Boss Calculator",
    description: "Can you clear? Check DPS requirements for MapleStory N bosses.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
      >
        <NavBar />
        <main className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
        <footer className="border-t border-[var(--color-border)] py-6 text-center text-xs text-[var(--color-muted)]">
          mapleboss.com — MapleStory N Boss Calculator
        </footer>
      </body>
    </html>
  );
}
