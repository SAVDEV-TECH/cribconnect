import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VideoTourModal from "@/components/VideoTourModal";
import RelocationModal from "@/components/RelocationModal";
import ProUpgradeModal from "@/components/ProUpgradeModal";
import GoogleOneTap from "@/components/GoogleOneTap";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cribconnect.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CribConnect | Find Verified Student Rental Housing Near UNILAG & YabaTech",
    template: "%s | CribConnect",
  },
  description:
    "Nigeria's first 'Zillow + Upwork' hybrid rental platform. Find verified student housing near UNILAG, YabaTech, LASU with video walkthroughs, transparent fees, and scam-free agents.",
  keywords: [
    "student housing Nigeria",
    "UNILAG housing",
    "YabaTech accommodation",
    "student rentals Lagos",
    "verified property agents Lagos",
    "rental housing Akoka",
    "housing for students Nigeria",
    "self contain near UNILAG",
    "rental agent Lagos",
    "CribConnect",
  ],
  authors: [{ name: "CribConnect Team" }],
  creator: "CribConnect",
  publisher: "CribConnect",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: siteUrl,
    siteName: "CribConnect",
    title: "CribConnect | Find Verified Student Housing Near UNILAG & YabaTech",
    description:
      "Post your housing need. Let verified Lagos agents pitch matching properties with transparent fees, video walkthroughs & 0% scam tolerance.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CribConnect — Student Housing Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CribConnect | Verified Student Rentals Near UNILAG",
    description:
      "Find trusted student housing near Lagos campuses. Verified agents, video tours, transparent fees.",
    images: ["/og-image.png"],
    creator: "@cribconnect",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-brand-500 selection:text-white">
        <AppProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          {/* Global Modals */}
          <VideoTourModal />
          <RelocationModal />
          <ProUpgradeModal />
          <GoogleOneTap />
        </AppProvider>
      </body>
    </html>
  );
}
