"use client";

import type { LayoutInfo } from "@/lib/types";

interface LayoutTabProps {
  layout: LayoutInfo;
}

export function LayoutTab({ layout }: LayoutTabProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Layout type */}
      <div>
        <div className="text-[10px] uppercase tracking-[1px] text-text-tertiary mb-2.5 font-semibold">
          Layout Type
        </div>
        <div className="bg-bg-deep border border-border rounded-lg p-3.5">
          <div className="text-sm font-medium capitalize">{layout.type}</div>
          {layout.grid && (
            <div className="text-[11px] text-text-tertiary mt-1">{layout.grid}</div>
          )}
        </div>
      </div>

      {/* Spacing */}
      <div>
        <div className="text-[10px] uppercase tracking-[1px] text-text-tertiary mb-2.5 font-semibold">
          Spacing Values
        </div>
        <div className="flex flex-col gap-1">
          {Object.entries(layout.spacing).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center font-mono text-[11px] px-2 py-1 rounded hover:bg-bg-hover transition-colors"
            >
              <span className="text-accent-text capitalize">{key}</span>
              <span className="text-text-tertiary mx-1">:</span>
              <span className="text-text-secondary">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
