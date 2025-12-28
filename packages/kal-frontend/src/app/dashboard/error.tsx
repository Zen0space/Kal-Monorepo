"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertCircle, RefreshCw, ArrowLeft } from "react-feather";

import { logError } from "@/lib/error-handler";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    logError("DashboardError", error);
  }, [error]);

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="bg-dark-surface border border-dark-border rounded-xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} />
        </div>
        
        <h2 className="text-xl font-bold text-content-primary mb-2">
          Dashboard Error
        </h2>
        
        <p className="text-content-secondary mb-6">
          There was a problem loading the dashboard. This might be a temporary
          issue - please try again.
        </p>
        
        {process.env.NODE_ENV === "development" && (
          <details className="mb-6 text-left">
            <summary className="text-content-muted text-sm cursor-pointer hover:text-content-secondary">
              Technical details
            </summary>
            <pre className="mt-2 p-3 bg-dark-elevated rounded text-xs text-red-400 overflow-auto max-h-32">
              {error.message}
            </pre>
          </details>
        )}
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
          
          <Link
            href="/"
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
