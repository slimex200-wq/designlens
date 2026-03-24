"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { AnalysisResult, ExtractedStyles, PageMetadata } from "@/lib/types";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { ColorTab } from "./ColorTab";
import { TypographyTab } from "./TypographyTab";
import { LayoutTab } from "./LayoutTab";
import { TokenTab } from "./TokenTab";

function SourceTab({ extractedStyles: es, pageMetadata: meta }: { extractedStyles: ExtractedStyles; pageMetadata?: PageMetadata }) {
  const t = useTranslations("analysisPanel");

  return (
    <div className="flex flex-col gap-4">
      {/* Page info */}
      {meta && (meta.title || meta.description) && (
        <div>
          <h4 className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold mb-2">{t("sourceMeta")}</h4>
          {meta.title && <p className="text-[12px] text-text-primary font-medium mb-1">{meta.title}</p>}
          {meta.description && <p className="text-[11px] text-text-secondary leading-relaxed">{meta.description}</p>}
          {meta.viewport && <p className="text-[10px] text-text-tertiary mt-1 font-mono">{meta.viewport}</p>}
        </div>
      )}

      {/* Fonts */}
      {es.fonts.length > 0 && (
        <div>
          <h4 className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold mb-2">{t("sourceFonts")}</h4>
          <div className="flex flex-col gap-1.5">
            {es.fonts.map((f) => (
              <div key={f.family} className="flex items-center justify-between p-2 rounded bg-bg-deep border border-border">
                <span className="text-[12px] text-text-primary font-medium">{f.family}</span>
                <span className="text-[10px] text-text-tertiary font-mono">{f.weights.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSS Variables */}
      {Object.keys(es.cssVariables).length > 0 && (
        <div>
          <h4 className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold mb-2">{t("sourceCssVars")}</h4>
          <div className="bg-bg-deep border border-border rounded p-3 max-h-[200px] overflow-y-auto">
            <pre className="text-[10px] font-mono text-text-secondary leading-relaxed">
              {Object.entries(es.cssVariables).map(([k, v]) => `${k}: ${v};`).join("\n")}
            </pre>
          </div>
        </div>
      )}

      {/* Breakpoints */}
      {es.breakpoints.length > 0 && (
        <div>
          <h4 className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold mb-2">{t("sourceBreakpoints")}</h4>
          <div className="flex flex-wrap gap-1.5">
            {es.breakpoints.map((bp) => (
              <span key={bp} className="text-[10px] font-mono px-2 py-1 rounded bg-bg-elevated border border-border text-text-secondary">
                {bp}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type Tab = "colors" | "typography" | "layout" | "tokens" | "source";

interface AnalysisPanelProps {
  analysis: AnalysisResult | null;
  fileName: string | null;
  onClose?: () => void;
  extractedStyles?: ExtractedStyles;
  pageMetadata?: PageMetadata;
}

export function AnalysisPanel({ analysis, fileName, onClose, extractedStyles, pageMetadata }: AnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("colors");
  const t = useTranslations("analysisPanel");
  const bp = useBreakpoint();

  // Lock body scroll when panel is open on mobile/tablet
  useEffect(() => {
    if (bp !== "desktop" && analysis) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [bp, analysis]);

  const TABS: { id: Tab; label: string }[] = [
    { id: "colors", label: t("colors") },
    { id: "typography", label: t("typography") },
    { id: "layout", label: t("layout") },
    { id: "tokens", label: t("tokens") },
    ...(extractedStyles ? [{ id: "source" as Tab, label: t("sourceTab") }] : []),
  ];

  const panelContent = (
    <>
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
        <h3 className="text-sm font-semibold tracking-tight">{t("title")}</h3>
        <div className="flex items-center gap-2">
          {fileName && (
            <span className="text-[11px] text-text-tertiary">{fileName}</span>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] rounded flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-all cursor-pointer text-xs"
              title={t("closePanel")}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tab row */}
      <div className="flex border-b border-border flex-shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-center text-[11px] font-medium cursor-pointer transition-all border-b-2 min-h-[44px] md:min-h-0 ${
              activeTab === tab.id
                ? "text-text-primary border-accent"
                : "text-text-tertiary border-transparent hover:text-text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* AI unavailable banner */}
      {analysis && !analysis.aiAvailable && (
        <div className="mx-5 mt-3 px-3 py-2 rounded-md bg-warning-dim border border-[rgba(251,191,36,0.15)] text-[11px] text-warning leading-relaxed">
          {t("aiUnavailable")}
        </div>
      )}

      {/* Body */}
      {analysis ? (
        <div className="p-5 flex flex-col gap-5 flex-1 overflow-y-auto">
          {activeTab === "colors" && <ColorTab colors={analysis.colors} />}
          {activeTab === "typography" && <TypographyTab typography={analysis.typography} />}
          {activeTab === "layout" && <LayoutTab layout={analysis.layout} />}
          {activeTab === "tokens" && <TokenTab tokens={analysis.tokens} />}
          {activeTab === "source" && extractedStyles && (
            <SourceTab extractedStyles={extractedStyles} pageMetadata={pageMetadata} />
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-5">
          <p className="text-[13px] text-text-tertiary text-center">
            {t("selectReference")}
          </p>
        </div>
      )}
    </>
  );

  // ─── Desktop: inline panel ───
  if (bp === "desktop") {
    return (
      <section role="complementary" aria-label={t("title")} className="w-[360px] border-l border-border bg-bg-surface overflow-y-auto flex flex-col flex-shrink-0">
        {panelContent}
      </section>
    );
  }

  // ─── Tablet: slide-over drawer from right ───
  if (bp === "tablet") {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={onClose}
          role="button"
          aria-label={t("closePanel")}
          tabIndex={0}
          onKeyDown={(e) => e.key === "Escape" && onClose?.()}
        />
        {/* Drawer */}
        <section
          role="complementary"
          aria-label={t("title")}
          className="fixed top-0 right-0 h-screen w-[360px] z-50 bg-bg-surface border-l border-border flex flex-col animate-[slideInRight_0.2s_ease-out]"
        >
          {panelContent}
        </section>
      </>
    );
  }

  // ─── Mobile: bottom sheet ───
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />
      {/* Bottom sheet */}
      <section
        aria-label={t("title")}
        className="fixed bottom-0 left-0 right-0 z-50 bg-bg-surface border-t border-border rounded-t-2xl flex flex-col max-h-[75vh] animate-[slideUp_0.25s_ease-out]"
      >
        {/* Drag handle */}
        <div className="flex justify-center py-2 flex-shrink-0">
          <div className="w-8 h-1 rounded-full bg-border-hover" />
        </div>
        {panelContent}
      </section>
    </>
  );
}
