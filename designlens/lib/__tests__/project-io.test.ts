import { describe, it, expect } from "vitest";
import {
  serializeProject,
  parseProjectFile,
  projectFileName,
  ProjectParseError,
  PROJECT_FILE_VERSION,
} from "../project-io";
import type { Project } from "../types";

function sampleProject(): Project {
  return {
    id: "p1",
    name: "Brand System",
    color: "#93C5FD",
    references: [
      {
        id: "r1",
        fileName: "hero.png",
        filePath: "data:image/png;base64,AAAA",
        status: "analyzed",
        uploadedAt: "2026-01-01",
        analysis: {
          id: "a1",
          imageHash: "h",
          fileName: "hero.png",
          colors: [{ hex: "#000", role: "background", percentage: 50 }],
          typography: [],
          layout: { type: "single-column", spacing: {}, grid: "" },
          tokens: { colors: {}, spacing: {}, radius: {}, typography: [] },
          aiAvailable: true,
          createdAt: "2026-01-01",
        },
      },
    ],
    createdAt: "2026-01-01",
  };
}

describe("serializeProject", () => {
  it("wraps the project with kind/version/exportedAt and strips data-URL images", () => {
    const json = serializeProject(sampleProject());
    const obj = JSON.parse(json);
    expect(obj.kind).toBe("designlens-project");
    expect(obj.version).toBe(PROJECT_FILE_VERSION);
    expect(typeof obj.exportedAt).toBe("string");
    expect(obj.project.references[0].filePath).toBe(""); // data: URL stripped
    expect(obj.project.references[0].analysis.colors[0].hex).toBe("#000"); // analysis preserved
  });
});

describe("parseProjectFile", () => {
  it("round-trips a serialized project", () => {
    const parsed = parseProjectFile(serializeProject(sampleProject()));
    expect(parsed.name).toBe("Brand System");
    expect(parsed.references).toHaveLength(1);
    expect(parsed.references[0].analysis?.colors[0].role).toBe("background");
  });

  it("does not break when image filePath is missing", () => {
    const proj = sampleProject();
    proj.references[0].filePath = "";
    const parsed = parseProjectFile(serializeProject(proj));
    expect(parsed.references[0].filePath).toBe("");
  });

  it("drops malformed references instead of throwing", () => {
    const file = JSON.stringify({
      kind: "designlens-project",
      version: 1,
      exportedAt: "2026-01-01",
      project: { name: "X", color: "#fff", createdAt: "2026-01-01", references: [{ bogus: true }, { id: "ok", fileName: "f.png", status: "analyzed", uploadedAt: "2026-01-01" }] },
    });
    const parsed = parseProjectFile(file);
    expect(parsed.references.map((r) => r.id)).toEqual(["ok"]);
  });

  it.each([
    ["not json at all", "invalid-json"],
    ['{"kind":"other","version":1,"project":{}}', "wrong-kind"],
    ['{"kind":"designlens-project","version":999,"project":{}}', "unsupported-version"],
    ['{"kind":"designlens-project","version":1}', "missing-project"],
    ['{"kind":"designlens-project","version":1,"project":{"references":[]}}', "missing-name"],
    ['{"kind":"designlens-project","version":1,"project":{"name":"X"}}', "invalid-references"],
  ])("rejects %s with ProjectParseError", (input, code) => {
    try {
      parseProjectFile(input);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ProjectParseError);
      expect((e as ProjectParseError).code).toBe(code);
    }
  });
});

describe("projectFileName", () => {
  it("slugifies the project name", () => {
    expect(projectFileName({ ...sampleProject(), name: "My Cool Brand!" })).toBe("designlens-my-cool-brand.json");
  });
  it("falls back when slug is empty", () => {
    expect(projectFileName({ ...sampleProject(), name: "!!!" })).toBe("designlens-project.json");
  });
});
