import { describe, it, expect } from "vitest";
import {
  SAMPLE_ID,
  PROJECT_COLORS,
  nextProjectColor,
  genProjectId,
  makeProject,
  renameInProjects,
  removeFromProjects,
  resolveActiveAfterDelete,
} from "../projects";
import {
  serializeProject,
  parseProjectFile,
  projectFileName,
  ProjectParseError,
  PROJECT_FILE_VERSION,
} from "../project-io";
import { toCSS, toTailwind, toJSON, toSCSS, toW3C, toFigmaTokens, exportTokens } from "../tokens";
import type { Project, TokenSet } from "../types";

// ---------- helpers ----------

function validFile(projectOverrides: Record<string, unknown> = {}, version = PROJECT_FILE_VERSION): string {
  return JSON.stringify({
    kind: "designlens-project",
    version,
    exportedAt: "2026-01-01T00:00:00.000Z",
    project: {
      id: "p1",
      name: "Brand System",
      color: "#93C5FD",
      references: [],
      createdAt: "2026-01-01",
      ...projectOverrides,
    },
  });
}

function expectParseCode(json: string, code: string) {
  let thrown: unknown;
  try {
    parseProjectFile(json);
  } catch (e) {
    thrown = e;
  }
  expect(thrown, `expected throw for input: ${json.slice(0, 60)}`).toBeInstanceOf(ProjectParseError);
  expect((thrown as ProjectParseError).code).toBe(code);
}

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: "p1",
    name: "Brand System",
    color: "#93C5FD",
    references: [],
    createdAt: "2026-01-01",
    ...overrides,
  };
}

// ============================================================
// parseProjectFile — malformed / adversarial inputs
// ============================================================

describe("parseProjectFile — adversarial malformed inputs", () => {
  it("empty string -> invalid-json", () => {
    expectParseCode("", "invalid-json");
  });

  it("garbage non-json -> invalid-json", () => {
    expectParseCode("{not json", "invalid-json");
    expectParseCode("undefined", "invalid-json");
  });

  it('"null" parses to null -> not-object', () => {
    expectParseCode("null", "not-object");
  });

  it('JSON number/string/bool primitives -> not-object', () => {
    expectParseCode("42", "not-object");
    expectParseCode('"a string"', "not-object");
    expectParseCode("true", "not-object");
  });

  it('"[]" array is typeof object so it slips past not-object and fails on wrong-kind', () => {
    // Documents actual behavior: arrays are typeof "object", so the not-object
    // guard does NOT catch them; the missing `kind` makes it wrong-kind.
    expectParseCode("[]", "wrong-kind");
  });

  it('"{}" missing kind -> wrong-kind', () => {
    expectParseCode("{}", "wrong-kind");
  });

  it("wrong kind value -> wrong-kind", () => {
    expectParseCode(JSON.stringify({ kind: "something-else", version: 1, project: {} }), "wrong-kind");
  });

  it("version 2 (> current) -> unsupported-version", () => {
    expectParseCode(validFile({}, 2), "unsupported-version");
  });

  it("version 999 -> unsupported-version", () => {
    expectParseCode(validFile({}, 999), "unsupported-version");
  });

  it("non-numeric version -> unsupported-version", () => {
    expectParseCode(
      JSON.stringify({ kind: "designlens-project", version: "1", project: {} }),
      "unsupported-version"
    );
  });

  it("version 0 is ACCEPTED (only versions > current are rejected)", () => {
    // Confirmed behavior: 0 > 1 is false, so version 0 passes validation.
    const result = parseProjectFile(validFile({}, 0));
    expect(result.name).toBe("Brand System");
  });

  it("missing project -> missing-project", () => {
    expectParseCode(JSON.stringify({ kind: "designlens-project", version: 1 }), "missing-project");
  });

  it("project is null -> missing-project", () => {
    expectParseCode(
      JSON.stringify({ kind: "designlens-project", version: 1, project: null }),
      "missing-project"
    );
  });

  it("whitespace-only name -> missing-name", () => {
    expectParseCode(validFile({ name: "   \t\n  " }), "missing-name");
  });

  it("empty name -> missing-name", () => {
    expectParseCode(validFile({ name: "" }), "missing-name");
  });

  it("non-string name -> missing-name", () => {
    expectParseCode(validFile({ name: 123 }), "missing-name");
    expectParseCode(validFile({ name: null }), "missing-name");
  });

  it("references not an array -> invalid-references", () => {
    expectParseCode(validFile({ references: {} }), "invalid-references");
    expectParseCode(validFile({ references: "nope" }), "invalid-references");
    expectParseCode(validFile({ references: null }), "invalid-references");
  });
});

