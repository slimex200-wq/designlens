"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface LocaleToggleProps {
  collapsed?: boolean;
}

export function LocaleToggle({ collapsed }: LocaleToggleProps) {
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // Plain async handler (no useTransition): a pending transition wrapping
  // router.refresh() can leave the whole tree in a deferred state and make
  // other controls feel unclickable until the RSC refresh resolves.
  const toggle = async () => {
    if (busy) return;
    const next = locale === "en" ? "ko" : "en";
    setBusy(true);
    try {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={locale === "en" ? "한국어로 전환" : "Switch to English"}
      className={`flex items-center ${collapsed ? "justify-center" : ""} gap-2 px-2 py-1.5 rounded-md text-xs text-text-tertiary cursor-pointer hover:bg-bg-hover hover:text-text-secondary transition-all disabled:opacity-50`}
    >
      <span className="text-xs flex-shrink-0">
        {locale === "en" ? "EN" : "KO"}
      </span>
      {!collapsed && (
        <span>{locale === "en" ? "한국어" : "English"}</span>
      )}
    </button>
  );
}
