"use client";

import { useMemo, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { ReferenceImage, TokenSet } from "@/lib/types";
import { exportTokens } from "@/lib/tokens";
import { Modal } from "@/components/ui/Modal";

const COLOR_LIMIT = 16;

interface TokensViewProps {
  references: ReferenceImage[];
  onToolChange: (tool: "analyze" | "moodboard" | "review" | "tokens") => void;
}

type ExportFormat = "css" | "tailwind" | "json" | "scss" | "w3c" | "figma";

/** Parse the leading numeric portion of a CSS length like "16px" -> 16. */
function parsePx(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/** Strip common prefixes so role labels read cleanly. */
function roleLabel(key: string): string {
  return key.replace(/^--/, "").replace(/^(color-|bg-|text-|space-|radius-)/, "");
}

export function TokensView({ references, onToolChange }: TokensViewProps) {
  const [format, setFormat] = useState<ExportFormat>("css");
  const [copiedCode, setCopiedCode] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAllColors, setShowAllColors] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
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

  // Copy any token value with brief per-token inline feedback (no setState-in-effect).
  const copyToken = useCallback((key: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1200);
    });
  }, []);

  const copyCode = useCallback(() => {
    const output = exportTokens(mergedTokens, format);
    navigator.clipboard.writeText(output).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  }, [mergedTokens, format]);

  const formatLabels: Record<ExportFormat, string> = {
    css: t("cssProperties"),
    tailwind: t("tailwindConfig"),
    json: t("json"),
    scss: t("scss"),
    w3c: t("w3c"),
    figma: t("figmaTokens"),
  };

  const colorEntries = Object.entries(mergedTokens.colors);
  const spacingEntries = Object.entries(mergedTokens.spacing);
  const radiusEntries = Object.entries(mergedTokens.radius);
  const typography = mergedTokens.typography;

  const maxSpacing = Math.max(1, ...spacingEntries.map(([, v]) => parsePx(v)));
  const visibleColors =
    showAllColors || colorEntries.length <= COLOR_LIMIT
      ? colorEntries
      : colorEntries.slice(0, COLOR_LIMIT);

  const hasTokens =
    colorEntries.length > 0 ||
    spacingEntries.length > 0 ||
    radiusEntries.length > 0 ||
    typography.length > 0;

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
            className="px-4 rounded-md text-xs bg-accent-dim text-accent border border-accent-border font-medium hover:opacity-85 transition-opacity cursor-pointer min-h-[44px] flex items-center mx-auto"
          >
            {tc("goToAnalyze")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto p-5 sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
            <p className="text-[11px] text-text-tertiary mt-0.5">
              {t("fromReferences", { count: analyzedRefs.length })}
            </p>
          </div>
          <button
            onClick={() => setShowExport(true)}
            className="px-4 rounded-md text-xs bg-bg-elevated text-text-primary border border-border font-medium hover:border-border-hover hover:bg-bg-hover transition-colors cursor-pointer min-h-[44px] flex items-center gap-2"
          >
            <span className="font-mono text-accent-text">{"</>"}</span>
            {t("viewCode")}
          </button>
        </div>

        <p className="text-[11px] text-text-tertiary mb-6">{t("clickToCopy")}</p>

        {!hasTokens && (
          <p className="text-sm text-text-tertiary">{t("noTokens")}</p>
        )}

        {/* COLORS */}
        {colorEntries.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold">
                {t("colors")}
              </span>
              <span className="text-[10px] text-text-tertiary">{colorEntries.length}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {visibleColors.map(([key, value]) => {
                const isCopied = copiedKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => copyToken(key, value)}
                    title={`${key}: ${value}`}
                    className="group flex flex-col text-left rounded-lg border border-border bg-bg-surface overflow-hidden hover:border-border-hover transition-colors cursor-pointer"
                  >
                    <span
                      className="block w-full aspect-[4/3] border-b border-border"
                      style={{ backgroundColor: value }}
                    />
                    <span className="px-2.5 py-2">
                      <span className="block font-mono text-[11px] text-text-primary truncate">
                        {isCopied ? t("copied", { value }) : value}
                      </span>
                      <span className="block text-[10px] text-text-tertiary truncate mt-0.5">
                        {roleLabel(key)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            {colorEntries.length > COLOR_LIMIT && (
              <button
                onClick={() => setShowAllColors((v) => !v)}
                className="mt-3 text-[11px] text-accent hover:text-accent-text transition-colors cursor-pointer"
              >
                {showAllColors
                  ? t("showLess")
                  : t("showMore", { count: colorEntries.length - COLOR_LIMIT })}
              </button>
            )}
          </section>
        )}

        {/* TYPOGRAPHY */}
        {typography.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold">
                {t("typography")}
              </span>
              <span className="text-[10px] text-text-tertiary">{typography.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {typography.map((tk, i) => {
                const key = `typo-${i}`;
                const realSize = parsePx(tk.size);
                const visualSize = Math.min(realSize || 16, 48);
                const isCopied = copiedKey === key;
                const value = `${tk.size} / ${tk.weight}`;
                return (
                  <button
                    key={key}
                    onClick={() => copyToken(key, value)}
                    title={value}
                    className="group flex items-center justify-between gap-4 rounded-lg border border-border bg-bg-surface px-4 py-3 hover:border-border-hover transition-colors cursor-pointer text-left"
                  >
                    <span
                      className="text-text-primary leading-none whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{
                        fontSize: `${visualSize}px`,
                        fontWeight: tk.weight,
                        letterSpacing: tk.letterSpacing || undefined,
                        fontFamily: tk.fontFamily || undefined,
                      }}
                    >
                      Ag
                    </span>
                    <span className="flex flex-col items-end gap-0.5 flex-shrink-0 font-mono text-[10px]">
                      {isCopied ? (
                        <span className="text-accent-text">{t("copied", { value })}</span>
                      ) : (
                        <>
                          <span className="text-text-secondary">
                            {tk.size} · {tk.weight}
                          </span>
                          <span className="text-text-tertiary">{tk.role}</span>
                          {tk.fontFamily && (
                            <span className="text-text-tertiary truncate max-w-[160px]">
                              {tk.fontFamily}
                            </span>
                          )}
                        </>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* SPACING */}
        {spacingEntries.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold">
                {t("spacing")}
              </span>
              <span className="text-[10px] text-text-tertiary">{spacingEntries.length}</span>
            </div>
            <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-bg-surface p-4">
              {spacingEntries.map(([key, value]) => {
                const px = parsePx(value);
                const pct = Math.max(4, Math.round((px / maxSpacing) * 100));
                const isCopied = copiedKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => copyToken(key, value)}
                    title={`${key}: ${value}`}
                    className="group flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-bg-hover transition-colors cursor-pointer text-left"
                  >
                    <span className="font-mono text-[11px] text-text-secondary w-28 flex-shrink-0 truncate">
                      {roleLabel(key)}
                    </span>
                    <span className="flex-1 h-2 rounded-full bg-bg-deep overflow-hidden">
                      <span
                        className="block h-full rounded-full bg-accent/60 group-hover:bg-accent transition-colors"
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                    <span className="font-mono text-[11px] text-text-tertiary w-24 text-right flex-shrink-0">
                      {isCopied ? t("copied", { value }) : value}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* RADIUS */}
        {radiusEntries.length > 0 && (
          <section className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold">
                {t("radius")}
              </span>
              <span className="text-[10px] text-text-tertiary">{radiusEntries.length}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {radiusEntries.map(([key, value]) => {
                const px = parsePx(value);
                const visual = Math.min(px, 24);
                const isCopied = copiedKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => copyToken(key, value)}
                    title={`${key}: ${value}`}
                    className="group flex flex-col items-center gap-2 rounded-lg border border-border bg-bg-surface p-4 hover:border-border-hover transition-colors cursor-pointer"
                  >
                    <span
                      className="w-12 h-12 bg-bg-elevated border border-border-hover group-hover:border-accent-border transition-colors"
                      style={{ borderRadius: `${visual}px` }}
                    />
                    <span className="font-mono text-[11px] text-text-primary truncate w-full text-center">
                      {isCopied ? t("copied", { value }) : value}
                    </span>
                    <span className="text-[10px] text-text-tertiary truncate w-full text-center">
                      {roleLabel(key)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Secondary: Export code overlay */}
      {showExport && (
        <Modal
          title={t("export")}
          onClose={() => setShowExport(false)}
          closeLabel={t("hideCode")}
        >
          <div className="flex flex-col gap-4">
            {/* Format selector */}
            <div className="grid grid-cols-2 gap-1.5">
              {(["css", "tailwind", "json", "scss", "w3c", "figma"] as ExportFormat[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`py-2 px-3 text-left text-[12px] rounded-md border font-medium transition-all cursor-pointer ${
                    format === f
                      ? "border-accent-border text-accent bg-accent-dim"
                      : "border-border text-text-secondary bg-bg-deep hover:border-border-hover hover:text-text-primary"
                  }`}
                >
                  {formatLabels[f]}
                </button>
              ))}
            </div>

            {/* Code preview */}
            <div className="rounded-md bg-bg-deep border border-border p-3 max-h-[40vh] overflow-auto">
              <pre className="text-[10px] font-mono text-text-secondary whitespace-pre-wrap leading-relaxed">
                {exportTokens(mergedTokens, format)}
              </pre>
            </div>

            {/* Copy code */}
            <button
              onClick={copyCode}
              className="w-full py-2.5 rounded-md bg-text-primary text-bg-deep text-[12px] font-semibold cursor-pointer hover:opacity-85 transition-opacity"
            >
              {copiedCode ? tc("copied") : tc("copy")}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
