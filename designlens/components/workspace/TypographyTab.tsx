"use client";

import type { TypographyInfo } from "@/lib/types";

interface TypographyTabProps {
  typography: TypographyInfo[];
}

const PREVIEW_TEXT: Record<string, string> = {
  heading: "Heading text",
  body: "Body paragraph text with normal weight",
  label: "LABEL TEXT",
  caption: "Caption text",
};

export function TypographyTab({ typography }: TypographyTabProps) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[1px] text-text-tertiary mb-2.5 font-semibold">
        Typography
      </div>
      <div className="flex flex-col gap-1.5">
        {typography.map((typo, i) => (
          <div
            key={i}
            className="bg-bg-deep border border-border rounded-lg p-3.5"
          >
            {/* Preview */}
            <div className="mb-2 pb-2 border-b border-border">
              <span
                style={{
                  fontSize: typo.size,
                  fontWeight: typo.weight,
                  letterSpacing: typo.letterSpacing,
                  ...(typo.role === "label"
                    ? { textTransform: "uppercase" as const, color: "var(--text-tertiary)" }
                    : typo.role === "body"
                    ? { color: "var(--text-secondary)" }
                    : {}),
                }}
              >
                {PREVIEW_TEXT[typo.role] ?? "Sample text"}
              </span>
            </div>
            {/* Meta */}
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-text-tertiary font-mono">
                Inter / {typo.weight} / {typo.size} / {typo.letterSpacing}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-dim text-accent-text font-medium capitalize">
                {typo.role}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