describe("parseProjectFile — references sanitization", () => {
  it("drops nulls, numbers, and objects missing id/fileName", () => {
    const json = validFile({
      references: [
        null,
        42,
        "string",
        { id: "ok", fileName: "a.png", filePath: "http://x/a.png", status: "analyzed", uploadedAt: "2026" },
        { id: "no-filename" }, // missing fileName -> dropped
        { fileName: "no-id.png" }, // missing id -> dropped
        {}, // dropped
      ],
    });
    const result = parseProjectFile(json);
    expect(result.references).toHaveLength(1);
    expect(result.references[0].id).toBe("ok");
  });

  it("unknown status falls back to 'analyzed'", () => {
    const json = validFile({
      references: [{ id: "r", fileName: "f.png", status: "weird-status", uploadedAt: "2026" }],
    });
    const result = parseProjectFile(json);
    expect(result.references[0].status).toBe("analyzed");
  });

  it("reference with non-string filePath becomes empty string", () => {
    const json = validFile({
      references: [{ id: "r", fileName: "f.png", filePath: 999, uploadedAt: "2026" }],
    });
    const result = parseProjectFile(json);
    expect(result.references[0].filePath).toBe("");
  });
});

describe("parseProjectFile — exotic but valid names", () => {
  it("unicode / emoji names round-trip (trimmed)", () => {
    const name = "  디자인 🎨 système Ω  ";
    const result = parseProjectFile(validFile({ name }));
    expect(result.name).toBe("디자인 🎨 système Ω");
  });

  it("extremely long name is preserved (no length cap)", () => {
    const name = "x".repeat(50000);
    const result = parseProjectFile(validFile({ name }));
    expect(result.name).toHaveLength(50000);
  });

  it("deeply nested huge analysis input parses without throwing", () => {
    let nested: unknown = { deep: true };
    for (let i = 0; i < 500; i++) nested = { child: nested };
    const json = validFile({
      references: [
        {
          id: "r",
          fileName: "f.png",
          filePath: "http://x",
          uploadedAt: "2026",
          analysis: nested,
        },
      ],
    });
    expect(() => parseProjectFile(json)).not.toThrow();
  });

  it("minimal valid file fills sane defaults", () => {
    const json = JSON.stringify({
      kind: "designlens-project",
      version: 1,
      project: { name: "Min", references: [] },
    });
    const result = parseProjectFile(json);
    expect(result.id).toBe("imported");
    expect(result.color).toBe("#93C5FD");
    expect(typeof result.createdAt).toBe("string");
  });
});

// ============================================================
// serialize -> parse round-trip
// ============================================================

describe("serializeProject -> parseProjectFile round-trip", () => {
  it("strips data: images, preserves http/blob/empty, keeps analysis", () => {
    const analysis = {
      id: "a1",
      imageHash: "h",
      fileName: "hero.png",
      colors: [{ hex: "#000", role: "background", percentage: 50 }],
      typography: [],
      layout: { type: "single-column", spacing: {}, grid: "" },
      tokens: { colors: {}, spacing: {}, radius: {}, typography: [] },
      aiAvailable: true,
      createdAt: "2026-01-01",
    };
    const p = project({
      references: [
        { id: "d", fileName: "data.png", filePath: "data:image/png;base64,AAAA", status: "analyzed", uploadedAt: "2026", analysis },
        { id: "b", fileName: "blob.png", filePath: "blob:http://x/abc", status: "analyzed", uploadedAt: "2026" },
        { id: "h", fileName: "http.png", filePath: "http://example.com/a.png", status: "analyzed", uploadedAt: "2026" },
        { id: "e", fileName: "empty.png", filePath: "", status: "analyzed", uploadedAt: "2026" },
      ] as Project["references"],
    });

    const round = parseProjectFile(serializeProject(p));
    const byId = Object.fromEntries(round.references.map((r) => [r.id, r]));

    expect(byId.d.filePath).toBe(""); // data: stripped
    expect(byId.b.filePath).toBe("blob:http://x/abc"); // blob: NOT stripped (only data: is)
    expect(byId.h.filePath).toBe("http://example.com/a.png"); // http preserved
    expect(byId.e.filePath).toBe(""); // empty preserved
    expect(byId.d.analysis).toEqual(analysis); // analysis survives even when image stripped
  });
});

