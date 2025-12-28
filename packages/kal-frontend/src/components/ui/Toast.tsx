"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "react-feather";

import { useToast, type Toast as ToastType, type ToastType as ToastVariant } from "@/contexts/ToastContext";

const icons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle size={20} />,
  error: <AlertCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  info: <Info size={20} />,
};

const styles: Record<ToastVariant, string> = {
  success: "toast-success",
  error: "toast-error",
  warning: "toast-warning",
  info: "toast-info",
};

function ToastItem({ toast, onRemove }: { toast: ToastType; onRemove: () => void }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(onRemove, 300); // Wait for exit animation
  };

  return (
    <div
      className={`toast ${styles[toast.type]} ${isExiting ? "toast-exit" : "toast-enter"}`}
      role="alert"
      aria-live="polite"
    >
      <div className="toast-icon">{icons[toast.type]}</div>
      <div className="toast-content">
        <div className="toast-title">{toast.title}</div>
        <div className="toast-message">{toast.message}</div>
      </div>
      <button
        onClick={handleRemove}
        className="toast-close"
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render on server
  if (!mounted) return null;

  return (
    <div className="toast-container" aria-label="Notifications">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
