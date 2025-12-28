"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useRef, useState, useCallback } from "react";

import { useAuth } from "./auth-context";
import { trpc } from "./trpc";

import { useToast } from "@/contexts/ToastContext";
import { parseError, logError, isAuthError } from "@/lib/error-handler";

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const { logtoId, email, name } = useAuth();
  const toast = useToast();
  
  // Use a ref to access the current auth context in the headers callback
  const authRef = useRef({ logtoId, email, name });
  authRef.current = { logtoId, email, name };
  
  // Toast ref for use in QueryClient (which is created once)
  const toastRef = useRef(toast);
  toastRef.current = toast;

  // Global error handler
  const handleGlobalError = useCallback((error: unknown) => {
    const parsed = parseError(error);
    logError("tRPC", error);
    
    // Show toast notification
    toastRef.current.error(parsed.message, parsed.title);
    
    // Handle auth errors - could redirect to login
    if (isAuthError(error)) {
      // Optionally redirect to login page
      // window.location.href = '/';
    }
  }, []);

  const [queryClient] = useState(() =>
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: (failureCount, error) => {
            // Don't retry on auth errors or validation errors
            const parsed = parseError(error);
            if (parsed.type === 'unauthorized' || parsed.type === 'forbidden' || parsed.type === 'validation') {
              return false;
            }
            // Retry up to 2 times for other errors
            return failureCount < 2;
          },
          refetchOnWindowFocus: false,
        },
        mutations: {
          onError: handleGlobalError,
        },
      },
    })
  );

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

