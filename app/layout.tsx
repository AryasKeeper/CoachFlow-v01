import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NavigationWrapper } from "@/components/navigation-wrapper";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CoachFlow - Connect Organizations with Vetted Basketball Coaches",
  description: "Sydney's premier marketplace for connecting academies, schools, camps, and sports organizations with verified basketball coaches. Find qualified coaches in under 24 hours.",
  keywords: "basketball coaches, Sydney, sports coaching, basketball training, coaching marketplace, youth basketball, sports academy, basketball camp",
  authors: [{ name: "CoachFlow" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://coachflow.com'),
  openGraph: {
    title: "CoachFlow - Basketball Coach Marketplace",
    description: "Connect with vetted basketball coaches across Sydney. All coaches are background-checked with Working with Children clearances.",
    type: "website",
    locale: "en_AU",
    url: '/',
    siteName: 'CoachFlow',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CoachFlow - Basketball Coach Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CoachFlow - Basketball Coach Marketplace',
    description: 'Find verified basketball coaches in Sydney',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <Providers>
          <>
            <NavigationWrapper />
            <main className="min-h-screen pt-16">
              {children}
            </main>
          </>
        </Providers>
      </body>
    </html>
  );
}
