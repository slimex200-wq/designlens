import type { TokenSet } from "./types";

export function toCSS(tokens: TokenSet): string {
  const lines = [":root {"];
  for (const [key, value] of Object.entries(tokens.colors)) {
    lines.push(`  ${key}: ${value};`);
  }
  for (const [key, value] of Object.entries(tokens.spacing)) {
    lines.push(`  ${key}: ${value};`);
  }
  for (const [key, value] of Object.entries(tokens.radius)) {
    lines.push(`  ${key}: ${value};`);
  }
  lines.push("}");
  return lines.join("\n");
}

export function toTailwind(tokens: TokenSet): string {
  const config: Record<string, Record<string, string>> = {
    colors: {},
    spacing: {},
    borderRadius: {},
  };
  for (const [key, value] of Object.entries(tokens.colors)) {
    const name = key.replace(/^--/, "").replace(/-/g, ".");
    config.colors[name] = value;
  }
  for (const [key, value] of Object.entries(tokens.spacing)) {
    const name = key.replace(/^--space-/, "");
    config.spacing[name] = value;
  }
  for (const [key, value] of Object.entries(tokens.radius)) {
    const name = key.replace(/^--radius-/, "");
    config.borderRadius[name] = value;
  }
  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: ${JSON.stringify(config, null, 6).replace(/"/g, "'")},
  },
};`;
}

export function toJSON(tokens: TokenSet): string {
  return JSON.stringify(tokens, null, 2);
}

export function toSCSS(tokens: TokenSet): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(tokens.colors)) {
    lines.push(`$${key.replace(/^--/, "")}: ${value};`);
  }
  for (const [key, value] of Object.entries(tokens.spacing)) {
    lines.push(`$${key.replace(/^--/, "")}: ${value};`);
  }
  for (const [key, value] of Object.entries(tokens.radius)) {
    lines.push(`$${key.replace(/^--/, "")}: ${value};`);
  }
  return lines.join("\n");
}

export function toW3C(tokens: TokenSet): string {
  const obj: Record<string, unknown> = {};

  const colorEntries = Object.entries(tokens.colors);
  if (colorEntries.length > 0) {
    const color: Record<string, unknown> = {};
    for (const [key, value] of colorEntries) {
      color[key.replace(/^--/, "")] = { $value: value, $type: "color" };
    }
    obj.color = color;
  }

  const spacingEntries = Object.entries(tokens.spacing);
  if (spacingEntries.length > 0) {
    const spacing: Record<string, unknown> = {};
    for (const [key, value] of spacingEntries) {
      spacing[key.replace(/^--/, "")] = { $value: value, $type: "dimension" };
    }
    obj.spacing = spacing;
  }

  const radiusEntries = Object.entries(tokens.radius);
  if (radiusEntries.length > 0) {
    const radius: Record<string, unknown> = {};
    for (const [key, value] of radiusEntries) {
      radius[key.replace(/^--/, "")] = { $value: value, $type: "dimension" };
    }
    obj.radius = radius;
  }

  if (tokens.typography.length > 0) {
    const typography: Record<string, unknown> = {};
    const seen: Record<string, number> = {};
    for (const tk of tokens.typography) {
      let name = tk.role;
      if (seen[tk.role] !== undefined) {
        seen[tk.role] += 1;
        name = `${tk.role}-${seen[tk.role]}`;
      } else {
        seen[tk.role] = 1;
      }
      const value: Record<string, unknown> = {
        fontSize: tk.size,
        fontWeight: tk.weight,
        letterSpacing: tk.letterSpacing,
      };
      if (tk.fontFamily !== undefined) {
        value.fontFamily = tk.fontFamily;
      }
      typography[name] = { $value: value, $type: "typography" };
    }
    obj.typography = typography;
  }

  return JSON.stringify(obj, null, 2);
}

export function toFigmaTokens(tokens: TokenSet): string {
  const colors: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(tokens.colors)) {
    const name = key.replace(/^--/, "").replace(/-/g, ".");
    colors[name] = { value, type: "color" };
  }

  const spacing: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(tokens.spacing)) {
    const name = key.replace(/^--space-/, "");
    spacing[name] = { value, type: "spacing" };
  }

  const borderRadius: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(tokens.radius)) {
    const name = key.replace(/^--radius-/, "");
    borderRadius[name] = { value, type: "borderRadius" };
  }

  return JSON.stringify({ global: { colors, spacing, borderRadius } }, null, 2);
}

export function exportTokens(
  tokens: TokenSet,
  format: "css" | "tailwind" | "json" | "scss" | "w3c" | "figma"
): string {
  switch (format) {
    case "css": return toCSS(tokens);
    case "tailwind": return toTailwind(tokens);
    case "json": return toJSON(tokens);
    case "scss": return toSCSS(tokens);
    case "w3c": return toW3C(tokens);
    case "figma": return toFigmaTokens(tokens);
  }
}
