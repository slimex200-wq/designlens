"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = "error" | "success" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  action?: ToastAction;
  exiting: boolean;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string, action?: ToastAction) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const typeStyles: Record<ToastType, string> = {
  error:   "bg-error-dim border border-error text-error",
  success: "bg-success-dim border border-success text-success",
  info:    "bg-accent-dim border border-accent-border text-accent",
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const removeToast = useCallback((id: string) => {
    // Mark as exiting first (fade-out animation)
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    // Remove after animation completes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 320);
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, action?: ToastAction) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      setToasts((prev) => [...prev, { id, type, message, action, exiting: false }]);

      // Auto-dismiss after 5 s
      timers.current[id] = setTimeout(() => {
        removeToast(id);
        delete timers.current[id];
      }, 5000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={[
              "pointer-events-auto flex items-start gap-3 rounded-lg px-4 py-3 text-sm shadow-lg max-w-sm",
              typeStyles[toast.type],
              toast.exiting ? "toast-exit" : "toast-enter",
            ].join(" ")}
          >
            {/* Icon */}
            <span className="mt-px shrink-0 text-base leading-none select-none">
              {toast.type === "error" && "✕"}
              {toast.type === "success" && "✓"}
              {toast.type === "info" && "ℹ"}
            </span>

            {/* Message + action */}
            <div className="flex-1 min-w-0">
              <p className="leading-snug">{toast.message}</p>
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action!.onClick();
                    removeToast(toast.id);
                  }}
                  className="mt-1.5 text-xs font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
                >
                  {toast.action.label}
                </button>
              )}
            </div>

            {/* Dismiss */}
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss"
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity leading-none mt-px"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
