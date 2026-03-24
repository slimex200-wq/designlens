"use client";

import { useTranslations } from "next-intl";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("workspace");

  return (
    <>
      {/* Mobile / small-screen fallback */}
      <div className="lg:hidden flex items-center justify-center h-screen p-8 text-center text-text-secondary">
        <p>
          {t("mobileFallback")}
          <br />
          {t("mobileFallbackSub")}
        </p>
      </div>

      {/* Full workspace — only shown on lg+ */}
      <div className="hidden lg:flex h-screen overflow-hidden">{children}</div>
    </>
  );
}
