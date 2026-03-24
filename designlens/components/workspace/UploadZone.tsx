"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface UploadZoneProps {
  onFiles: (files: File[]) => void;
}

export function UploadZone({ onFiles }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
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

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border border-dashed rounded-[10px] p-4 md:p-7 text-center transition-all cursor-pointer min-h-[44px] ${
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
  );
}
