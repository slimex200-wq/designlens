"use client";

import { useTranslations } from "next-intl";
import type { ReferenceImage } from "@/lib/types";

interface RefCardProps {
  reference: ReferenceImage;
  selected: boolean;
  onClick: () => void;
  onDelete?: () => void;
}

export function RefCard({ reference, selected, onClick, onDelete }: RefCardProps) {
  const t = useTranslations("refCard");

  const statusClasses: Record<string, string> = {
    analyzed: "bg-success-dim text-success",
    processing: "bg-accent-dim text-accent",
    uploading: "bg-accent-dim text-accent",
    error: "bg-error-dim text-error",
  };

  const statusLabel: Record<string, string> = {
    analyzed: t("analyzed"),
    processing: t("processing"),
    uploading: t("uploading"),
    error: t("error"),
  };

  return (
    <div
      onClick={onClick}
      className={`group rounded-lg overflow-hidden border transition-all cursor-pointer hover:-translate-y-px relative ${
        selected
          ? "border-accent shadow-[0_0_0_1px_var(--accent)]"
          : "border-border hover:border-border-hover"
      }`}
    >
      {/* Delete button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded-full bg-bg-deep/80 border border-border text-text-tertiary text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error-dim hover:text-error hover:border-error cursor-pointer"
          title={t("delete")}
        >
          &#x2715;
        </button>
      )}

      {/* Thumbnail */}
      <div className="h-[100px] relative bg-bg-elevated">
        {reference.status === "processing" || reference.status === "uploading" ? (
          <div className="w-full h-full animate-pulse bg-gradient-to-r from-bg-elevated via-bg-hover to-bg-elevated bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
        ) : reference.filePath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={reference.filePath}
            alt={reference.fileName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}
        <span
          className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wide ${
            statusClasses[reference.status] ?? ""
          }`}
        >
          {statusLabel[reference.status] ?? reference.status}
        </span>
      </div>

      {/* Info */}
      <div className="px-2.5 py-2 bg-bg-surface">
        <h5 className="text-[11px] font-medium mb-0.5 truncate">{reference.fileName}</h5>
        {reference.sourceUrl && (
          <span className="text-[10px] text-accent truncate block mb-0.5 emoji-text">
            &#x1F310; {(() => { try { return new URL(reference.sourceUrl.startsWith("http") ? reference.sourceUrl : `https://${reference.sourceUrl}`).hostname; } catch { return reference.sourceUrl; } })()}
          </span>
        )}
        <span className="text-[10px] text-text-tertiary">
          {reference.analysis
            ? t("colorsCount", { count: reference.analysis.colors.length })
            : reference.status === "processing"
            ? t("analyzing")
            : ""}
        </span>
      </div>
    </div>
  );
}
