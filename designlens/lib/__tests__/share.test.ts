import { describe, it, expect } from "vitest";
import { buildShareSummary, hasShareableData } from "../share";
import type { Project, ReferenceImage, AnalysisResult } from "../types";

function analysis(over: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    id: "a1",
    imageHash: "h",
    fileName: "f.png",
    colors: [
      { hex: "#0a0a0a", role: "background", percentage: 50 },
      { hex: "#ffffff", role: "text-primary", percentage: 20 },
    ],
    typography: [
      { role: "hero", size: "48px", weight: 700, letterSpacing: "-1px" },
      { role: "body", size: "14px", weight: 400, letterSpacing: "0px" },
    ],
    layout: { type: "Single-Column Centered", spacing: {}, grid: "" },
    tokens: { colors: {}, spacing: {}, radius: {}, typography: [] },
    aiAvailable: true,
    createdAt: "2026-01-01",
    ...over,
  };
}

function ref(over: Partial<ReferenceImage> = {}): ReferenceImage {
  return {
    id: "r1",
    fileName: "f.png",
    filePath: "",
    status: "analyzed",
    analysis: analysis(),
    uploadedAt: "2026-01-01",
    ...over,
  };
}

function project(refs: ReferenceImage[]): Project {
  return { id: "p", name: "My System", color: "#fff", references: refs, createdAt: "2026-01-01" };
}

describe("hasShareableData", () => {
  it("is false for null/empty/unanalyzed projects", () => {
    expect(hasShareableData(null)).toBe(false);
    expect(hasShareableData(project([]))).toBe(false);
    expect(hasShareableData(project([ref({ status: "processing", analysis: undefined })]))).toBe(false);
  });

  it("is true when at least one reference is analyzed", () => {
    expect(hasShareableData(project([ref()]))).toBe(true);
  });
});

describe("buildShareSummary", () => {
  it("includes project name, analyzed count, colors, typography, and layout", () => {
    const out = buildShareSummary(project([ref()]));
    expect(out).toContain("# My System — Design System");
    expect(out).toContain("1 reference analyzed");
    expect(out).toContain("## Colors");
    expect(out).toContain("#0A0A0A — background");
    expect(out).toContain("## Typography");
    expect(out).toContain("hero — 48px / weight 700");
    expect(out).toContain("## Layout Patterns");
    expect(out).toContain("Single-Column Centered (1)");
    expect(out).toContain("— Generated with DesignLens");
  });

  it("pluralizes and dedupes colors across references", () => {
    const out = buildShareSummary(project([ref({ id: "r1" }), ref({ id: "r2" })]));
    expect(out).toContain("2 references analyzed");
    // #0A0A0A appears in both refs but only once in output
    expect(out.match(/#0A0A0A/g)?.length).toBe(1);
    // Both refs share one layout type → counted as 2
    expect(out).toContain("Single-Column Centered (2)");
  });

  it("ignores unanalyzed references", () => {
    const out = buildShareSummary(
      project([ref(), ref({ id: "r2", status: "error", analysis: undefined })])
    );
    expect(out).toContain("1 reference analyzed");
  });
});
