import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Kal Admin",
  description: "Admin dashboard for Kal",
};

import { AppShell } from "@/components/AppShell";
import { TRPCProvider } from "@/lib/trpc-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <TRPCProvider>
          <AppShell>
            {children}
          </AppShell>
        </TRPCProvider>
      </body>
    </html>
  );
}
