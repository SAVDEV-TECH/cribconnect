import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VideoTourModal from "@/components/VideoTourModal";
import RelocationModal from "@/components/RelocationModal";
import ProUpgradeModal from "@/components/ProUpgradeModal";
import GoogleOneTap from "@/components/GoogleOneTap";
import PwaInstaller from "@/components/PwaInstaller";
import AiConciergeChat from "@/components/AiConciergeChat";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cribconnect-gold.vercel.app";

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CribConnect | Verified Student Housing Near UNIPORT Port Harcourt",
    template: "%s | CribConnect",
  },
  description:
    "Find verified student housing near University of Port Harcourt (UNIPORT) in Choba, Rumuola, Aluu, Ozuoba and surrounding areas. Video walkthroughs, transparent fees, and scam-free verified agents.",
  keywords: [
    "UNIPORT housing",
    "University of Port Harcourt accommodation",
    "student rentals Port Harcourt",
    "Choba student housing",
    "Aluu student accommodation",
    "Rumuola apartment UNIPORT",
    "Ozuoba budget rooms",
    "verified property agents Port Harcourt",
    "self contain near UNIPORT",
    "CribConnect",
  ],
  authors: [{ name: "CribConnect Team" }],
  creator: "CribConnect",
  publisher: "CribConnect",
  applicationName: "CribConnect",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CribConnect",
  },
  formatDetection: {
    telephone: true,
  },
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
    title: "CribConnect | Verified Student Housing Near UNIPORT",
    description:
      "Post your housing need. Let verified Port Harcourt agents pitch matching properties near UNIPORT with transparent fees, video walkthroughs & 0% scam tolerance.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CribConnect - UNIPORT Student Housing Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CribConnect | Verified Student Rentals Near UNIPORT",
    description:
      "Find trusted student housing near UNIPORT Port Harcourt. Verified agents, video tours, transparent fees.",
    images: ["/og-image.png"],
    creator: "@cribconnect",
  },
  icons: {
    icon: "/icon-192.svg",
    shortcut: "/icon-192.svg",
    apple: "/icon-192.svg",
  },
  manifest: "/manifest.json",
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
      <body className="min-h-screen flex flex-col bg-white text-gray-900 antialiased pb-14 md:pb-0">
        <AppProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          {/* Global Modals, PWA & Scripts */}
          <VideoTourModal />
          <RelocationModal />
          <ProUpgradeModal />
          <GoogleOneTap />
          <AiConciergeChat />
          <PwaInstaller />
          <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
          <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
        </AppProvider>
      </body>
    </html>
  );
}
