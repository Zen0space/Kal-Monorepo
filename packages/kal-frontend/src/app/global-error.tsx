"use client";

import { useEffect } from "react";
import { AlertOctagon, RefreshCw } from "react-feather";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log critical error
    console.error("[GlobalError] Critical application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{
        backgroundColor: "#0a0a0a",
        color: "#ffffff",
        minHeight: "100vh",
        margin: 0,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}>
        <div style={{ textAlign: "center", maxWidth: "480px" }}>
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            color: "#ef4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
          }}>
            <AlertOctagon size={40} />
          </div>
          
          <h1 style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
          }}>
            Critical Error
          </h1>
          
          <p style={{
            color: "#a3a3a3",
            marginBottom: "2rem",
            lineHeight: 1.6,
          }}>
            The application encountered a critical error and cannot continue.
            Please try refreshing the page.
          </p>
          
          <button
            onClick={reset}
            style={{
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              fontSize: "1rem",
              fontWeight: 500,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <RefreshCw size={16} />
            Reload Page
          </button>
        </div>
      </body>
    </html>
  );
}
