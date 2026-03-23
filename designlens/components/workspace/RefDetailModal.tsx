"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import type { ReferenceImage } from "@/lib/types";

const ZOOM_FACTOR = 2.5;

interface RefDetailModalProps {
  reference: ReferenceImage;
  onClose: () => void;
}

export function RefDetailModal({ reference, onClose }: RefDetailModalProps) {
  const t = useTranslations("refDetail");
  const analysis = reference.analysis;
  const [hovering, setHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  const handleImgLoad = useCallback(() => {
    if (imgRef.current) {
      setImgNatural({ w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight });
    }
  }, []);

  // Zoom preview dimensions — match the right panel height
  const previewSize = 300;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative flex bg-bg-surface border border-border rounded-xl overflow-hidden max-w-[1100px] w-full max-h-[85vh] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Image */}
        <div className="flex-1 bg-bg-deep flex items-center justify-center min-w-0 p-4 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={reference.filePath}
            alt={reference.fileName}
            className="max-w-full max-h-[75vh] object-contain rounded-lg cursor-crosshair"
            draggable={false}
            onLoad={handleImgLoad}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onMouseMove={handleMouseMove}
          />

          {/* Crosshair indicator on image */}
          {hovering && imgRef.current && (() => {
            const rect = imgRef.current.getBoundingClientRect();
            const parentRect = imgRef.current.parentElement?.getBoundingClientRect();
            if (!parentRect) return null;
            const offsetX = rect.left - parentRect.left + mousePos.x * rect.width;
            const offsetY = rect.top - parentRect.top + mousePos.y * rect.height;
            return (
              <div
                className="absolute w-24 h-24 border-2 border-accent/60 rounded-sm pointer-events-none z-10"
                style={{
                  left: offsetX - 48,
                  top: offsetY - 48,
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.15)",
                }}
              />
            );
          })()}
        </div>

        {/* Right: Analysis panel + zoom preview */}
        <div className="w-[300px] flex-shrink-0 border-l border-border flex flex-col overflow-hidden">
          {/* Zoom preview area */}
          {hovering && imgNatural.w > 0 ? (
            <div className="flex-shrink-0 border-b border-border bg-bg-deep overflow-hidden" style={{ height: previewSize }}>
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url(${reference.filePath})`,
                  backgroundSize: `${imgNatural.w * ZOOM_FACTOR}px ${imgNatural.h * ZOOM_FACTOR}px`,
                  backgroundPosition: `${-mousePos.x * imgNatural.w * ZOOM_FACTOR + previewSize / 2}px ${-mousePos.y * imgNatural.h * ZOOM_FACTOR + previewSize / 2}px`,
                  backgroundRepeat: "no-repeat",
                }}
              />
            </div>
          ) : (
            <div className="flex-shrink-0 border-b border-border bg-bg-deep flex items-center justify-center text-[10px] text-text-tertiary" style={{ height: 60 }}>
              {t("hoverToZoom")}
            </div>
          )}

          {/* Analysis details (scrollable) */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-[14px] font-semibold text-text-primary leading-tight">
                  {reference.fileName}
                </h3>
                <p className="text-[10px] text-text-tertiary mt-0.5">
                  {reference.uploadedAt
                    ? new Date(reference.uploadedAt).toLocaleDateString()
                    : ""}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-6 h-6 rounded-md bg-bg-elevated border border-border flex items-center justify-center text-[11px] text-text-tertiary hover:text-text-primary hover:border-border-hover transition-all cursor-pointer flex-shrink-0"
              >
                &#x2715;
              </button>
            </div>

            {!analysis && (
              <p className="text-[11px] text-text-tertiary leading-relaxed">
                {t("noAnalysis")}
              </p>
            )}

            {/* Colors */}
            {analysis && analysis.colors.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold">
                  {t("colors")}
                </span>
                <div className="flex gap-1 h-6 rounded-lg overflow-hidden">
                  {analysis.colors.map((c, i) => (
                    <div
                      key={i}
                      className="flex-1 transition-all hover:flex-[2] cursor-pointer relative group/c"
                      style={{ backgroundColor: c.hex }}
                      title={`${c.hex} — ${c.role}`}
                    >
                      <span className="absolute bottom-0 left-0 right-0 text-center text-[7px] text-white opacity-0 group-hover/c:opacity-100 transition-opacity bg-black/50 py-px">
                        {c.hex}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-1">
                  {analysis.colors.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm border border-border flex-shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="text-[11px] text-text-secondary font-mono">
                        {c.hex}
                      </span>
                      <span className="text-[10px] text-text-tertiary ml-auto">
                        {c.role} · {c.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Typography */}
            {analysis && analysis.typography.length > 0 && (
              <>
                <div className="h-px bg-border" />
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold">
                    {t("typography")}
                  </span>
                  {analysis.typography.map((ty, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-[11px]"
                    >
                      <span className="text-text-secondary">
                        {ty.size} / {ty.weight}
                      </span>
                      <span className="text-[10px] text-text-tertiary">
                        {ty.role}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Layout */}
            {analysis && analysis.layout.type !== "unknown" && (
              <>
                <div className="h-px bg-border" />
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold">
                    {t("layout")}
                  </span>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    {analysis.layout.type}
                  </p>
                  {analysis.layout.grid && (
                    <p className="text-[10px] text-text-tertiary leading-relaxed">
                      {analysis.layout.grid}
                    </p>
                  )}
                  {Object.keys(analysis.layout.spacing).length > 0 && (
                    <div className="flex flex-col gap-1 mt-1">
                      {Object.entries(analysis.layout.spacing).map(([k, v]) => (
                        <div
                          key={k}
                          className="flex justify-between text-[10px]"
                        >
                          <span className="text-text-tertiary">{k}</span>
                          <span className="text-text-secondary font-mono">
                            {v}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Tokens summary */}
            {analysis && Object.keys(analysis.tokens.colors).length > 0 && (
              <>
                <div className="h-px bg-border" />
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-[1.2px] text-text-tertiary font-semibold">
                    {t("tokens")}
                  </span>
                  <div className="flex flex-col gap-1">
                    {Object.entries(analysis.tokens.colors)
                      .slice(0, 8)
                      .map(([name, hex]) => (
                        <div
                          key={name}
                          className="flex items-center gap-2 text-[10px]"
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-sm border border-border flex-shrink-0"
                            style={{ backgroundColor: hex }}
                          />
                          <span className="text-text-tertiary font-mono truncate">
                            {name}
                          </span>
                          <span className="text-text-secondary font-mono ml-auto">
                            {hex}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
