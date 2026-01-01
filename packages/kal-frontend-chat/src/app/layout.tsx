import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { getUser } from "@/lib/actions";

export const metadata: Metadata = {
  title: "Kalori Chat",
  description: "AI-powered chat assistant by Kalori",
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
