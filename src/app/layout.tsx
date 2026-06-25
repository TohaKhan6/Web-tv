import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cloud IPTV - Premium IPTV Streaming",
  description:
    "Watch live TV channels, sports, movies, and more. Premium IPTV streaming platform with support for M3U playlists.",
  keywords: [
    "IPTV",
    "Live TV",
    "Streaming",
    "M3U",
    "M3U8",
    "TV Channels",
    "Sports",
    "Movies",
  ],
  openGraph: {
    title: "Cloud IPTV - Premium IPTV Streaming",
    description:
      "Watch live TV channels, sports, movies, and more. Premium IPTV streaming platform.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased" suppressHydrationWarning>
        <Header />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}
