"use client";

import { useState, useCallback } from "react";
import type { TokenSet } from "@/lib/types";
import { exportTokens } from "@/lib/tokens";

interface TokenTabProps {
  tokens: TokenSet;
}

type ExportFormat = "css" | "tailwind" | "json";

export function TokenTab({ tokens }: TokenTabProps) {
  const [format, setFormat] = useState<ExportFormat>("css");
  const [copied, setCopied] = useState(false);

  const handleExport = useCallback(() => {
    const output = exportTokens(tokens, format);
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [tokens, format]);

  const groups: { title: string; entries: [string, string][] }[] = [
    { title: "Colors", entries: Object.entries(tokens.colors) },
    { title: "Spacing", entries: Object.entries(tokens.spacing) },
    { title: "Radius", entries: Object.entries(tokens.radius) },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <div className="text-[10px] uppercase tracking-[1px] text-text-tertiary mb-2.5 font-semibold">
          Generated Tokens
        </div>
        {groups.map((group) => (
          <div key={group.title} className="mb-3">
            <div className="text-[10px] text-text-tertiary mb-1.5 font-medium">
              {group.title}
            </div>
            {group.entries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center font-mono text-[11px] px-2 py-1 rounded hover:bg-bg-hover transition-colors mb-0.5"
              >
                <span className="text-accent-text">{key}</span>
                <span className="text-text-tertiary mx-1">:</span>
                <span className="text-text-secondary">{value}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Export section */}
      <div className="pt-4 mt-auto border-t border-border">
        <div className="flex gap-1.5 mb-2">
          {(["css", "tailwind", "json"] as ExportFormat[]).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`flex-1 py-1.5 text-center text-[10px] rounded border font-medium transition-all ${
                format === f
                  ? "border-accent-border text-accent bg-accent-dim"
                  : "border-border text-text-tertiary bg-bg-deep hover:border-border-hover hover:text-text-secondary"
              }`}
            >
              {f === "css" ? "CSS" : f === "tailwind" ? "Tailwind" : "JSON"}
            </button>
          ))}
        </div>
        <button
          onClick={handleExport}
          className="w-full py-2.5 rounded-lg bg-text-primary text-bg-deep text-[13px] font-semibold border-none cursor-pointer hover:opacity-85 transition-opacity tracking-tight"
        >
          {copied ? "Copied!" : "Export Tokens"}
        </button>
      </div>
    </div>
  );
}
