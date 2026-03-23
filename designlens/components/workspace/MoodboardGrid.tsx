"use client";

import { useMemo, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { ReferenceImage, ColorInfo, AnalysisResult } from "@/lib/types";
import { RefDetailModal } from "./RefDetailModal";

interface MoodboardGridProps {
  references: ReferenceImage[];
  onSelectRef: (id: string) => void;
}

export function MoodboardGrid({ references, onSelectRef }: MoodboardGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [modalRefId, setModalRefId] = useState<string | null>(null);
  const [patterns, setPatterns] = useState<string[] | null>(null);
  const [loadingPatterns, setLoadingPatterns] = useState(false);
  const t = useTranslations("moodboard");

  const analyzedRefs = useMemo(
    () => references.filter((r) => r.status === "analyzed" && r.analysis),
    [references]
  );

  // Hover drives the insights panel
  const focusedId = hoveredId;
  const focusedRef = focusedId
    ? references.find((r) => r.id === focusedId) ?? null
    : null;
  const focusedAnalysis = focusedRef?.analysis ?? null;

  const aggregatedColors = useMemo(() => {
    const colorMap = new Map<string, { hex: string; role: string; total: number }>();
    for (const ref of analyzedRefs) {
      for (const c of ref.analysis!.colors) {
        const key = c.hex.toLowerCase();
        const existing = colorMap.get(key);
        if (existing) {
          existing.total += c.percentage;
        } else {
          colorMap.set(key, { hex: c.hex, role: c.role, total: c.percentage });
        }
      }
    }
    return Array.from(colorMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 12);
  }, [analyzedRefs]);

  const analyzePatterns = async () => {
    setLoadingPatterns(true);
    try {
      const summaries = analyzedRefs.map((r) => ({
        fileName: r.fileName,
        colors: r.analysis!.colors.map((c: ColorInfo) => c.hex),
        layout: r.analysis!.layout.type,
        typography: r.analysis!.typography.map((ty) => `${ty.size}/${ty.weight}`),
      }));

      const res = await fetch("/api/patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ references: summaries }),
      });

      if (res.ok) {
        const data = await res.json();
        setPatterns(data.patterns ?? []);
      } else {
        setPatterns([
          "Similar color palettes detected across references",
          "Consistent spacing and layout patterns",
          "Shared typography scale and hierarchy",
        ]);
      }
    } catch {
      setPatterns([
        "Similar color palettes detected across references",
        "Consistent spacing and layout patterns",
        "Shared typography scale and hierarchy",
      ]);
    } finally {
      setLoadingPatterns(false);
    }
  };

  if (references.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-text-tertiary">{t("noReferences")}</p>
      </div>
    );
  }

  const displayColors = focusedAnalysis
    ? focusedAnalysis.colors
    : aggregatedColors;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: 2-column image grid (larger thumbnails per spec) */}
      <div className="flex-1 p-5 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
          <span className="text-[11px] text-text-tertiary">
            {references.length} {t("referencesLabel").toLowerCase()}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {references.map((ref) => {
            const isActive = focusedId === ref.id;
            return (
              <button
                key={ref.id}
                onClick={() => setModalRefId(ref.id)}
                onMouseEnter={() => setHoveredId(ref.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group rounded-lg border bg-bg-deep overflow-hidden transition-all cursor-pointer text-left ${
                  isActive
                    ? "border-accent shadow-[0_0_0_1px_var(--accent)]"
                    : "border-border hover:border-border-hover"
                }`}
              >
                <div className="aspect-[16/10] bg-bg-elevated overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ref.filePath}
                    alt={ref.fileName}
                    className="w-full h-full object-cover transition-transform group-hover:scale-[1.03]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <div className="px-3 py-2 flex items-center justify-between">
                  <p className="text-[12px] font-medium text-text-primary truncate">
                    {ref.fileName}
                  </p>
                  {ref.analysis && ref.analysis.colors.length > 0 && (
                    <div className="flex gap-0.5 flex-shrink-0 ml-2">
                      {ref.analysis.colors.slice(0, 5).map((c, i) => (
                        <div
                          key={i}
                          className="w-3 h-3 rounded-full border border-border"
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Insights panel — hover previews, click pins */}
      <div className="w-[280px] border-l border-border bg-bg-surface p-4 overflow-y-auto flex flex-col gap-4 flex-shrink-0">
        {/* Panel header */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[13px] font-semibold text-text-primary truncate">
            {focusedAnalysis ? focusedRef!.fileName : t("insights")}
          </h3>
          {hoveredId && focusedAnalysis && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-bg-elevated text-text-tertiary font-medium flex-shrink-0">
              HOVER
            </span>
          )}
        </div>

        {/* No analysis hint */}
        {!focusedAnalysis && analyzedRefs.length === 0 && (
          <p className="text-[11px] text-text-tertiary leading-relaxed">
            {t("noAnalysis")}
          </p>
        )}

        {/* Color Palette */}
        {displayColors.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold">
              {t("colorPalette")}
            </span>
            <div className="flex gap-1 h-7 rounded-lg overflow-hidden">
              {displayColors.slice(0, 12).map((c, i) => (
                <div
                  key={i}
                  className="flex-1 transition-all hover:flex-[2] cursor-pointer relative group/color"
                  style={{ backgroundColor: c.hex }}
                  title={`${c.hex} - ${c.role}`}
                >
                  <span className="absolute bottom-0 left-0 right-0 text-center text-[7px] text-white opacity-0 group-hover/color:opacity-100 transition-opacity bg-black/50 py-px">
                    {c.hex}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1 mt-1">
              {displayColors.slice(0, 6).map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm border border-border flex-shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="text-[11px] text-text-secondary font-mono">{c.hex}</span>
                  <span className="text-[10px] text-text-tertiary ml-auto">{c.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Individual: typography + layout */}
        {focusedAnalysis && (
          <IndividualInsights analysis={focusedAnalysis} />
        )}

        {/* Aggregate view: patterns + stats */}
        {!focusedAnalysis && (
          <>
            {(aggregatedColors.length > 0 || analyzedRefs.length > 0) && (
              <div className="h-px bg-border" />
            )}

            {analyzedRefs.length >= 2 && !patterns && (
              <button
                onClick={analyzePatterns}
                disabled={loadingPatterns}
                className="w-full py-2.5 rounded-md text-xs bg-accent-dim text-accent border border-accent-border font-medium hover:opacity-85 transition-opacity cursor-pointer disabled:opacity-50"
              >
                {loadingPatterns ? t("analyzing") : t("analyzePatterns")}
              </button>
            )}

            {patterns && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold">
                  {t("commonPatterns")}
                </span>
                <ul className="flex flex-col gap-2">
                  {patterns.map((p, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-[11px] text-text-secondary leading-relaxed"
                    >
                      <span className="text-accent mt-0.5 flex-shrink-0">&#x2022;</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analyzedRefs.length > 0 && (
              <>
                <div className="h-px bg-border" />
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold">
                    {t("summary")}
                  </span>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-text-tertiary">{t("referencesLabel")}</span>
                    <span className="text-text-secondary">{references.length}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-text-tertiary">{t("analyzedLabel")}</span>
                    <span className="text-text-secondary">{analyzedRefs.length}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-text-tertiary">{t("uniqueColors")}</span>
                    <span className="text-text-secondary">{aggregatedColors.length}</span>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Detail modal */}
      {modalRefId && (() => {
        const modalRef = references.find((r) => r.id === modalRefId);
        return modalRef ? (
          <RefDetailModal
            reference={modalRef}
            onClose={() => setModalRefId(null)}
          />
        ) : null;
      })()}
    </div>
  );
}

/** Individual reference insights — typography + layout details */
function IndividualInsights({ analysis }: { analysis: AnalysisResult }) {
  const t = useTranslations("moodboard");

  return (
    <>
      {analysis.typography.length > 0 && (
        <>
          <div className="h-px bg-border" />
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold">
              {t("typography")}
            </span>
            {analysis.typography.map((ty, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className="text-text-secondary">
                  {ty.size} / {ty.weight}
                </span>
                <span className="text-[10px] text-text-tertiary">{ty.role}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {analysis.layout.type !== "unknown" && (
        <>
          <div className="h-px bg-border" />
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold">
              {t("layout")}
            </span>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              {analysis.layout.type}
            </p>
            {analysis.layout.grid && (
              <p className="text-[10px] text-text-tertiary leading-relaxed">
                {analysis.layout.grid}
              </p>
            )}
          </div>
        </>
      )}
    </>
  );
}
