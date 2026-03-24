"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface UploadZoneProps {
  onFiles: (files: File[]) => void;
  onUrl?: (url: string) => void;
  urlLoading?: boolean;
}

export function UploadZone({ onFiles, onUrl, urlLoading }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [urlError, setUrlError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("uploadZone");

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) onFiles(files);
    },
    [onFiles]
  );

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) onFiles(files);
    e.target.value = "";
  };

  const handleUrlSubmit = () => {
    if (!onUrl) return;
    const trimmed = urlValue.trim();
    if (!trimmed) return;

    try {
      new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      setUrlError("");
      onUrl(trimmed);
      setUrlValue("");
    } catch {
      setUrlError(t("urlInvalid"));
    }
  };

  return (
    <div className="flex flex-col gap-0">
      {/* Image upload area */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border border-dashed rounded-t-[10px] p-4 md:p-7 text-center transition-all cursor-pointer min-h-[44px] ${
          isDragging
            ? "border-border-hover bg-accent-dim"
            : "border-border hover:border-border-hover hover:bg-accent-dim"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={handleChange}
        />
        <div className="text-xl text-text-tertiary mb-2">+</div>
        <h4 className="text-[13px] font-medium mb-1">{t("dropHere")}</h4>
        <p className="text-[11px] text-text-tertiary">{t("formats")}</p>
      </div>

      {/* URL input area */}
      {onUrl && (
        <div className="border border-dashed border-t-0 rounded-b-[10px] border-border p-3 md:p-4">
          <div className="text-[10px] text-text-tertiary text-center mb-2 uppercase tracking-wider font-medium">
            {t("urlOr")}
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={urlValue}
              onChange={(e) => {
                setUrlValue(e.target.value);
                setUrlError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUrlSubmit();
              }}
              placeholder={t("urlPlaceholder")}
              disabled={urlLoading}
              className="flex-1 bg-bg-elevated border border-border rounded-md px-3 text-[12px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent min-h-[44px] disabled:opacity-50"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUrlSubmit();
              }}
              disabled={urlLoading || !urlValue.trim()}
              className="px-4 rounded-md text-xs bg-accent-dim text-accent border border-accent-border font-medium hover:opacity-85 transition-opacity cursor-pointer min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {urlLoading && (
                <div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
              )}
              {urlLoading ? t("urlAnalyzing") : t("urlSubmit")}
            </button>
          </div>
          {urlError && (
            <p className="text-[10px] text-error mt-1.5">{urlError}</p>
          )}
        </div>
      )}
    </div>
  );
}
