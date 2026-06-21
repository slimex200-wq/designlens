import { describe, it, expect } from "vitest";
import {
  SAMPLE_ID,
  nextProjectColor,
  genProjectId,
  makeProject,
  renameInProjects,
  removeFromProjects,
  resolveActiveAfterDelete,
  PROJECT_COLORS,
  genReferenceId,
  withFreshReferenceIds,
} from "../projects";
import type { Project } from "../types";

function p(id: string, name = id): Project {
  return { id, name, color: "#fff", references: [], createdAt: "2026-01-01" };
}

describe("nextProjectColor", () => {
  it("cycles through the palette", () => {
    expect(nextProjectColor(0)).toBe(PROJECT_COLORS[0]);
    expect(nextProjectColor(PROJECT_COLORS.length)).toBe(PROJECT_COLORS[0]);
    expect(nextProjectColor(1)).toBe(PROJECT_COLORS[1]);
  });
});

describe("genProjectId", () => {
  it("produces unique prefixed ids", () => {
    const a = genProjectId();
    const b = genProjectId();
    expect(a).toMatch(/^proj_/);
    expect(a).not.toBe(b);
  });
});

describe("makeProject", () => {
  it("builds a project with trimmed name and empty references", () => {
    const proj = makeProject("  Brand  ", "#abc", "id1", "2026-01-01");
    expect(proj).toEqual({ id: "id1", name: "Brand", color: "#abc", references: [], createdAt: "2026-01-01" });
  });
  it("falls back to 'New Project' for blank names", () => {
    expect(makeProject("   ", "#abc", "id1", "2026-01-01").name).toBe("New Project");
  });
});

describe("renameInProjects", () => {
  const projects = [p(SAMPLE_ID, "Sample"), p("a", "Alpha")];
  it("renames a normal project", () => {
    const out = renameInProjects(projects, "a", "  Beta ");
    expect(out.find((x) => x.id === "a")!.name).toBe("Beta");
  });
  it("locks the sample project", () => {
    expect(renameInProjects(projects, SAMPLE_ID, "Hacked")).toBe(projects);
  });
  it("ignores blank names (returns same array)", () => {
    expect(renameInProjects(projects, "a", "   ")).toBe(projects);
  });
});

describe("removeFromProjects", () => {
  const projects = [p(SAMPLE_ID), p("a"), p("b")];
  it("removes a normal project", () => {
    expect(removeFromProjects(projects, "a").map((x) => x.id)).toEqual([SAMPLE_ID, "b"]);
  });
  it("never removes the sample project", () => {
    expect(removeFromProjects(projects, SAMPLE_ID)).toBe(projects);
  });
});

describe("resolveActiveAfterDelete", () => {
  const remaining = [p(SAMPLE_ID), p("b")];
  it("keeps the current active when it was not deleted", () => {
    expect(resolveActiveAfterDelete(remaining, "a", "b")).toBe("b");
  });
  it("switches to the first remaining when active was deleted", () => {
    expect(resolveActiveAfterDelete(remaining, "a", "a")).toBe(SAMPLE_ID);
  });
  it("falls back to sample when nothing remains", () => {
    expect(resolveActiveAfterDelete([], "a", "a")).toBe(SAMPLE_ID);
  });
});

describe("genReferenceId", () => {
  it("produces unique prefixed ids", () => {
    expect(genReferenceId()).toMatch(/^ref_/);
    expect(genReferenceId()).not.toBe(genReferenceId());
  });
});

describe("withFreshReferenceIds", () => {
  it("re-keys every reference so an import never shares ids with the source", () => {
    const source: Project = {
      id: "src",
      name: "Src",
      color: "#fff",
      createdAt: "2026-01-01",
      references: [
        { id: "r1", fileName: "a.png", filePath: "", status: "analyzed", uploadedAt: "2026-01-01" },
        { id: "r2", fileName: "b.png", filePath: "", status: "analyzed", uploadedAt: "2026-01-01" },
      ],
    };
    const out = withFreshReferenceIds(source);
    const outIds = out.references.map((r) => r.id);
    // none of the new ids match the source ids
    expect(outIds.some((id) => id === "r1" || id === "r2")).toBe(false);
    // ids are unique
    expect(new Set(outIds).size).toBe(2);
    // other fields preserved
    expect(out.references[0].fileName).toBe("a.png");
    expect(out.name).toBe("Src");
  });
});
