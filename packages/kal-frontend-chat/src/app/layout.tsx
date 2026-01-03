import type { Metadata, Viewport } from "next";

import "./globals.css";
import { Providers } from "./providers";

import { getUser } from "@/lib/actions";

export const metadata: Metadata = {
  title: ".kal AI",
  description: "Your intelligent coding companion",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: ".kal AI",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await getUser();
  
  return (
    <html lang="en">
      <body className="antialiased bg-dark text-content-primary">
        <Providers 
          logtoId={context.claims?.sub ?? null}
          email={context.claims?.email ?? null}
          name={context.claims?.name ?? null}
        >
          {children}
        </Providers>
      </body>
    </html>
  );
}
