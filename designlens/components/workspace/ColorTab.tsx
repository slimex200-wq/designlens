"use client";

import type { ColorInfo } from "@/lib/types";

interface ColorTabProps {
  colors: ColorInfo[];
}

export function ColorTab({ colors }: ColorTabProps) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[1px] text-text-tertiary mb-2.5 font-semibold">
        Dominant Colors
      </div>
      <div className="flex flex-col gap-1.5">
        {colors.map((color, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-bg-hover transition-colors"
          >
            <div
              className="w-7 h-7 rounded-md border border-white/[0.06] flex-shrink-0"
              style={{ background: color.hex }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-mono font-medium text-text-primary">
                {color.hex.toUpperCase()}
              </div>
              <div className="text-[10px] text-text-tertiary capitalize">{color.role}</div>
            </div>
            <span className="text-[11px] text-text-tertiary font-mono">{color.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
