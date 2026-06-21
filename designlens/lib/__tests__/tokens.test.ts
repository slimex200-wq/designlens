import { describe, it, expect } from "vitest";
import { toCSS, toTailwind, toJSON, toSCSS, toW3C, toFigmaTokens, exportTokens } from "../tokens";
import type { TokenSet } from "../types";

const sampleTokens: TokenSet = {
  colors: {
    "--primary": "#6366f1",
    "--bg": "#0f172a",
    "--text": "#f8fafc",
  },
  spacing: {
    "--space-sm": "8px",
    "--space-md": "16px",
    "--space-lg": "32px",
  },
  radius: {
    "--radius-sm": "4px",
    "--radius-md": "8px",
  },
  typography: [
    { role: "heading", size: "24px", weight: 700, letterSpacing: "-0.5px" },
    { role: "body", size: "14px", weight: 400, letterSpacing: "0px" },
  ],
};

const emptyTokens: TokenSet = {
  colors: {},
  spacing: {},
  radius: {},
  typography: [],
};

describe("toCSS", () => {
  it("wraps tokens in :root selector", () => {
    const result = toCSS(sampleTokens);
    expect(result).toContain(":root {");
    expect(result).toContain("}");
  });

  it("includes color variables", () => {
    const result = toCSS(sampleTokens);
    expect(result).toContain("--primary: #6366f1;");
    expect(result).toContain("--bg: #0f172a;");
  });

  it("includes spacing variables", () => {
    const result = toCSS(sampleTokens);
    expect(result).toContain("--space-sm: 8px;");
    expect(result).toContain("--space-lg: 32px;");
  });

  it("includes radius variables", () => {
    const result = toCSS(sampleTokens);
    expect(result).toContain("--radius-sm: 4px;");
  });

  it("handles empty tokens", () => {
    const result = toCSS(emptyTokens);
    expect(result).toBe(":root {\n}");
  });
});

describe("toTailwind", () => {
  it("outputs a valid tailwind config structure", () => {
    const result = toTailwind(sampleTokens);
    expect(result).toContain("module.exports");
    expect(result).toContain("theme:");
    expect(result).toContain("extend:");
  });

  it("strips -- prefix from color keys and replaces dashes with dots", () => {
    const result = toTailwind(sampleTokens);
    expect(result).toContain("primary");
    expect(result).toContain("#6366f1");
  });

  it("strips --space- prefix from spacing keys", () => {
    const result = toTailwind(sampleTokens);
    expect(result).toContain("sm");
    expect(result).toContain("8px");
  });

  it("strips --radius- prefix from radius keys", () => {
    const result = toTailwind(sampleTokens);
    expect(result).toContain("borderRadius");
    expect(result).toContain("4px");
  });
});

describe("toJSON", () => {
  it("returns valid JSON", () => {
    const result = toJSON(sampleTokens);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("preserves all token data", () => {
    const result = JSON.parse(toJSON(sampleTokens));
    expect(result.colors["--primary"]).toBe("#6366f1");
    expect(result.spacing["--space-md"]).toBe("16px");
    expect(result.radius["--radius-md"]).toBe("8px");
    expect(result.typography).toHaveLength(2);
  });
});

describe("exportTokens", () => {
  it("delegates to toCSS for css format", () => {
    expect(exportTokens(sampleTokens, "css")).toBe(toCSS(sampleTokens));
  });

  it("delegates to toTailwind for tailwind format", () => {
    expect(exportTokens(sampleTokens, "tailwind")).toBe(toTailwind(sampleTokens));
  });

  it("delegates to toJSON for json format", () => {
    expect(exportTokens(sampleTokens, "json")).toBe(toJSON(sampleTokens));
  });

  it("delegates to toSCSS for scss format", () => {
    expect(exportTokens(sampleTokens, "scss")).toBe(toSCSS(sampleTokens));
  });

  it("delegates to toW3C for w3c format", () => {
    expect(exportTokens(sampleTokens, "w3c")).toBe(toW3C(sampleTokens));
  });

  it("delegates to toFigmaTokens for figma format", () => {
    expect(exportTokens(sampleTokens, "figma")).toBe(toFigmaTokens(sampleTokens));
  });
});

describe("toSCSS", () => {
  it("emits a color variable line stripped of -- prefix", () => {
    const result = toSCSS(sampleTokens);
    expect(result).toContain("$primary: #6366f1;");
  });

  it("emits a spacing variable line", () => {
    const result = toSCSS(sampleTokens);
    expect(result).toContain("$space-sm: 8px;");
  });

  it("emits a radius variable line", () => {
    const result = toSCSS(sampleTokens);
    expect(result).toContain("$radius-sm: 4px;");
  });

  it("handles empty tokens without throwing and emits no variables", () => {
    let result = "";
    expect(() => { result = toSCSS(emptyTokens); }).not.toThrow();
    expect(result.trim()).toBe("");
    expect(result).not.toContain("$");
  });
});

describe("toW3C", () => {
  it("emits color tokens with $value and $type color", () => {
    const result = JSON.parse(toW3C(sampleTokens));
    expect(result.color.primary.$value).toBe("#6366f1");
    expect(result.color.primary.$type).toBe("color");
  });

  it("emits spacing tokens with dimension type", () => {
    const result = JSON.parse(toW3C(sampleTokens));
    expect(result.spacing["space-sm"].$value).toBe("8px");
    expect(result.spacing["space-sm"].$type).toBe("dimension");
  });

  it("emits radius tokens with dimension type", () => {
    const result = JSON.parse(toW3C(sampleTokens));
    expect(result.radius["radius-sm"].$type).toBe("dimension");
  });

  it("emits typography tokens keyed by role with typography type", () => {
    const result = JSON.parse(toW3C(sampleTokens));
    expect(result.typography.heading.$type).toBe("typography");
    expect(result.typography.heading.$value.fontSize).toBe("24px");
    expect(result.typography.heading.$value.fontWeight).toBe(700);
  });

  it("handles empty tokens without throwing and omits groups", () => {
    let raw = "";
    expect(() => { raw = toW3C(emptyTokens); }).not.toThrow();
    const result = JSON.parse(raw);
    expect(result.color).toBeUndefined();
    expect(result.spacing).toBeUndefined();
    expect(result.radius).toBeUndefined();
    expect(result.typography).toBeUndefined();
  });
});

describe("toFigmaTokens", () => {
  it("emits color tokens under global.colors with type color", () => {
    const result = JSON.parse(toFigmaTokens(sampleTokens));
    expect(result.global.colors.primary.value).toBe("#6366f1");
    expect(result.global.colors.primary.type).toBe("color");
  });

  it("emits spacing and borderRadius groups", () => {
    const result = JSON.parse(toFigmaTokens(sampleTokens));
    expect(result.global.spacing.sm.value).toBe("8px");
    expect(result.global.spacing.sm.type).toBe("spacing");
    expect(result.global.borderRadius.sm.value).toBe("4px");
    expect(result.global.borderRadius.sm.type).toBe("borderRadius");
  });

  it("handles empty tokens with empty sub-objects", () => {
    const result = JSON.parse(toFigmaTokens(emptyTokens));
    expect(result.global.colors).toEqual({});
    expect(result.global.spacing).toEqual({});
    expect(result.global.borderRadius).toEqual({});
  });
});
