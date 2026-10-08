import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0d0f14",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "AnimeDB - Next-Gen Anime Database & Streaming Discovery",
  description: "A fast, clean, and modern anime database with legal streaming guides, comparison engine, taste quiz, and real-time airing countdowns.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AnimeDB",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark`}
    >
      <body className="min-h-screen bg-[#0d0f14] text-gray-100 flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
