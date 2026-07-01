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
  title: "MapleBoss",
  description:
    "Can you clear? Check DPS requirements for MapleStory N bosses.",
  openGraph: {
    title: "MapleBoss",
    description: "Can you clear? Check DPS requirements for MapleStory N bosses.",
    url: "https://mapleboss.com",
    siteName: "MapleBoss",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "MapleBoss",
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
        <main className="mx-auto max-w-[1600px] px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
        <footer className="border-t border-[var(--color-border)] py-6 text-center text-xs text-[var(--color-muted)]">
          <div className="flex items-center justify-center gap-3">
            <span>MapleBoss</span>
            <a
              href="https://x.com/MapleBossN"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-[var(--color-foreground)]"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              @MapleBossN
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
