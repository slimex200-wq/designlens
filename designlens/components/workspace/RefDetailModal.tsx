"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/Toast";
import type { ReferenceImage } from "@/lib/types";
import { Pipette, X } from "lucide-react";

const ZOOM_SCALE = 2.5;

function toHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

interface RefDetailModalProps {
  reference: ReferenceImage;
  onClose: () => void;
}

export function RefDetailModal({ reference, onClose }: RefDetailModalProps) {
  const t = useTranslations("refDetail");
  const { showToast } = useToast();
  const analysis = reference.analysis;

  const [hovering, setHovering] = useState(false);
  const [pickEnabled, setPickEnabled] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const swatchRef = useRef<HTMLDivElement>(null);
  const hexLabelRef = useRef<HTMLSpanElement>(null);
  const baseRectRef = useRef<DOMRect | null>(null);
  const lastHexRef = useRef<string | null>(null);
  const rafRef = useRef<number>(0);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll + cleanup any pending rAF
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Draw the image to an offscreen canvas for pixel sampling. Cross-origin
  // images taint the canvas (getImageData throws) -> picker disabled gracefully.
  const prepareCanvas = useCallback(() => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      ctx.getImageData(0, 0, 1, 1); // taint probe
      canvasRef.current = canvas;
      setPickEnabled(true);
    } catch {
      canvasRef.current = null;
      setPickEnabled(false);
    }
  }, []);

  const samplePixel = useCallback((clientX: number, clientY: number) => {
    const base = baseRectRef.current;
    const canvas = canvasRef.current;
    const swatch = swatchRef.current;
    if (!base || !canvas || !swatch) return;

    const fx = (clientX - base.left) / base.width;
    const fy = (clientY - base.top) / base.height;
    if (fx < 0 || fx > 1 || fy < 0 || fy > 1) {
      swatch.style.opacity = "0";
      return;
    }

    const px = Math.min(canvas.width - 1, Math.max(0, Math.round(fx * canvas.width)));
    const py = Math.min(canvas.height - 1, Math.max(0, Math.round(fy * canvas.height)));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const [r, g, b] = ctx.getImageData(px, py, 1, 1).data;
    const hex = toHex(r, g, b);
    lastHexRef.current = hex;

    // Update the floating swatch directly (no React re-render).
    swatch.style.opacity = "1";
    swatch.style.left = `${clientX + 16}px`;
    swatch.style.top = `${clientY + 16}px`;
    swatch.style.setProperty("--pick", hex);
    if (hexLabelRef.current) hexLabelRef.current.textContent = hex;
  }, []);

  const handleMouseEnter = useCallback(() => {
    const img = imgRef.current;
    if (img) baseRectRef.current = img.getBoundingClientRect(); // unscaled rect
    if (!canvasRef.current) prepareCanvas();
    setHovering(true);
  }, [prepareCanvas]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      const img = imgRef.current;
      const base = baseRectRef.current;
      if (!img || !base) return;
      const fx = (e.clientX - base.left) / base.width;
      const fy = (e.clientY - base.top) / base.height;
      img.style.transformOrigin = `${Math.min(100, Math.max(0, fx * 100))}% ${Math.min(100, Math.max(0, fy * 100))}%`;
      if (!pickEnabled) return;
      const { clientX, clientY } = e;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => samplePixel(clientX, clientY));
    },
    [pickEnabled, samplePixel]
  );

  const handleMouseLeave = useCallback(() => {
    setHovering(false);
    if (swatchRef.current) swatchRef.current.style.opacity = "0";
    if (imgRef.current) imgRef.current.style.transformOrigin = "center center";
  }, []);

  const handleClick = useCallback(async () => {
    const hex = lastHexRef.current;
    if (!pickEnabled || !hex) return;
    try {
      await navigator.clipboard.writeText(hex);
      showToast("success", `${hex} ${t("copied")}`);
    } catch {
      showToast("error", t("copyFailed"));
    }
  }, [pickEnabled, showToast, t]);

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
        {/* Left: image with hover zoom + eyedropper */}
        <div className="flex-1 bg-bg-deep overflow-hidden min-w-0 flex items-center justify-center p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={reference.filePath}
            alt={reference.fileName}
            className={`max-w-full max-h-[75vh] object-contain rounded-lg ${pickEnabled ? "cursor-crosshair" : "cursor-zoom-in"}`}
            onLoad={prepareCanvas}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            style={{
              transform: hovering ? `scale(${ZOOM_SCALE})` : "scale(1)",
              transition: "transform 0.2s ease-out",
              willChange: "transform",
            }}
            draggable={false}
          />
        </div>

        {/* Right: analysis panel */}
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
              <X size={13} strokeWidth={2} />
            </button>
          </div>

          {/* Eyedropper hint */}
          {pickEnabled && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-accent-dim border border-accent-border">
              <Pipette size={13} strokeWidth={2} className="text-accent" />
              <span className="text-[10px] text-accent leading-tight">
                {t("colorPicker")} — {t("clickToCopy")}
              </span>
            </div>
          )}

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

      {/* Floating eyedropper swatch (positioned via DOM, fixed to cursor) */}
      <div
        ref={swatchRef}
        className="pointer-events-none fixed z-[60] flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-elevated border border-border shadow-lg opacity-0 transition-opacity"
        style={{ left: 0, top: 0 }}
      >
        <span
          className="w-4 h-4 rounded-sm border border-border"
          style={{ background: "var(--pick, transparent)" }}
        />
        <span ref={hexLabelRef} className="text-[10px] font-mono text-text-primary">#000000</span>
      </div>
    </div>
  );
}
