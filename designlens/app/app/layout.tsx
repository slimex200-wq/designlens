"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("workspace");
  const [isDesktop, setIsDesktop] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <>
      {/* Small-screen banner — dismissible, doesn't block access */}
      {!isDesktop && !dismissed && (
        <div className="flex items-center justify-between px-4 py-2 bg-bg-elevated border-b border-border text-xs text-text-secondary">
          <span>{t("mobileFallback")}</span>
          <button
            onClick={() => setDismissed(true)}
            className="ml-3 px-2 py-1 rounded bg-bg-hover text-text-primary text-[10px] font-medium hover:bg-bg-surface transition-colors"
          >
            {t("mobileFallbackDismiss")}
          </button>
        </div>
      )}
      <div className="flex h-screen overflow-hidden">{children}</div>
    </>
  );
}
