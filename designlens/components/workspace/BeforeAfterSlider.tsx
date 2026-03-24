"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { ReviewIssue, Enhancement } from "@/lib/types";

interface BeforeAfterSliderProps {
  image: string;
  issues: ReviewIssue[];
  enhancements: Enhancement[];
  highlightedIndex: number | null;
}

export function BeforeAfterSlider({
  image,
  issues,
  enhancements,
  highlightedIndex,
}: BeforeAfterSliderProps) {
  const t = useTranslations("review");
  const [sliderPos, setSliderPos] = useState(50); // percentage
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const updateSlider = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const newPos = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(newPos);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      updateSlider(e.clientX);
    },
    [updateSlider]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      updateSlider(e.touches[0].clientX);
    },
    [updateSlider]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      updateSlider(e.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      updateSlider(e.touches[0].clientX);
    };
    const handleEnd = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [updateSlider]);

  const severityBorderColor = (s: ReviewIssue["severity"]) =>
    s === "high" ? "border-error" : s === "medium" ? "border-warning" : "border-accent";

  const severityBgColor = (s: ReviewIssue["severity"]) =>
    s === "high" ? "bg-error" : s === "medium" ? "bg-warning" : "bg-accent";

  return (
    <div
      ref={containerRef}
      className="relative inline-block select-none overflow-hidden rounded-lg"
      style={{ cursor: isDraggingRef.current ? "col-resize" : "default" }}
    >
      {/* Base image (always full — acts as "after" layer behind clip) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt="After"
        className="max-w-full block rounded-lg"
        draggable={false}
      />

      {/* After side: enhancement overlays (right of divider) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
      >
        {/* After label */}
        <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wider bg-bg-deep/80 text-success px-2 py-0.5 rounded pointer-events-none z-20">
          {t("enhanceAfter")}
        </span>

        {/* Enhancement bounding boxes */}
        {enhancements.map((enh, i) => {
          const isHighlighted = highlightedIndex === null || highlightedIndex === i;
          return (
            <div
              key={i}
              className={`absolute border-2 border-success rounded-sm transition-opacity ${
                isHighlighted ? "opacity-90" : "opacity-20"
              }`}
              style={{
                left: `${enh.bounds.x}%`,
                top: `${enh.bounds.y}%`,
                width: `${enh.bounds.width}%`,
                height: `${enh.bounds.height}%`,
              }}
            >
              {/* Value label */}
              <span className="absolute -top-5 left-0 text-[9px] px-1 rounded bg-success text-bg-deep whitespace-nowrap">
                {enh.after}
              </span>
            </div>
          );
        })}
      </div>

      {/* Before side: issue overlays (left of divider) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        {/* Tinted overlay to distinguish before side */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt="Before"
          className="absolute inset-0 w-full h-full object-cover rounded-lg"
          draggable={false}
        />

        {/* Before label */}
        <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wider bg-bg-deep/80 text-text-secondary px-2 py-0.5 rounded pointer-events-none z-20">
          {t("enhanceBefore")}
        </span>

        {/* Issue bounding boxes */}
        {issues.map((issue, i) => {
          const isHighlighted = highlightedIndex === null || highlightedIndex === i;
          return (
            <div
              key={i}
              className={`absolute border-2 rounded-sm transition-opacity ${severityBorderColor(issue.severity)} ${
                isHighlighted ? "opacity-80" : "opacity-20"
              }`}
              style={{
                left: `${issue.bounds.x}%`,
                top: `${issue.bounds.y}%`,
                width: `${issue.bounds.width}%`,
                height: `${issue.bounds.height}%`,
              }}
            >
              <span
                className={`absolute -top-5 left-0 text-[9px] px-1 rounded text-white ${severityBgColor(issue.severity)}`}
              >
                {i + 1}
              </span>
            </div>
          );
        })}
      </div>

      {/* Divider line */}
      <div
        className="absolute inset-y-0 w-px bg-white/60 pointer-events-none z-10"
        style={{ left: `${sliderPos}%` }}
      />

      {/* Drag handle */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        role="slider"
        aria-label="Before/After divider"
        aria-valuenow={Math.round(sliderPos)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setSliderPos((p) => Math.max(0, p - 2));
          if (e.key === "ArrowRight") setSliderPos((p) => Math.min(100, p + 2));
        }}
        style={{
          position: "absolute",
          left: `${sliderPos}%`,
          top: "50%",
          transform: "translateX(-50%) translateY(-50%)",
          cursor: "col-resize",
          width: 44,
          height: 44,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow-lg">
          <span className="emoji-text text-bg-deep text-[11px] select-none">&#x2194;</span>
        </div>
      </div>
    </div>
  );
}
