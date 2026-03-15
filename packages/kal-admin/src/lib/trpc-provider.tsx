"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";

import { trpc } from "./trpc";

function getBaseUrl() {
  if (typeof window !== "undefined") {
    // Browser: call the local Next.js proxy which injects the admin secret
    return "";
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error) => {
              // Don't retry on auth/validation errors
              if (
                error instanceof Error &&
                (error.message.includes("UNAUTHORIZED") ||
                  error.message.includes("FORBIDDEN") ||
                  error.message.includes("BAD_REQUEST"))
              ) {
                return false;
              }
              return failureCount < 2;
            },
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          // Route through our own Next.js API route which injects x-admin-secret
          url: `${getBaseUrl()}/api/trpc`,
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: "include",
            });
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
