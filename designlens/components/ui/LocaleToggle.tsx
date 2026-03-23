"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface LocaleToggleProps {
  collapsed?: boolean;
}

export function LocaleToggle({ collapsed }: LocaleToggleProps) {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    const next = locale === "en" ? "ko" : "en";
    startTransition(async () => {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
      router.refresh();
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={isPending}
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
