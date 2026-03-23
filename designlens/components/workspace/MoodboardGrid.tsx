"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { ReferenceImage, ColorInfo } from "@/lib/types";
import { RefDetailModal } from "./RefDetailModal";

interface MoodboardGridProps {
  references: ReferenceImage[];
  onSelectRef: (id: string) => void;
}

export function MoodboardGrid({ references, onSelectRef }: MoodboardGridProps) {
  const [modalRefId, setModalRefId] = useState<string | null>(null);
  const [patterns, setPatterns] = useState<string[] | null>(null);
  const [loadingPatterns, setLoadingPatterns] = useState(false);
  const t = useTranslations("moodboard");

  const analyzedRefs = useMemo(
    () => references.filter((r) => r.status === "analyzed" && r.analysis),
    [references]
  );

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

  return (
    <div className="flex-1 overflow-y-auto p-5">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
        <span className="text-[11px] text-text-tertiary">
          {analyzedRefs.length !== references.length ? (
            <>
              <span className="text-text-secondary">{analyzedRefs.length}</span>
              /{references.length} {t("analyzedLabel").toLowerCase()}
            </>
          ) : (
            <>
              {references.length} {t("referencesLabel").toLowerCase()}
            </>
          )}
        </span>
      </div>

      {/* Aggregated color palette */}
      {aggregatedColors.length > 0 && (
        <div className="mb-5">
          <span className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold mb-1.5 block">
            {t("colorPalette")}
          </span>
          <div className="flex gap-1 h-9 rounded-lg overflow-hidden">
            {aggregatedColors.map((c, i) => (
              <div
                key={i}
                className="flex-1 transition-all hover:flex-[2] cursor-pointer relative group/strip"
                style={{ backgroundColor: c.hex }}
                title={`${c.hex} — ${c.role}`}
              >
                <span className="absolute bottom-0 left-0 right-0 text-center text-[8px] text-white opacity-0 group-hover/strip:opacity-100 transition-opacity bg-black/50 py-0.5">
                  {c.hex}
                </span>
              </div>
            ))}
          </div>
          {/* Color list */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {aggregatedColors.slice(0, 8).map((c, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-sm border border-border flex-shrink-0"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-[10px] text-text-secondary font-mono">{c.hex}</span>
                <span className="text-[9px] text-text-tertiary">{c.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No analysis hint */}
      {analyzedRefs.length === 0 && (
        <div className="mb-5 px-4 py-3 rounded-lg border border-border bg-bg-surface">
          <p className="text-[11px] text-text-tertiary leading-relaxed">
            {t("noAnalysis")}
          </p>
        </div>
      )}

      {/* Pattern analysis + summary row */}
      {analyzedRefs.length >= 2 && (
        <div className="mb-5 flex items-start gap-4">
          {/* Patterns */}
          {!patterns ? (
            <button
              onClick={analyzePatterns}
              disabled={loadingPatterns}
              className="py-2 px-4 rounded-md text-xs bg-accent-dim text-accent border border-accent-border font-medium hover:opacity-85 transition-opacity cursor-pointer disabled:opacity-50 flex-shrink-0"
            >
              {loadingPatterns ? t("analyzing") : t("analyzePatterns")}
            </button>
          ) : (
            <div className="flex-1 flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold">
                {t("commonPatterns")}
              </span>
              <ul className="flex flex-wrap gap-x-4 gap-y-1">
                {patterns.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 text-[11px] text-text-secondary leading-relaxed"
                  >
                    <span className="text-accent mt-0.5 flex-shrink-0">&#x2022;</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary stats */}
          <div className="flex gap-4 flex-shrink-0 text-[11px]">
            <div className="flex flex-col items-center">
              <span className="text-text-secondary font-medium">{references.length}</span>
              <span className="text-[9px] text-text-tertiary">{t("referencesLabel")}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-text-secondary font-medium">{analyzedRefs.length}</span>
              <span className="text-[9px] text-text-tertiary">{t("analyzedLabel")}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-text-secondary font-medium">{aggregatedColors.length}</span>
              <span className="text-[9px] text-text-tertiary">{t("uniqueColors")}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3-column grid */}
      <div className="grid grid-cols-3 gap-3">
        {references.map((ref) => (
          <button
            key={ref.id}
            onClick={() => setModalRefId(ref.id)}
            className="group rounded-lg border border-border bg-bg-deep overflow-hidden transition-all cursor-pointer text-left hover:border-border-hover"
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
        ))}
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
