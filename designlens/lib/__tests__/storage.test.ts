import { describe, it, expect, beforeEach } from "vitest";
import {
  getProjects,
  saveProjects,
  getCachedAnalysis,
  setCachedAnalysis,
  saveProjectsSafe,
} from "../storage";
import type { Project, AnalysisResult } from "../types";

const mockProject: Project = {
  id: "p1",
  name: "Test Project",
  color: "#6366f1",
  references: [],
  createdAt: "2026-01-01T00:00:00Z",
};

const mockAnalysis: AnalysisResult = {
  id: "a1",
  imageHash: "abc123",
  fileName: "test.png",
  colors: [{ hex: "#000000", role: "background", percentage: 60 }],
  typography: [{ size: "16px", weight: 400, letterSpacing: "0px", role: "body" }],
  layout: { type: "single-column", spacing: {}, grid: "" },
  tokens: { colors: {}, spacing: {}, radius: {}, typography: [] },
  aiAvailable: false,
  createdAt: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  localStorage.clear();
});

describe("getProjects", () => {
  it("returns empty array when no data stored", () => {
    expect(getProjects()).toEqual([]);
  });

  it("returns stored projects", () => {
    localStorage.setItem("designlens_projects", JSON.stringify([mockProject]));
    const result = getProjects();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("p1");
  });
});

describe("saveProjects", () => {
  it("persists projects to localStorage", () => {
    saveProjects([mockProject]);
    const stored = JSON.parse(localStorage.getItem("designlens_projects")!);
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe("Test Project");
  });

  it("overwrites existing data", () => {
    saveProjects([mockProject]);
    const updated = { ...mockProject, name: "Updated" };
    saveProjects([updated]);
    const stored = JSON.parse(localStorage.getItem("designlens_projects")!);
    expect(stored[0].name).toBe("Updated");
  });
});

describe("getCachedAnalysis", () => {
  it("returns null when no cache exists", () => {
    expect(getCachedAnalysis("nonexistent")).toBeNull();
  });

  it("returns null for unknown hash", () => {
    localStorage.setItem("designlens_analysis_cache", JSON.stringify({}));
    expect(getCachedAnalysis("unknown")).toBeNull();
  });

  it("returns cached analysis by hash", () => {
    localStorage.setItem(
      "designlens_analysis_cache",
      JSON.stringify({ abc123: mockAnalysis })
    );
    const result = getCachedAnalysis("abc123");
    expect(result).not.toBeNull();
    expect(result!.fileName).toBe("test.png");
  });
});

describe("setCachedAnalysis", () => {
  it("stores analysis and returns true", () => {
    const result = setCachedAnalysis("abc123", mockAnalysis);
    expect(result).toBe(true);
    expect(getCachedAnalysis("abc123")).not.toBeNull();
  });

  it("adds to existing cache without overwriting", () => {
    setCachedAnalysis("hash1", mockAnalysis);
    const second = { ...mockAnalysis, id: "a2", imageHash: "hash2" };
    setCachedAnalysis("hash2", second);
    expect(getCachedAnalysis("hash1")).not.toBeNull();
    expect(getCachedAnalysis("hash2")).not.toBeNull();
  });
});

describe("saveProjectsSafe", () => {
  it("returns true on success", () => {
    expect(saveProjectsSafe([mockProject])).toBe(true);
  });

  it("persists data same as saveProjects", () => {
    saveProjectsSafe([mockProject]);
    expect(getProjects()).toHaveLength(1);
  });
});
