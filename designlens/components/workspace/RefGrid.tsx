"use client";

import { useTranslations } from "next-intl";
import type { ReferenceImage } from "@/lib/types";
import { UploadZone } from "./UploadZone";
import { RefCard } from "./RefCard";

interface RefGridProps {
  references: ReferenceImage[];
  selectedRefId: string | null;
  onSelectRef: (id: string) => void;
  onFiles: (files: File[]) => void;
}

export function RefGrid({ references, selectedRefId, onSelectRef, onFiles }: RefGridProps) {
  const t = useTranslations("refGrid");
  const tc = useTranslations("common");

  return (
    <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
        <span className="text-[11px] text-text-tertiary">{tc("files", { count: references.length })}</span>
      </div>

      {/* Upload zone */}
      <UploadZone onFiles={onFiles} />

      {/* Grid */}
      {references.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {references.map((ref) => (
            <RefCard
              key={ref.id}
              reference={ref}
              selected={selectedRefId === ref.id}
              onClick={() => onSelectRef(ref.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
