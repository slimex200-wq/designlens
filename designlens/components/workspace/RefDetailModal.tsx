"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import type { ReferenceImage } from "@/lib/types";

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.15;

interface RefDetailModalProps {
  reference: ReferenceImage;
  onClose: () => void;
}

export function RefDetailModal({ reference, onClose }: RefDetailModalProps) {
  const t = useTranslations("refDetail");
  const analysis = reference.analysis;

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Scroll wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom((prev) => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta));
      // Reset pan when zooming back to 1
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // Drag to pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }, [zoom, pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy });
  }, [dragging]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  // Double click to reset
  const handleDoubleClick = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const isZoomed = zoom > 1;
  const zoomPercent = Math.round(zoom * 100);

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
        {/* Left: Image with pinch zoom + drag */}
        <div
          ref={containerRef}
          className="flex-1 bg-bg-deep flex items-center justify-center min-w-0 p-4 relative overflow-hidden select-none"
          style={{ cursor: isZoomed ? (dragging ? "grabbing" : "grab") : "zoom-in" }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={reference.filePath}
            alt={reference.fileName}
            className="max-w-full max-h-[75vh] object-contain rounded-lg pointer-events-none"
            draggable={false}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: dragging ? "none" : "transform 0.15s ease-out",
            }}
          />

          {/* Zoom indicator */}
          {isZoomed && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 text-[11px] text-white/80 pointer-events-none">
              <span>{zoomPercent}%</span>
              <span className="text-white/40">|</span>
              <span className="text-white/50">{t("doubleClickReset")}</span>
            </div>
          )}

          {/* Zoom hint when not zoomed */}
          {!isZoomed && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-[10px] text-white/50 pointer-events-none">
              {t("scrollToZoom")}
            </div>
          )}
        </div>

        {/* Right: Analysis panel */}
        <div className="w-[300px] flex-shrink-0 border-l border-border p-5 overflow-y-auto flex flex-col gap-4">
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
  );
}
