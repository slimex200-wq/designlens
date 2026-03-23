"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import type { ReferenceImage } from "@/lib/types";

const ZOOM_SCALE = 2.5;

interface RefDetailModalProps {
  reference: ReferenceImage;
  onClose: () => void;
}

export function RefDetailModal({ reference, onClose }: RefDetailModalProps) {
  const t = useTranslations("refDetail");
  const analysis = reference.analysis;

  const [hovering, setHovering] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  // Color picker state
  const [pickerActive, setPickerActive] = useState(false);
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

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

  // Draw image to hidden canvas for color picker
  const initCanvas = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !img.naturalWidth) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    ctxRef.current = ctx;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x, y });

    // Color picker sampling
    if (pickerActive && ctxRef.current && canvasRef.current) {
      const px = Math.floor((x / 100) * canvasRef.current.width);
      const py = Math.floor((y / 100) * canvasRef.current.height);
      const pixel = ctxRef.current.getImageData(px, py, 1, 1).data;
      const hex = `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1].toString(16).padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`.toUpperCase();
      setPickedColor(hex);
      setCursorPos({ x: e.clientX, y: e.clientY });
    }
  }, [pickerActive]);

  const handleColorClick = useCallback((e: React.MouseEvent) => {
    if (!pickerActive || !pickedColor) return;
    e.stopPropagation();
    navigator.clipboard.writeText(pickedColor).then(() => {
      setCopiedHex(pickedColor);
      setTimeout(() => setCopiedHex(null), 1500);
    });
  }, [pickerActive, pickedColor]);

  const isLight = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Hidden canvas for color picker */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Modal */}
      <div
        className="relative flex bg-bg-surface border border-border rounded-xl overflow-hidden max-w-[1100px] w-full max-h-[85vh] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Image with hover zoom (Talbots-style) */}
        <div className="flex-1 bg-bg-deep flex flex-col min-w-0 overflow-hidden">
          {/* Image toolbar */}
          <div className="h-9 flex items-center px-3 gap-2 border-b border-border flex-shrink-0">
            <button
              onClick={() => {
                const next = !pickerActive;
                setPickerActive(next);
                if (next) initCanvas();
                if (!next) setPickedColor(null);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                pickerActive
                  ? "bg-accent-dim text-accent border border-accent-border"
                  : "bg-bg-elevated text-text-secondary border border-border hover:border-border-hover"
              }`}
            >
              &#x1F3A8; {t("colorPicker")}
            </button>
            {pickedColor && (
              <div className="flex items-center gap-1.5 ml-2">
                <div
                  className="w-5 h-5 rounded border border-border flex-shrink-0"
                  style={{ backgroundColor: pickedColor }}
                />
                <span className="text-[12px] font-mono text-text-primary">{pickedColor}</span>
                {copiedHex === pickedColor && (
                  <span className="text-[10px] text-success">{t("copied")}</span>
                )}
              </div>
            )}
          </div>

          {/* Image area — hover to zoom in place */}
          <div
            className="flex-1 overflow-hidden cursor-crosshair"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onMouseMove={handleMouseMove}
            onClick={handleColorClick}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={reference.filePath}
              alt={reference.fileName}
              className="w-full h-full object-contain transition-transform duration-200 ease-out"
              style={
                hovering
                  ? {
                      transform: `scale(${ZOOM_SCALE})`,
                      transformOrigin: `${origin.x}% ${origin.y}%`,
                    }
                  : {
                      transform: "scale(1)",
                      transformOrigin: "center center",
                    }
              }
              draggable={false}
              onLoad={initCanvas}
            />
          </div>

          {/* Floating color tooltip */}
          {pickerActive && pickedColor && hovering && (
            <div
              className="fixed z-[60] pointer-events-none flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shadow-lg border"
              style={{
                left: cursorPos.x + 16,
                top: cursorPos.y - 40,
                backgroundColor: pickedColor,
                borderColor: isLight(pickedColor) ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)",
                color: isLight(pickedColor) ? "#000" : "#fff",
              }}
            >
              <span className="text-[11px] font-mono font-medium">{pickedColor}</span>
              <span className="text-[9px] opacity-60">{t("clickToCopy")}</span>
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
                    <span className="text-[11px] text-text-secondary font-mono">{c.hex}</span>
                    <span className="text-[10px] text-text-tertiary ml-auto">{c.role} · {c.percentage}%</span>
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
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className="text-text-secondary">{ty.size} / {ty.weight}</span>
                    <span className="text-[10px] text-text-tertiary">{ty.role}</span>
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
                <p className="text-[11px] text-text-secondary leading-relaxed">{analysis.layout.type}</p>
                {analysis.layout.grid && (
                  <p className="text-[10px] text-text-tertiary leading-relaxed">{analysis.layout.grid}</p>
                )}
                {Object.keys(analysis.layout.spacing).length > 0 && (
                  <div className="flex flex-col gap-1 mt-1">
                    {Object.entries(analysis.layout.spacing).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-[10px]">
                        <span className="text-text-tertiary">{k}</span>
                        <span className="text-text-secondary font-mono">{v}</span>
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
                      <div key={name} className="flex items-center gap-2 text-[10px]">
                        <div
                          className="w-2.5 h-2.5 rounded-sm border border-border flex-shrink-0"
                          style={{ backgroundColor: hex }}
                        />
                        <span className="text-text-tertiary font-mono truncate">{name}</span>
                        <span className="text-text-secondary font-mono ml-auto">{hex}</span>
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
