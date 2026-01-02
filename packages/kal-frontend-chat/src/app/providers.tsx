"use client";

import { AuthProvider } from "@/lib/auth-context";
import { TRPCProvider } from "@/lib/trpc-provider";

interface ProvidersProps {
  children: React.ReactNode;
  logtoId: string | null;
  email?: string | null;
  name?: string | null;
}

export function Providers({ children, logtoId, email, name }: ProvidersProps) {
  return (
    <AuthProvider logtoId={logtoId} email={email} name={name}>
      <TRPCProvider>{children}</TRPCProvider>
    </AuthProvider>
  );
}
