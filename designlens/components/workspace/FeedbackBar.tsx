"use client";

import type { AnalysisResult } from "@/lib/types";

interface FeedbackBarProps {
  analysis: AnalysisResult | null;
}

function generateInsight(analysis: AnalysisResult): string {
  const colorCount = analysis.colors.length;
  const bgColor = analysis.colors.find((c) => c.role === "background");
  const accentColor = analysis.colors.find((c) => c.role === "accent");

  const parts: string[] = [];

  if (bgColor) {
    const isLight = bgColor.hex.replace("#", "").split("").reduce((sum, c, i) => {
      return i % 2 === 0 ? sum + parseInt(c, 16) : sum;
    }, 0) > 20;
    parts.push(isLight ? "light theme detected" : "dark theme detected");
  }

  parts.push(`${colorCount} colors extracted`);

  if (accentColor) {
    parts.push(`accent color ${accentColor.hex.toUpperCase()}`);
  }

  return parts.join(", ") + ".";
}

export function FeedbackBar({ analysis }: FeedbackBarProps) {
  const hasAnalysis = analysis !== null;

  return (
    <div className="h-[52px] border-t border-border bg-bg-surface flex items-center px-5 gap-3 flex-shrink-0">
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          hasAnalysis ? "bg-success animate-pulse" : "bg-text-tertiary"
        }`}
      />
      <span className="text-xs text-text-secondary flex-1">
        {hasAnalysis ? (
          <>
            <strong className="text-text-primary font-medium">AI Insight:</strong>{" "}
            {generateInsight(analysis)}
          </>
        ) : (
          "Upload references to get AI insights"
        )}
      </span>
      {hasAnalysis && (
        <button className="px-3 py-1.5 rounded-md text-[11px] bg-accent-dim border border-accent-border text-accent cursor-pointer font-medium hover:bg-[rgba(147,197,253,0.12)] transition-all">
          View Details
        </button>
      )}
    </div>
  );
}
