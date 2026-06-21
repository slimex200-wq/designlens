"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  closeLabel?: string;
}

/** Cool Steel modal dialog: Esc to close, backdrop click to close, body scroll lock. */
export function Modal({ title, onClose, children, closeLabel = "Close" }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 motion-safe:animate-[fadeIn_0.2s_ease]"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-bg-surface border border-border rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-accent"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-bg-surface z-10">
          <h2 className="text-[15px] font-semibold text-text-primary tracking-[-0.3px]">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label={closeLabel}
            className="w-8 h-8 flex items-center justify-center rounded-md text-text-tertiary hover:bg-bg-hover hover:text-text-primary transition-colors cursor-pointer"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
