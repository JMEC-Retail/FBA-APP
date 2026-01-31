import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
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
  title: "FBA Shipment Management System",
  description: "Professional FBA shipment management system for efficient inventory tracking, order fulfillment, and Amazon FBA logistics. Streamline your shipping operations with real-time tracking and automated workflows.",
  keywords: ["FBA", "Amazon", "shipment management", "inventory", "logistics", "fulfillment", "shipping", "e-commerce"],
  authors: [{ name: "JMEC" }],
  creator: "JMEC",
  publisher: "JMEC",
  metadataBase: new URL("https://jmec-fba-app.vercel.app"),
  openGraph: {
    title: "FBA Shipment Management System",
    description: "Professional FBA shipment management system for efficient inventory tracking and Amazon FBA logistics",
    type: "website",
    locale: "en_US",
    siteName: "FBA Shipment Management",
    images: [
      {
        url: "/vercel.svg",
        width: 1200,
        height: 630,
        alt: "FBA Shipment Management System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FBA Shipment Management System",
    description: "Professional FBA shipment management for Amazon sellers",
    images: ["/vercel.svg"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/vercel.svg",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black`}
      >
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
