"use client";

import { useTranslations } from "next-intl";
import type { AnalysisResult } from "@/lib/types";

interface FeedbackBarProps {
  analysis: AnalysisResult | null;
}

function useGenerateInsight(analysis: AnalysisResult) {
  const t = useTranslations("feedbackBar");
  const colorCount = analysis.colors.length;
  const bgColor = analysis.colors.find((c) => c.role === "background");
  const accentColor = analysis.colors.find((c) => c.role === "accent");

  const parts: string[] = [];

  if (bgColor) {
    const isLight = bgColor.hex.replace("#", "").split("").reduce((sum, c, i) => {
      return i % 2 === 0 ? sum + parseInt(c, 16) : sum;
    }, 0) > 20;
    parts.push(isLight ? t("lightTheme") : t("darkTheme"));
  }

  parts.push(t("colorsExtracted", { count: colorCount }));

  if (accentColor) {
    parts.push(t("accentColor", { hex: accentColor.hex.toUpperCase() }));
  }

  return parts.join(", ") + ".";
}

export function FeedbackBar({ analysis }: FeedbackBarProps) {
  const t = useTranslations("feedbackBar");
  const hasAnalysis = analysis !== null;

  return (
    <div className="h-[52px] border-t border-border bg-bg-surface flex items-center px-5 gap-3 flex-shrink-0">
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          hasAnalysis
            ? analysis.aiAvailable
              ? "bg-success animate-pulse"
              : "bg-warning animate-pulse"
            : "bg-text-tertiary"
        }`}
      />
      <span className="text-xs text-text-secondary flex-1">
        {hasAnalysis ? (
          <FeedbackContent analysis={analysis} />
        ) : (
          t("uploadPrompt")
        )}
      </span>
      {hasAnalysis && (
        <button className="px-3 py-1.5 rounded-md text-[11px] bg-accent-dim border border-accent-border text-accent cursor-pointer font-medium hover:bg-[rgba(147,197,253,0.12)] transition-all">
          {t("viewDetails")}
        </button>
      )}
    </div>
  );
}

function FeedbackContent({ analysis }: { analysis: AnalysisResult }) {
  const t = useTranslations("feedbackBar");
  const insight = useGenerateInsight(analysis);

  return (
    <>
      <strong className="text-text-primary font-medium">{t("aiInsight")}</strong>{" "}
      {insight}
    </>
  );
}
