"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { AnalysisResult } from "@/lib/types";
import { ColorTab } from "./ColorTab";
import { TypographyTab } from "./TypographyTab";
import { LayoutTab } from "./LayoutTab";
import { TokenTab } from "./TokenTab";

type Tab = "colors" | "typography" | "layout" | "tokens";

interface AnalysisPanelProps {
  analysis: AnalysisResult | null;
  fileName: string | null;
  onClose?: () => void;
}

export function AnalysisPanel({ analysis, fileName, onClose }: AnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("colors");
  const t = useTranslations("analysisPanel");

  const TABS: { id: Tab; label: string }[] = [
    { id: "colors", label: t("colors") },
    { id: "typography", label: t("typography") },
    { id: "layout", label: t("layout") },
    { id: "tokens", label: t("tokens") },
  ];

  return (
    <div className="w-[360px] border-l border-border bg-bg-surface overflow-y-auto flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight">{t("title")}</h3>
        <div className="flex items-center gap-2">
          {fileName && (
            <span className="text-[11px] text-text-tertiary">{fileName}</span>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="w-5 h-5 rounded flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-all cursor-pointer text-xs"
              title={t("closePanel")}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tab row */}
      <div className="flex border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-center text-[11px] font-medium cursor-pointer transition-all border-b-2 ${
              activeTab === tab.id
                ? "text-text-primary border-accent"
                : "text-text-tertiary border-transparent hover:text-text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* AI unavailable banner */}
      {analysis && !analysis.aiAvailable && (
        <div className="mx-5 mt-3 px-3 py-2 rounded-md bg-warning-dim border border-[rgba(251,191,36,0.15)] text-[11px] text-warning leading-relaxed">
          {t("aiUnavailable")}
        </div>
      )}

      {/* Body */}
      {analysis ? (
        <div className="p-5 flex flex-col gap-5 flex-1">
          {activeTab === "colors" && <ColorTab colors={analysis.colors} />}
          {activeTab === "typography" && <TypographyTab typography={analysis.typography} />}
          {activeTab === "layout" && <LayoutTab layout={analysis.layout} />}
          {activeTab === "tokens" && <TokenTab tokens={analysis.tokens} />}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-5">
          <p className="text-[13px] text-text-tertiary text-center">
            {t("selectReference")}
          </p>
        </div>
      )}
    </div>
  );
}
