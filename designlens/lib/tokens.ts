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

export function exportTokens(tokens: TokenSet, format: "css" | "tailwind" | "json"): string {
  switch (format) {
    case "css": return toCSS(tokens);
    case "tailwind": return toTailwind(tokens);
    case "json": return toJSON(tokens);
  }
}
