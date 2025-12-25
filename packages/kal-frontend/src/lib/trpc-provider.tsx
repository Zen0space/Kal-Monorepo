"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useRef, useState } from "react";

import { useAuth } from "./auth-context";
import { trpc } from "./trpc";

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const { logtoId, email, name } = useAuth();
  
  // Use a ref to access the current auth context in the headers callback
  const authRef = useRef({ logtoId, email, name });
  authRef.current = { logtoId, email, name };

  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/trpc`,
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: "include",
            });
          },
          headers() {
            const { logtoId, email, name } = authRef.current;
            const headers: Record<string, string> = {};
            
            if (logtoId) headers["x-logto-id"] = logtoId;
            if (email) headers["x-logto-email"] = email;
            if (name) headers["x-logto-name"] = name;
            
            return headers;
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
