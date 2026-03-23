"use client";

import { useState, useEffect, useMemo } from "react";
import type { AnalysisResult } from "@/lib/types";

const CACHE_KEY = "designlens_analysis_cache";

export default function TrendsPage() {
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cache: Record<string, AnalysisResult> = JSON.parse(raw);
        setAnalyses(Object.values(cache));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Color frequency: aggregate all colors, sorted by total percentage
  const colorFrequency = useMemo(() => {
    const map = new Map<string, { hex: string; role: string; total: number; count: number }>();
    for (const a of analyses) {
      for (const c of a.colors) {
        const key = c.hex.toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.total += c.percentage;
          existing.count++;
        } else {
          map.set(key, { hex: c.hex, role: c.role, total: c.percentage, count: 1 });
        }
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [analyses]);

  const maxColorTotal = colorFrequency[0]?.total ?? 1;

  // Layout patterns
  const layoutPatterns = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of analyses) {
      const type = a.layout.type || "unknown";
      map.set(type, (map.get(type) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [analyses]);

  const maxLayoutCount = layoutPatterns[0]?.count ?? 1;

  // Typography trends
  const typographyTrends = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of analyses) {
      for (const t of a.typography) {
        const key = `${t.size} / weight ${t.weight}`;
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [analyses]);

  if (analyses.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center mx-auto mb-5 text-2xl text-text-tertiary">
            &#x2197;
          </div>
          <h2 className="text-base font-semibold text-text-primary mb-2">No trends yet</h2>
          <p className="text-sm text-text-secondary mb-5 leading-relaxed">
            Analyze a few references first. Once you have some data, design trends like popular colors, layouts, and typography will appear here.
          </p>
          <a
            href="/app"
            className="inline-flex px-4 py-2 rounded-md text-xs bg-accent-dim text-accent border border-accent-border font-medium hover:opacity-85 transition-opacity"
          >
            Go to Workspace
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary">Your Design Trends</h1>
        <p className="text-[12px] text-text-tertiary mt-1">
          Aggregated from {analyses.length} analysis{analyses.length !== 1 ? "es" : ""}
        </p>
      </div>

      {/* Color Frequency */}
      <section className="rounded-lg border border-border bg-bg-surface p-5">
        <h2 className="text-[13px] font-semibold text-text-primary mb-4">Color Frequency</h2>
        <div className="flex flex-col gap-2.5">
          {colorFrequency.map((c, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-md border border-border flex-shrink-0"
                style={{ backgroundColor: c.hex }}
              />
              <span className="text-[11px] text-text-secondary w-16 flex-shrink-0 font-mono">
                {c.hex}
              </span>
              <div className="flex-1 h-5 bg-bg-deep rounded-md overflow-hidden">
                <div
                  className="h-full rounded-md transition-all"
                  style={{
                    width: `${(c.total / maxColorTotal) * 100}%`,
                    backgroundColor: c.hex,
                    opacity: 0.7,
                  }}
                />
              </div>
              <span className="text-[10px] text-text-tertiary w-8 text-right flex-shrink-0">
                {c.count}x
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Layout Patterns */}
      <section className="rounded-lg border border-border bg-bg-surface p-5">
        <h2 className="text-[13px] font-semibold text-text-primary mb-4">Layout Patterns</h2>
        <div className="flex flex-col gap-2.5">
          {layoutPatterns.map((l, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-[12px] text-text-secondary w-28 flex-shrink-0 capitalize">
                {l.type}
              </span>
              <div className="flex-1 h-5 bg-bg-deep rounded-md overflow-hidden">
                <div
                  className="h-full bg-accent rounded-md transition-all"
                  style={{
                    width: `${(l.count / maxLayoutCount) * 100}%`,
                    opacity: 0.6,
                  }}
                />
              </div>
              <span className="text-[10px] text-text-tertiary w-8 text-right flex-shrink-0">
                {l.count}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Typography Trends */}
      <section className="rounded-lg border border-border bg-bg-surface p-5">
        <h2 className="text-[13px] font-semibold text-text-primary mb-4">Typography Trends</h2>
        {typographyTrends.length > 0 ? (
          <div className="flex flex-col gap-2">
            {typographyTrends.map((t, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
              >
                <span className="text-[12px] text-text-secondary font-mono">{t.label}</span>
                <span className="text-[10px] text-text-tertiary">{t.count} occurrence{t.count !== 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-text-tertiary">No typography data found.</p>
        )}
      </section>
    </div>
  );
}
