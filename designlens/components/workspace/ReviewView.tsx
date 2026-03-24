"use client";

import { useState, useCallback, useRef, useMemo, Dispatch } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { ReferenceImage, TokenSet, ReviewResult, ReviewIssue } from "@/lib/types";
import { SAMPLE_REVIEW_IMAGE, SAMPLE_REVIEW_RESULTS } from "@/lib/sample-project";

type ReviewState = {
  image: string | null;
  result: ReviewResult | null;
  loading: boolean;
  error: string | null;
};

type ReviewAction =
  | { type: "START"; image: string }
  | { type: "SUCCESS"; result: ReviewResult }
  | { type: "ERROR"; error: string }
  | { type: "DISMISS" };

interface ReviewViewProps {
  references: ReferenceImage[];
  onToolChange: (tool: "analyze" | "moodboard" | "review" | "tokens") => void;
  reviewState: ReviewState;
  reviewDispatch: Dispatch<ReviewAction>;
}

export function ReviewView({ references, onToolChange, reviewState, reviewDispatch }: ReviewViewProps) {
  const [highlightedIssue, setHighlightedIssue] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("review");
  const tc = useTranslations("common");
  const locale = useLocale();

  const { image: reviewImage, result: reviewResult, loading, error } = reviewState;

  const analyzedRefs = useMemo(
    () => references.filter((r) => r.status === "analyzed" && r.analysis),
    [references]
  );

  const mergedTokens = useMemo((): TokenSet => {
    const merged: TokenSet = { colors: {}, spacing: {}, radius: {}, typography: [] };
    for (const ref of analyzedRefs) {
      const t = ref.analysis!.tokens;
      Object.assign(merged.colors, t.colors);
      Object.assign(merged.spacing, t.spacing);
      Object.assign(merged.radius, t.radius);
      merged.typography.push(...t.typography);
    }
    return merged;
  }, [analyzedRefs]);

  const handleFiles = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      reviewDispatch({ type: "START", image: url });

      try {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("designSystem", JSON.stringify(mergedTokens));
        formData.append("locale", locale);

        const res = await fetch("/api/review", { method: "POST", body: formData });
        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const result: ReviewResult = await res.json();
        reviewDispatch({ type: "SUCCESS", result });
      } catch (err) {
        reviewDispatch({ type: "ERROR", error: err instanceof Error ? err.message : "Review failed" });
      }
    },
    [mergedTokens, reviewDispatch]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) handleFiles(files);
    },
    [handleFiles]
  );

  const dismiss = () => {
    reviewDispatch({ type: "DISMISS" });
    setHighlightedIssue(null);
  };

  // Empty state: no analyzed references
  if (analyzedRefs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-bg-elevated border border-border flex items-center justify-center mx-auto mb-4 text-lg text-text-tertiary">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5l5 5 9-11" /></svg>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            {t("emptyState")}
          </p>
          <button
            onClick={() => onToolChange("analyze")}
            className="px-4 rounded-md text-xs bg-accent-dim text-accent border border-accent-border font-medium hover:opacity-85 transition-opacity cursor-pointer min-h-[44px] flex items-center"
          >
            {tc("goToAnalyze")}
          </button>
        </div>
      </div>
    );
  }

  // Upload state: has references but no review image yet
  if (!reviewImage) {
    return (
      <div className="flex-1 flex items-center justify-center p-5">
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border border-dashed rounded-[10px] p-12 text-center transition-all cursor-pointer max-w-lg w-full ${
            isDragging
              ? "border-border-hover bg-accent-dim"
              : "border-border hover:border-border-hover hover:bg-accent-dim"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length > 0) handleFiles(files);
              e.target.value = "";
            }}
          />
          <div className="text-2xl text-text-tertiary mb-3">&#x2713;</div>
          <h4 className="text-sm font-medium mb-1">{t("dropTitle")}</h4>
          <p className="text-[11px] text-text-tertiary">
            {t("dropDescription")}
          </p>
          <p className="text-[10px] text-text-tertiary mt-3">
            {t("designSystemFrom", { count: analyzedRefs.length })}
          </p>
          <button
            onClick={() => {
              reviewDispatch({ type: "START", image: SAMPLE_REVIEW_IMAGE });
              const result = SAMPLE_REVIEW_RESULTS[locale as "en" | "ko"] ?? SAMPLE_REVIEW_RESULTS.en;
              setTimeout(() => reviewDispatch({ type: "SUCCESS", result }), 800);
            }}
            className="mt-4 px-4 rounded-md text-xs bg-bg-elevated border border-border text-text-secondary font-medium hover:border-border-hover hover:text-text-primary transition-all cursor-pointer min-h-[44px] flex items-center"
          >
            {tc("trySample")}
          </button>
        </div>
      </div>
    );
  }

  // Review result state
  const scoreColor =
    reviewResult && reviewResult.score >= 80
      ? "text-success"
      : reviewResult && reviewResult.score >= 50
        ? "text-warning"
        : "text-error";

  const sortedIssues = reviewResult
    ? [...reviewResult.issues].sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.severity] - order[b.severity];
      })
    : [];

  const severityBorderColor = (s: ReviewIssue["severity"]) =>
    s === "high" ? "border-error" : s === "medium" ? "border-warning" : "border-accent";

  const severityBgColor = (s: ReviewIssue["severity"]) =>
    s === "high" ? "bg-error" : s === "medium" ? "bg-warning" : "bg-accent";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="h-10 flex items-center px-4 border-b border-border gap-3 flex-shrink-0">
        <span className="text-[13px] font-medium text-text-primary">{t("title")}</span>
        {reviewResult && (
          <span className={`text-sm font-bold ${scoreColor}`}>{reviewResult.score}/100</span>
        )}
        {loading && <span className="text-[11px] text-text-tertiary animate-pulse">{t("analyzingUi")}</span>}
        {error && <span className="text-[11px] text-error">{error}</span>}
        <button
          onClick={dismiss}
          className="ml-auto px-3 rounded-md text-xs bg-bg-elevated border border-border text-text-secondary cursor-pointer font-medium hover:border-border-hover hover:text-text-primary transition-all min-h-[44px] flex items-center"
        >
          {tc("dismiss")}
        </button>
      </div>

      {/* Split content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Image with overlays */}
        <div className="flex-1 relative overflow-auto p-4">
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={reviewImage}
              alt="UI under review"
              className="max-w-full rounded-lg"
            />
            {/* Bounding box overlays */}
            {reviewResult &&
              sortedIssues.map((issue, i) => (
                <div
                  key={i}
                  className={`absolute border-2 rounded-sm transition-opacity ${severityBorderColor(issue.severity)} ${
                    highlightedIssue === null || highlightedIssue === i
                      ? "opacity-80"
                      : "opacity-20"
                  }`}
                  style={{
                    left: `${issue.bounds.x}%`,
                    top: `${issue.bounds.y}%`,
                    width: `${issue.bounds.width}%`,
                    height: `${issue.bounds.height}%`,
                  }}
                >
                  <span
                    className={`absolute -top-5 left-0 text-[9px] px-1 rounded text-white ${severityBgColor(issue.severity)}`}
                  >
                    {i + 1}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Right/Bottom: Issues panel */}
        <div className="w-full md:w-[340px] border-t md:border-t-0 md:border-l border-border bg-bg-surface overflow-y-auto flex-shrink-0 max-h-[40vh] md:max-h-none">
          {reviewResult ? (
            <div className="p-4 flex flex-col gap-3">
              {/* Score badge */}
              <div className="text-center py-4">
                <div className={`text-5xl font-bold ${scoreColor}`}>{reviewResult.score}</div>
                <div className="text-[11px] text-text-tertiary mt-1">{t("designSystemScore")}</div>
              </div>

              <div className="h-px bg-border" />

              {/* Issues list */}
              <div className="text-[11px] text-text-tertiary font-medium uppercase tracking-wider">
                {t("issuesFound", { count: sortedIssues.length })}
              </div>
              {sortedIssues.map((issue, i) => (
                <button
                  key={i}
                  onClick={() => setHighlightedIssue(highlightedIssue === i ? null : i)}
                  className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                    highlightedIssue === i
                      ? "bg-bg-elevated border-accent-border"
                      : "bg-bg-deep border-border hover:border-border-hover"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        issue.severity === "high"
                          ? "bg-error-dim text-error"
                          : issue.severity === "medium"
                            ? "bg-warning-dim text-warning"
                            : "bg-accent-dim text-accent"
                      }`}
                    >
                      {issue.severity}
                    </span>
                    <span className="text-[12px] font-medium text-text-primary">{issue.area}</span>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    {issue.suggestion}
                  </p>
                </button>
              ))}
              {sortedIssues.length === 0 && (
                <p className="text-[12px] text-text-tertiary text-center py-4">
                  {t("noIssues")}
                </p>
              )}
            </div>
          ) : loading ? (
            <div className="p-4 flex flex-col gap-3">
              {/* Skeleton score */}
              <div className="text-center py-4">
                <div className="w-20 h-14 rounded-lg bg-bg-elevated mx-auto animate-pulse" />
                <div className="w-32 h-3 rounded bg-bg-elevated mx-auto mt-2 animate-pulse" />
              </div>
              <div className="h-px bg-border" />
              {/* Skeleton issues */}
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-3 rounded-lg bg-bg-deep border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-12 h-4 rounded bg-bg-elevated animate-pulse" />
                    <div className="w-24 h-4 rounded bg-bg-elevated animate-pulse" />
                  </div>
                  <div className="w-full h-3 rounded bg-bg-elevated animate-pulse" />
                  <div className="w-3/4 h-3 rounded bg-bg-elevated animate-pulse mt-1.5" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center h-full">
              <p className="text-[13px] text-text-tertiary text-center p-5">
                {t("resultsPlaceholder")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
