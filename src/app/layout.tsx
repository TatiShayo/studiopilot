import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "StudioPilot — Run Your Studio. Not Your Software.",
  description:
    "StudioPilot replaces Mindbody at $29/mo flat. Unlimited clients, class scheduling, payments, waitlists, staff management. Cancel anytime. Month-to-month billing.",
  keywords: [
    "studio management",
    "yoga scheduling",
    "gym software",
    "fitness studio",
    "class booking",
    "salon scheduling",
    "dance studio",
  ],
  openGraph: {
    title: "StudioPilot — Studio Management Software",
    description:
      "Replace Mindbody at $29/mo. Class scheduling, payments, client management. No contracts.",
    type: "website",
    siteName: "StudioPilot",
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
