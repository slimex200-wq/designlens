"use client";

import { useMemo, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { ReferenceImage, TokenSet } from "@/lib/types";
import { exportTokens } from "@/lib/tokens";

const COLLAPSED_LIMIT = 8;

interface TokensViewProps {
  references: ReferenceImage[];
  onToolChange: (tool: "analyze" | "moodboard" | "review" | "tokens") => void;
}

type ExportFormat = "css" | "tailwind" | "json";

export function TokensView({ references, onToolChange }: TokensViewProps) {
  const [format, setFormat] = useState<ExportFormat>("css");
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const t = useTranslations("tokensView");
  const tc = useTranslations("common");

  const analyzedRefs = useMemo(
    () => references.filter((r) => r.status === "analyzed" && r.analysis),
    [references]
  );

  const mergedTokens = useMemo((): TokenSet => {
    const merged: TokenSet = { colors: {}, spacing: {}, radius: {}, typography: [] };
    for (const ref of analyzedRefs) {
      const tk = ref.analysis!.tokens;
      Object.assign(merged.colors, tk.colors);
      Object.assign(merged.spacing, tk.spacing);
      Object.assign(merged.radius, tk.radius);
      merged.typography.push(...tk.typography);
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

  const groups: { title: string; key: string; entries: [string, string][]; colorPreview?: boolean }[] = [
    { title: t("colors"), key: "colors", entries: Object.entries(mergedTokens.colors), colorPreview: true },
    { title: t("spacing"), key: "spacing", entries: Object.entries(mergedTokens.spacing) },
    { title: t("radius"), key: "radius", entries: Object.entries(mergedTokens.radius) },
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
            {t("emptyState")}
          </p>
          <button
            onClick={() => onToolChange("analyze")}
            className="px-4 py-2 rounded-md text-xs bg-accent-dim text-accent border border-accent-border font-medium hover:opacity-85 transition-opacity cursor-pointer"
          >
            {tc("goToAnalyze")}
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
          <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
          <span className="text-[11px] text-text-tertiary">
            {t("fromReferences", { count: analyzedRefs.length })}
          </span>
        </div>

        {!hasTokens && (
          <p className="text-sm text-text-tertiary">
            {t("noTokens")}
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {groups.map((group) => {
            if (group.entries.length === 0) return null;
            const isExpanded = expanded[group.key] ?? false;
            const visible = isExpanded ? group.entries : group.entries.slice(0, COLLAPSED_LIMIT);
            const hasMore = group.entries.length > COLLAPSED_LIMIT;

            return (
              <div key={group.key} className="rounded-lg border border-border bg-bg-surface p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold">
                    {group.title}
                  </span>
                  <span className="text-[10px] text-text-tertiary">{group.entries.length}</span>
                </div>

                {group.colorPreview ? (
                  /* Compact color swatch grid */
                  <div className="grid grid-cols-4 gap-2">
                    {visible.map(([key, value]) => (
                      <div key={key} className="flex flex-col items-center gap-1 group" title={`${key}: ${value}`}>
                        <div
                          className="w-full aspect-square rounded-md border border-border group-hover:ring-1 group-hover:ring-accent-border transition-all"
                          style={{ backgroundColor: value }}
                        />
                        <span className="text-[9px] font-mono text-text-tertiary truncate w-full text-center">
                          {key.replace(/^(color-|bg-|text-)/, "")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Key-value list for spacing/radius */
                  <div className="flex flex-col gap-0.5">
                    {visible.map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between font-mono text-[11px] px-2 py-1 rounded hover:bg-bg-hover transition-colors"
                      >
                        <span className="text-accent-text truncate">{key}</span>
                        <span className="text-text-secondary flex-shrink-0 ml-2">{value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {hasMore && (
                  <button
                    onClick={() => setExpanded((prev) => ({ ...prev, [group.key]: !isExpanded }))}
                    className="mt-2 w-full text-[10px] text-accent hover:text-accent-text transition-colors cursor-pointer py-1"
                  >
                    {isExpanded ? t("showLess") : t("showMore", { count: group.entries.length - COLLAPSED_LIMIT })}
                  </button>
                )}
              </div>
            );
          })}

          {/* Typography tokens */}
          {mergedTokens.typography.length > 0 && (() => {
            const isExpanded = expanded["typography"] ?? false;
            const typoVisible = isExpanded ? mergedTokens.typography : mergedTokens.typography.slice(0, COLLAPSED_LIMIT);
            const hasMore = mergedTokens.typography.length > COLLAPSED_LIMIT;

            return (
              <div className="rounded-lg border border-border bg-bg-surface p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold">
                    {t("typography")}
                  </span>
                  <span className="text-[10px] text-text-tertiary">{mergedTokens.typography.length}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {typoVisible.map((tk, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between font-mono text-[11px] px-2 py-1 rounded hover:bg-bg-hover transition-colors"
                    >
                      <span className="text-accent-text truncate">{tk.role}</span>
                      <span className="text-text-secondary flex-shrink-0 ml-2">
                        {tk.size}/{tk.weight}
                      </span>
                    </div>
                  ))}
                </div>
                {hasMore && (
                  <button
                    onClick={() => setExpanded((prev) => ({ ...prev, typography: !isExpanded }))}
                    className="mt-2 w-full text-[10px] text-accent hover:text-accent-text transition-colors cursor-pointer py-1"
                  >
                    {isExpanded ? t("showLess") : t("showMore", { count: mergedTokens.typography.length - COLLAPSED_LIMIT })}
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Right: Export panel */}
      <div className="w-[280px] border-l border-border bg-bg-surface p-4 flex flex-col gap-4 flex-shrink-0">
        <h3 className="text-[13px] font-semibold text-text-primary">{t("export")}</h3>

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
              {f === "css" ? t("cssProperties") : f === "tailwind" ? t("tailwindConfig") : t("json")}
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
          {copied ? tc("copied") : tc("copy")}
        </button>

        {/* Stats */}
        <div className="h-px bg-border" />
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold">
            {t("summary")}
          </span>
          <div className="flex justify-between text-[11px]">
            <span className="text-text-tertiary">{t("colors")}</span>
            <span className="text-text-secondary">{Object.keys(mergedTokens.colors).length}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-text-tertiary">{t("spacing")}</span>
            <span className="text-text-secondary">{Object.keys(mergedTokens.spacing).length}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-text-tertiary">{t("radius")}</span>
            <span className="text-text-secondary">{Object.keys(mergedTokens.radius).length}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-text-tertiary">{t("typography")}</span>
            <span className="text-text-secondary">{mergedTokens.typography.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
