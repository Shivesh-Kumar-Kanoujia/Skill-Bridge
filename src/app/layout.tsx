import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SkillBridgeProvider } from "@/context/SkillBridgeContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { BrandLoader } from "@/components/shared/BrandLogo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "SkillBridge",
  title: "SkillBridge — Student Collaboration Platform",
  description: "Discover project opportunities, showcase your technical skills, and find the right teammates for college hackathons, capstones, and competitions.",
};

import React, { Suspense } from "react";

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
      <body className="min-h-full flex flex-col bg-[#F4F1E8] text-[#292F2B]">
        <SkillBridgeProvider>
          <Suspense fallback={<header className="h-16 border-b border-[#E3E2D9] bg-[#F4F1E8]" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1 flex flex-col">
            <Suspense fallback={<BrandLoader message="Loading SkillBridge..." />}>
              {children}
            </Suspense>
          </main>
          <Footer />
          <ToastContainer />
        </SkillBridgeProvider>
      </body>
    </html>
  );
}
