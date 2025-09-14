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
  keywords: "basketball coaches, Sydney, sports coaching, basketball training, coaching marketplace",
  authors: [{ name: "CoachFlow" }],
  openGraph: {
    title: "CoachFlow - Basketball Coach Marketplace",
    description: "Connect with vetted basketball coaches across Sydney",
    type: "website",
    locale: "en_AU",
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
