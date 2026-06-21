"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { clearAllData } from "@/lib/storage";

const APP_VERSION = "0.1.0";

export function SettingsModal({
  onClose,
  onExportProject,
  onImportProject,
}: {
  onClose: () => void;
  onExportProject?: () => void;
  onImportProject?: (file: File) => void;
}) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const switchLocale = () => {
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

  const clear = () => {
    clearAllData();
    window.location.reload();
  };

  return (
    <Modal title={t("title")} onClose={onClose} closeLabel={tc("close")}>
      <div className="flex flex-col gap-6">
        {/* Language */}
        <section className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[13px] font-medium text-text-primary">{t("language")}</div>
            <div className="text-[11px] text-text-tertiary mt-0.5">
              {locale === "en" ? "English" : "한국어"}
            </div>
          </div>
          <button
            onClick={switchLocale}
            disabled={isPending}
            className="px-3 h-8 rounded-md text-xs bg-bg-elevated border border-border text-text-secondary cursor-pointer font-medium hover:border-border-hover hover:text-text-primary transition-all disabled:opacity-50"
          >
            {locale === "en" ? "한국어" : "English"}
          </button>
        </section>

        <div className="h-px bg-border" />

        {/* Appearance */}
        <section className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[13px] font-medium text-text-primary">{t("appearance")}</div>
            <div className="text-[11px] text-text-tertiary mt-0.5">{t("themeValue")}</div>
          </div>
          <span className="px-2.5 h-7 flex items-center rounded-md text-[11px] bg-accent-dim border border-accent-border text-accent font-medium">
            {t("themeBadge")}
          </span>
        </section>

        <div className="h-px bg-border" />

        {/* Projects: export / import */}
        {onExportProject && onImportProject && (
          <>
            <section>
              <div className="text-[13px] font-medium text-text-primary">{t("projectsData")}</div>
              <div className="text-[11px] text-text-tertiary mt-0.5 leading-relaxed">
                {t("projectsDataDesc")}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={onExportProject}
                  className="px-3 h-8 rounded-md text-xs bg-bg-elevated border border-border text-text-secondary cursor-pointer font-medium hover:border-border-hover hover:text-text-primary transition-all"
                >
                  {t("exportProject")}
                </button>
                <label className="px-3 h-8 rounded-md text-xs bg-bg-elevated border border-border text-text-secondary cursor-pointer font-medium hover:border-border-hover hover:text-text-primary transition-all flex items-center">
                  {t("importProject")}
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onImportProject(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </section>

            <div className="h-px bg-border" />
          </>
        )}

        {/* Data */}
        <section>
          <div className="text-[13px] font-medium text-text-primary">{t("data")}</div>
          <div className="text-[11px] text-text-tertiary mt-0.5 leading-relaxed">
            {t("dataDesc")}
          </div>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="mt-3 px-3 h-8 rounded-md text-xs bg-error-dim border border-error text-error cursor-pointer font-medium hover:opacity-85 transition-opacity"
            >
              {t("clearData")}
            </button>
          ) : (
            <div className="mt-3 rounded-md border border-error-dim bg-error-dim p-3">
              <div className="text-[11px] text-text-secondary leading-relaxed mb-2.5">
                {t("clearConfirm")}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={clear}
                  className="px-3 h-8 rounded-md text-xs bg-error text-bg-deep cursor-pointer font-semibold hover:opacity-85 transition-opacity"
                >
                  {t("clearConfirmYes")}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="px-3 h-8 rounded-md text-xs bg-bg-elevated border border-border text-text-secondary cursor-pointer font-medium hover:text-text-primary transition-all"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          )}
        </section>

        <div className="h-px bg-border" />

        {/* About */}
        <section>
          <div className="text-[13px] font-medium text-text-primary">{t("about")}</div>
          <div className="text-[11px] text-text-tertiary mt-0.5 leading-relaxed">
            {t("aboutDesc")}
          </div>
          <div className="text-[11px] text-text-tertiary mt-1.5 font-mono">
            {t("version", { version: APP_VERSION })}
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 mt-2 text-[11px] text-accent hover:opacity-85 transition-opacity"
          >
            {t("landingLink")} <span className="emoji-text">{"\u2197"}</span>
          </Link>
        </section>
      </div>
    </Modal>
  );
}
