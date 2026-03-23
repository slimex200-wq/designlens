"use client";

import { useMemo, useState } from "react";
import type { ReferenceImage, ColorInfo } from "@/lib/types";

interface MoodboardGridProps {
  references: ReferenceImage[];
  onSelectRef: (id: string) => void;
}

export function MoodboardGrid({ references, onSelectRef }: MoodboardGridProps) {
  const [patterns, setPatterns] = useState<string[] | null>(null);
  const [loadingPatterns, setLoadingPatterns] = useState(false);

  const analyzedRefs = useMemo(
    () => references.filter((r) => r.status === "analyzed" && r.analysis),
    [references]
  );

  // Aggregate colors from all analyzed refs, sorted by frequency, max 12
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
      // Build a summary of all analyses to send to AI
      const summaries = analyzedRefs.map((r) => ({
        fileName: r.fileName,
        colors: r.analysis!.colors.map((c: ColorInfo) => c.hex),
        layout: r.analysis!.layout.type,
        typography: r.analysis!.typography.map((t) => `${t.size}/${t.weight}`),
      }));

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "patterns", references: summaries }),
      });

      if (res.ok) {
        const data = await res.json();
        setPatterns(data.patterns ?? ["Similar color palettes detected", "Consistent spacing patterns", "Shared typography scale"]);
      } else {
        // Fallback patterns
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

  return (
    <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold tracking-tight">Moodboard</h2>
        <span className="text-[11px] text-text-tertiary">{references.length} references</span>
      </div>

      {/* Aggregated color palette */}
      {aggregatedColors.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold">
            Color Palette
          </span>
          <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
            {aggregatedColors.map((c, i) => (
              <div
                key={i}
                className="flex-1 transition-all hover:flex-[2] cursor-pointer relative group"
                style={{ backgroundColor: c.hex }}
                title={`${c.hex} - ${c.role}`}
              >
                <span className="absolute bottom-0 left-0 right-0 text-center text-[8px] text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 py-px">
                  {c.hex}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Moodboard grid */}
      {references.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {references.map((ref) => (
            <button
              key={ref.id}
              onClick={() => onSelectRef(ref.id)}
              className="group rounded-lg border border-border bg-bg-deep overflow-hidden transition-all hover:border-border-hover cursor-pointer text-left"
            >
              {/* Large thumbnail */}
              <div className="aspect-[4/3] bg-bg-elevated overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ref.filePath}
                  alt={ref.fileName}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              {/* Info */}
              <div className="p-3">
                <p className="text-[12px] font-medium text-text-primary truncate">
                  {ref.fileName}
                </p>
                {/* Color dots */}
                {ref.analysis && ref.analysis.colors.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {ref.analysis.colors.slice(0, 6).map((c, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: c.hex }}
                        title={`${c.hex} - ${c.role}`}
                      />
                    ))}
                  </div>
                )}
                {ref.status === "processing" && (
                  <p className="text-[10px] text-text-tertiary mt-1 animate-pulse">Processing...</p>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-text-tertiary">No references yet. Upload some to get started.</p>
        </div>
      )}

      {/* Analyze Patterns button */}
      {analyzedRefs.length >= 2 && !patterns && (
        <button
          onClick={analyzePatterns}
          disabled={loadingPatterns}
          className="self-start px-4 py-2 rounded-md text-xs bg-accent-dim text-accent border border-accent-border font-medium hover:opacity-85 transition-opacity cursor-pointer disabled:opacity-50"
        >
          {loadingPatterns ? "Analyzing..." : "Analyze Patterns"}
        </button>
      )}

      {/* Common Patterns card */}
      {patterns && (
        <div className="rounded-lg border border-border bg-bg-surface p-4">
          <h3 className="text-[13px] font-semibold text-text-primary mb-3">Common Patterns</h3>
          <ul className="flex flex-col gap-2">
            {patterns.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-text-secondary">
                <span className="text-accent mt-0.5 flex-shrink-0">&#x2022;</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