// ============================================================
// projectFileName
// ============================================================

describe("projectFileName", () => {
  it("slugifies, lowercases, trims, and caps length", () => {
    expect(projectFileName(project({ name: "My Brand!!! System" }))).toBe("designlens-my-brand-system.json");
  });

  it("falls back to 'project' when slug is empty (all-symbol name)", () => {
    expect(projectFileName(project({ name: "🎨🎨🎨" }))).toBe("designlens-project.json");
    expect(projectFileName(project({ name: "---" }))).toBe("designlens-project.json");
  });
});

// ============================================================
// projects helpers
// ============================================================

describe("renameInProjects", () => {
  const base = [project({ id: SAMPLE_ID, name: "Sample" }), project({ id: "p1", name: "One" })];

  it("sample id is locked (returns same array reference)", () => {
    const out = renameInProjects(base, SAMPLE_ID, "Hacked");
    expect(out).toBe(base);
  });

  it("blank/whitespace name is a no-op (same reference)", () => {
    expect(renameInProjects(base, "p1", "")).toBe(base);
    expect(renameInProjects(base, "p1", "   ")).toBe(base);
  });

  it("non-existent id changes nothing", () => {
    const out = renameInProjects(base, "ghost", "X");
    expect(out.map((p) => p.name)).toEqual(["Sample", "One"]);
  });

  it("renames and trims the matching project", () => {
    const out = renameInProjects(base, "p1", "  Renamed  ");
    expect(out.find((p) => p.id === "p1")!.name).toBe("Renamed");
  });
});

describe("removeFromProjects", () => {
  const base = [project({ id: SAMPLE_ID }), project({ id: "p1" }), project({ id: "p2" })];

  it("sample id is locked (returns same array reference)", () => {
    expect(removeFromProjects(base, SAMPLE_ID)).toBe(base);
  });

  it("non-existent id removes nothing", () => {
    expect(removeFromProjects(base, "ghost")).toHaveLength(3);
  });

  it("removes the matching project", () => {
    const out = removeFromProjects(base, "p1");
    expect(out.map((p) => p.id)).toEqual([SAMPLE_ID, "p2"]);
  });
});

describe("resolveActiveAfterDelete", () => {
  it("keeps current when current !== deleted", () => {
    expect(resolveActiveAfterDelete([project({ id: "a" })], "x", "a")).toBe("a");
  });

  it("falls to first remaining when current === deleted", () => {
    expect(resolveActiveAfterDelete([project({ id: "b" }), project({ id: "c" })], "a", "a")).toBe("b");
  });

  it("falls to SAMPLE_ID when remaining is empty and current was deleted", () => {
    expect(resolveActiveAfterDelete([], "a", "a")).toBe(SAMPLE_ID);
  });

  it("keeps current even if remaining empty when current !== deleted", () => {
    expect(resolveActiveAfterDelete([], "deleted", "stillHere")).toBe("stillHere");
  });
});

describe("nextProjectColor", () => {
  it("returns first color for 0", () => {
    expect(nextProjectColor(0)).toBe(PROJECT_COLORS[0]);
  });

  it("wraps at palette length", () => {
    expect(nextProjectColor(PROJECT_COLORS.length)).toBe(PROJECT_COLORS[0]);
    expect(nextProjectColor(PROJECT_COLORS.length + 1)).toBe(PROJECT_COLORS[1]);
  });

  it("every index maps to a defined palette color", () => {
    for (let i = 0; i < 100; i++) {
      expect(PROJECT_COLORS).toContain(nextProjectColor(i));
    }
  });
});

describe("makeProject", () => {
  it("trims the name", () => {
    expect(makeProject("  Hi  ", "#000", "id1", "2026").name).toBe("Hi");
  });

  it("falls back to 'New Project' on blank/whitespace", () => {
    expect(makeProject("", "#000", "id1", "2026").name).toBe("New Project");
    expect(makeProject("    ", "#000", "id1", "2026").name).toBe("New Project");
  });

  it("starts with empty references", () => {
    expect(makeProject("X", "#000", "id1", "2026").references).toEqual([]);
  });
});

describe("genProjectId", () => {
  it("produces unique ids across many rapid calls", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 5000; i++) ids.add(genProjectId());
    expect(ids.size).toBe(5000);
  });

  it("uses the proj_ prefix", () => {
    expect(genProjectId().startsWith("proj_")).toBe(true);
  });
});

