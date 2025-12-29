import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { ToastContainer } from "@/components/ui/Toast";
import { ToastProvider } from "@/contexts/ToastContext";
import { AuthProvider } from "@/lib/auth-context";
import { TRPCProvider } from "@/lib/trpc-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://kalori-api.my"),
  title: {
    default: "Kalori API - Malaysian Food Nutrition Database & API",
    template: "%s | Kalori API",
  },
  description:
    "Free Malaysian food nutrition API with 1000+ foods. Access calorie, protein, carb, and fat data for natural and halal foods. Perfect for developers building health & fitness apps.",
  keywords: [
    "Malaysian food API",
    "calorie API",
    "nutrition database",
    "halal food nutrition",
    "food calories Malaysia",
    "health app API",
    "fitness API",
    "makanan Malaysia",
    "kalori makanan",
    "nutritional data API",
  ],
  authors: [{ name: "Kalori API Team" }],
  creator: "Kalori API",
  publisher: "Kalori API",
  openGraph: {
    type: "website",
    locale: "en_MY",
    url: "https://kalori-api.my",
    siteName: "Kalori API",
    title: "Kalori API - Malaysian Food Nutrition Database",
    description:
      "Free API for Malaysian food nutrition data. 1000+ foods with calories, protein, carbs & fat. Build amazing health apps!",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Kalori API - Malaysian Food Nutrition Database",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kalori API - Malaysian Food Nutrition Database",
    description:
      "Free API for Malaysian food nutrition data. 1000+ foods with calories, protein, carbs & fat.",
    images: ["/og-image.png"],
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
  verification: {
    google: "5d60tofQlbLG4cgFVM", // Your Google Search Console verification (update if different)
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          <AuthProvider logtoId={null}>
            <TRPCProvider>{children}</TRPCProvider>
          </AuthProvider>
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}

