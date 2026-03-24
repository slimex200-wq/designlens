"use client";

import { useTranslations } from "next-intl";
import type { Enhancement, EnhancementType } from "@/lib/types";

interface EnhancementPanelProps {
  enhancements: Enhancement[];
  originalScore: number;
  improvedScore: number;
  highlightedIndex: number | null;
  onHighlight: (index: number | null) => void;
}

function typeLabelKey(type: EnhancementType): string {
  switch (type) {
    case "color":
      return "enhanceColor";
    case "spacing":
      return "enhanceSpacing";
    case "typography":
      return "enhanceTypography";
    case "position":
      return "enhancePosition";
    case "contrast":
      return "enhanceContrast";
  }
}

function isHexColor(value: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value.trim());
}

interface ColorSwatchProps {
  color: string;
  label: string;
}

function ColorSwatch({ color, label }: ColorSwatchProps) {
  return (
    <span className="flex items-center gap-1">
      <span
        className="inline-block w-4 h-4 rounded-sm border border-border flex-shrink-0"
        style={{ backgroundColor: color }}
        aria-label={color}
      />
      <span className="font-mono text-[10px] text-text-secondary">{label}</span>
    </span>
  );
}

export function EnhancementPanel({
  enhancements,
  originalScore,
  improvedScore,
  highlightedIndex,
  onHighlight,
}: EnhancementPanelProps) {
  const t = useTranslations("review");

  const scoreColor = (score: number) =>
    score >= 80 ? "text-success" : score >= 50 ? "text-warning" : "text-error";

  return (
    <div className="p-4 flex flex-col gap-3">
      {/* Score comparison header */}
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-2">
          <span className={`text-4xl font-bold ${scoreColor(originalScore)}`}>
            {originalScore}
          </span>
          <span className="text-text-tertiary text-xl emoji-text">&#x2192;</span>
          <span className={`text-4xl font-bold ${scoreColor(improvedScore)}`}>
            {improvedScore}
          </span>
        </div>
        <div className="text-[11px] text-text-tertiary mt-1">{t("enhanceScore")}</div>
      </div>

      <div className="h-px bg-border" />

      {/* Enhancement count */}
      <div className="text-[11px] text-text-tertiary font-medium uppercase tracking-wider">
        {t("enhanceCount", { count: enhancements.length })}
      </div>

      {/* Enhancement cards */}
      {enhancements.length === 0 ? (
        <p className="text-[12px] text-text-tertiary text-center py-4">{t("enhanceEmpty")}</p>
      ) : (
        enhancements.map((enh, i) => {
          const isActive = highlightedIndex === i;
          const beforeIsColor = enh.type === "color" && isHexColor(enh.before);
          const afterIsColor = enh.type === "color" && isHexColor(enh.after);

          return (
            <button
              key={i}
              onClick={() => onHighlight(isActive ? null : i)}
              className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer min-h-[44px] ${
                isActive
                  ? "bg-bg-elevated border-accent-border"
                  : "bg-bg-deep border-border hover:border-border-hover"
              }`}
            >
              {/* Type badge + before→after */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-success-dim text-success">
                  {t(typeLabelKey(enh.type))}
                </span>

                {/* Before → After values */}
                {beforeIsColor && afterIsColor ? (
                  <span className="flex items-center gap-1.5">
                    <ColorSwatch color={enh.before} label={enh.before} />
                    <span className="text-text-tertiary text-[10px] emoji-text">&#x2192;</span>
                    <ColorSwatch color={enh.after} label={enh.after} />
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-mono text-[10px] text-text-secondary">
                    <span>{enh.before}</span>
                    <span className="text-text-tertiary emoji-text">&#x2192;</span>
                    <span>{enh.after}</span>
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-[11px] text-text-secondary leading-relaxed">
                {enh.description}
              </p>
            </button>
          );
        })
      )}
    </div>
  );
}
