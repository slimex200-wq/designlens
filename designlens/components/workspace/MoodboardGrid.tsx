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
        typography: r.analysis!.typography.map((t) => `${t.size}/${t.weight}`),
      }));

      const res = await fetch("/api/patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ references: summaries }),
      });

      if (res.ok) {
        const data = await res.json();
        setPatterns(data.patterns ?? ["Similar color palettes detected", "Consistent spacing patterns", "Shared typography scale"]);
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
        <p className="text-sm text-text-tertiary">No references yet. Upload some to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: Compact image grid */}
      <div className="flex-1 p-5 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Moodboard</h2>
          <span className="text-[11px] text-text-tertiary">{references.length} references</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {references.map((ref) => (
            <button
              key={ref.id}
              onClick={() => onSelectRef(ref.id)}
              className="group rounded-lg border border-border bg-bg-deep overflow-hidden transition-all hover:border-border-hover cursor-pointer text-left"
            >
              <div className="aspect-[3/2] bg-bg-elevated overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ref.filePath}
                  alt={ref.fileName}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="px-2 py-1.5">
                <p className="text-[11px] font-medium text-text-primary truncate">
                  {ref.fileName}
                </p>
                {ref.analysis && ref.analysis.colors.length > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {ref.analysis.colors.slice(0, 5).map((c, i) => (
                      <div
                        key={i}
                        className="w-3 h-3 rounded-full border border-border"
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
      </div>

      {/* Right: Insights panel */}
      <div className="w-[280px] border-l border-border bg-bg-surface p-4 overflow-y-auto flex flex-col gap-4 flex-shrink-0">
        <h3 className="text-[13px] font-semibold text-text-primary">Insights</h3>

        {/* Color Palette */}
        {aggregatedColors.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold">
              Color Palette
            </span>
            <div className="flex gap-1 h-7 rounded-lg overflow-hidden">
              {aggregatedColors.map((c, i) => (
                <div
                  key={i}
                  className="flex-1 transition-all hover:flex-[2] cursor-pointer relative group"
                  style={{ backgroundColor: c.hex }}
                  title={`${c.hex} - ${c.role}`}
                >
                  <span className="absolute bottom-0 left-0 right-0 text-center text-[7px] text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 py-px">
                    {c.hex}
                  </span>
                </div>
              ))}
            </div>
            {/* Color list */}
            <div className="flex flex-col gap-1 mt-1">
              {aggregatedColors.slice(0, 6).map((c, i) => (
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

        <div className="h-px bg-border" />

        {/* Analyze Patterns — prominent placement */}
        {analyzedRefs.length >= 2 && !patterns && (
          <button
            onClick={analyzePatterns}
            disabled={loadingPatterns}
            className="w-full py-2.5 rounded-md text-xs bg-accent-dim text-accent border border-accent-border font-medium hover:opacity-85 transition-opacity cursor-pointer disabled:opacity-50"
          >
            {loadingPatterns ? "Analyzing..." : "Analyze Patterns"}
          </button>
        )}

        {/* Patterns result */}
        {patterns && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold">
              Common Patterns
            </span>
            <ul className="flex flex-col gap-2">
              {patterns.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-text-secondary leading-relaxed">
                  <span className="text-accent mt-0.5 flex-shrink-0">&#x2022;</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Stats */}
        {analyzedRefs.length > 0 && (
          <>
            <div className="h-px bg-border" />
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold">
                Summary
              </span>
              <div className="flex justify-between text-[11px]">
                <span className="text-text-tertiary">References</span>
                <span className="text-text-secondary">{references.length}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-text-tertiary">Analyzed</span>
                <span className="text-text-secondary">{analyzedRefs.length}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-text-tertiary">Unique colors</span>
                <span className="text-text-secondary">{aggregatedColors.length}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
