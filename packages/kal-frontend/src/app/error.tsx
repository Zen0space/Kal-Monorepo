"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "react-feather";

import { logError } from "@/lib/error-handler";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error for debugging
    logError("RouteError", error);
  }, [error]);

  return (
    <div className="error-page">
      <div className="error-container">
        <div className="error-icon">
          <AlertCircle size={40} />
        </div>
        
        <h1 className="error-title">Something went wrong</h1>
        
        <p className="error-message">
          We encountered an unexpected error. This has been logged and our team
          will look into it. You can try again or go back to the home page.
        </p>
        
        {process.env.NODE_ENV === "development" && (
          <details className="mb-6 text-left">
            <summary className="text-content-secondary cursor-pointer hover:text-content-primary">
              Error Details (dev only)
            </summary>
            <pre className="mt-2 p-4 bg-dark-elevated rounded-lg text-xs text-red-400 overflow-auto max-h-48">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
        
        <div className="error-actions">
          <button onClick={reset} className="btn-primary flex items-center gap-2">
            <RefreshCw size={16} />
            Try Again
          </button>
          
          <Link href="/" className="btn-secondary flex items-center gap-2">
            <Home size={16} />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
