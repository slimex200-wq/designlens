"use client";

import { useMemo, useState, useCallback } from "react";
import type { ReferenceImage, TokenSet } from "@/lib/types";
import { exportTokens } from "@/lib/tokens";

interface TokensViewProps {
  references: ReferenceImage[];
  onToolChange: (tool: "analyze" | "moodboard" | "review" | "tokens") => void;
}

type ExportFormat = "css" | "tailwind" | "json";

export function TokensView({ references, onToolChange }: TokensViewProps) {
  const [format, setFormat] = useState<ExportFormat>("css");
  const [copied, setCopied] = useState(false);

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

  const handleExport = useCallback(() => {
    const output = exportTokens(mergedTokens, format);
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [mergedTokens, format]);

  const groups: { title: string; entries: [string, string][]; colorPreview?: boolean }[] = [
    { title: "Colors", entries: Object.entries(mergedTokens.colors), colorPreview: true },
    { title: "Spacing", entries: Object.entries(mergedTokens.spacing) },
    { title: "Radius", entries: Object.entries(mergedTokens.radius) },
  ];

  const hasTokens = groups.some((g) => g.entries.length > 0) || mergedTokens.typography.length > 0;

  if (analyzedRefs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-bg-elevated border border-border flex items-center justify-center mx-auto mb-4 text-lg text-text-tertiary">
            {"{ }"}
          </div>
          <p className="text-sm text-text-secondary mb-4">
            Analyze references first to generate design tokens for export.
          </p>
          <button
            onClick={() => onToolChange("analyze")}
            className="px-4 py-2 rounded-md text-xs bg-accent-dim text-accent border border-accent-border font-medium hover:opacity-85 transition-opacity cursor-pointer"
          >
            Go to Analyze
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: Token list */}
      <div className="flex-1 p-5 overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold tracking-tight">Design Tokens</h2>
          <span className="text-[11px] text-text-tertiary">
            from {analyzedRefs.length} reference{analyzedRefs.length !== 1 ? "s" : ""}
          </span>
        </div>

        {!hasTokens && (
          <p className="text-sm text-text-tertiary">
            AI analysis didn&apos;t extract tokens. Try uploading more detailed UI screenshots.
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {groups.map((group) =>
            group.entries.length > 0 ? (
              <div key={group.title} className="rounded-lg border border-border bg-bg-surface p-4">
                <div className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold mb-3">
                  {group.title}
                </div>
                <div className="flex flex-col gap-1">
                  {group.entries.map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center font-mono text-[11px] px-2 py-1.5 rounded hover:bg-bg-hover transition-colors"
                    >
                      {group.colorPreview && (
                        <div
                          className="w-3 h-3 rounded-sm border border-border mr-2 flex-shrink-0"
                          style={{ backgroundColor: value }}
                        />
                      )}
                      <span className="text-accent-text">{key}</span>
                      <span className="text-text-tertiary mx-1.5">:</span>
                      <span className="text-text-secondary">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          )}

          {/* Typography tokens */}
          {mergedTokens.typography.length > 0 && (
            <div className="rounded-lg border border-border bg-bg-surface p-4">
              <div className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold mb-3">
                Typography
              </div>
              <div className="flex flex-col gap-1">
                {mergedTokens.typography.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center font-mono text-[11px] px-2 py-1.5 rounded hover:bg-bg-hover transition-colors"
                  >
                    <span className="text-accent-text">{t.role}</span>
                    <span className="text-text-tertiary mx-1.5">:</span>
                    <span className="text-text-secondary">
                      {t.size}/{t.weight}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Export panel */}
      <div className="w-[280px] border-l border-border bg-bg-surface p-4 flex flex-col gap-4 flex-shrink-0">
        <h3 className="text-[13px] font-semibold text-text-primary">Export</h3>

        {/* Format selection */}
        <div className="flex flex-col gap-1.5">
          {(["css", "tailwind", "json"] as ExportFormat[]).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`w-full py-2 px-3 text-left text-[12px] rounded-md border font-medium transition-all cursor-pointer ${
                format === f
                  ? "border-accent-border text-accent bg-accent-dim"
                  : "border-border text-text-secondary bg-bg-deep hover:border-border-hover hover:text-text-primary"
              }`}
            >
              {f === "css" ? "CSS Custom Properties" : f === "tailwind" ? "Tailwind Config" : "JSON"}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="flex-1 rounded-md bg-bg-deep border border-border p-3 overflow-auto">
          <pre className="text-[10px] font-mono text-text-secondary whitespace-pre-wrap leading-relaxed">
            {exportTokens(mergedTokens, format)}
          </pre>
        </div>

        {/* Copy button */}
        <button
          onClick={handleExport}
          className="w-full py-2.5 rounded-md bg-text-primary text-bg-deep text-[12px] font-semibold cursor-pointer hover:opacity-85 transition-opacity"
        >
          {copied ? "Copied!" : "Copy to Clipboard"}
        </button>

        {/* Stats */}
        <div className="h-px bg-border" />
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold">
            Summary
          </span>
          <div className="flex justify-between text-[11px]">
            <span className="text-text-tertiary">Colors</span>
            <span className="text-text-secondary">{Object.keys(mergedTokens.colors).length}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-text-tertiary">Spacing</span>
            <span className="text-text-secondary">{Object.keys(mergedTokens.spacing).length}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-text-tertiary">Radius</span>
            <span className="text-text-secondary">{Object.keys(mergedTokens.radius).length}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-text-tertiary">Typography</span>
            <span className="text-text-secondary">{mergedTokens.typography.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