// ============================================================
// tokens
// ============================================================

const emptyTokens: TokenSet = { colors: {}, spacing: {}, radius: {}, typography: [] };

describe("token formatters — empty input", () => {
  it("toSCSS empty -> empty string, no throw", () => {
    expect(toSCSS(emptyTokens)).toBe("");
  });

  it("toW3C empty -> empty object json, no throw", () => {
    expect(JSON.parse(toW3C(emptyTokens))).toEqual({});
  });

  it("toFigmaTokens empty -> sane skeleton, no throw", () => {
    expect(JSON.parse(toFigmaTokens(emptyTokens))).toEqual({
      global: { colors: {}, spacing: {}, borderRadius: {} },
    });
  });

  it("toCSS empty is still valid :root block", () => {
    expect(toCSS(emptyTokens)).toBe(":root {\n}");
  });
});

describe("token formatters — special characters in values", () => {
  const tricky: TokenSet = {
    colors: { "--c": "rgba(0, 0, 0, 0.5)", "--q": 'url("a&b")' },
    spacing: { "--space-x": "calc(100% - 8px)" },
    radius: {},
    typography: [],
  };

  it("toW3C preserves special-char values verbatim", () => {
    const obj = JSON.parse(toW3C(tricky));
    expect(obj.color.c.$value).toBe("rgba(0, 0, 0, 0.5)");
    expect(obj.color.q.$value).toBe('url("a&b")');
    expect(obj.spacing["space-x"].$value).toBe("calc(100% - 8px)");
  });

  it("toFigmaTokens preserves special-char values verbatim", () => {
    const obj = JSON.parse(toFigmaTokens(tricky));
    expect(obj.global.colors.c.value).toBe("rgba(0, 0, 0, 0.5)");
  });
});

describe("toW3C — duplicate typography roles", () => {
  it("keeps unique keys for repeated roles", () => {
    const tokens: TokenSet = {
      colors: {},
      spacing: {},
      radius: {},
      typography: [
        { role: "heading", size: "24px", weight: 700, letterSpacing: "0px" },
        { role: "heading", size: "18px", weight: 600, letterSpacing: "0px" },
        { role: "heading", size: "16px", weight: 500, letterSpacing: "0px" },
        { role: "body", size: "14px", weight: 400, letterSpacing: "0px" },
      ],
    };
    const obj = JSON.parse(toW3C(tokens));
    const keys = Object.keys(obj.typography);
    expect(keys).toEqual(["heading", "heading-2", "heading-3", "body"]);
    // no data loss: each entry distinct
    expect(obj.typography.heading.$value.fontSize).toBe("24px");
    expect(obj.typography["heading-2"].$value.fontSize).toBe("18px");
    expect(obj.typography["heading-3"].$value.fontSize).toBe("16px");
  });

  it("includes fontFamily only when defined", () => {
    const tokens: TokenSet = {
      colors: {},
      spacing: {},
      radius: {},
      typography: [
        { role: "a", size: "1px", weight: 400, letterSpacing: "0", fontFamily: "Inter" },
        { role: "b", size: "1px", weight: 400, letterSpacing: "0" },
      ],
    };
    const obj = JSON.parse(toW3C(tokens));
    expect(obj.typography.a.$value.fontFamily).toBe("Inter");
    expect("fontFamily" in obj.typography.b.$value).toBe(false);
  });
});

describe("exportTokens dispatch", () => {
  const tokens: TokenSet = {
    colors: { "--primary": "#6366f1" },
    spacing: { "--space-sm": "8px" },
    radius: { "--radius-sm": "4px" },
    typography: [{ role: "heading", size: "24px", weight: 700, letterSpacing: "-0.5px" }],
  };

  it("dispatches each of the 6 formats to its direct formatter", () => {
    expect(exportTokens(tokens, "css")).toBe(toCSS(tokens));
    expect(exportTokens(tokens, "tailwind")).toBe(toTailwind(tokens));
    expect(exportTokens(tokens, "json")).toBe(toJSON(tokens));
    expect(exportTokens(tokens, "scss")).toBe(toSCSS(tokens));
    expect(exportTokens(tokens, "w3c")).toBe(toW3C(tokens));
    expect(exportTokens(tokens, "figma")).toBe(toFigmaTokens(tokens));
  });
});
