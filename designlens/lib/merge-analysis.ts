import type { ExtractedStyles, TokenSet, ColorInfo, TypographyInfo } from "./types";

function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return rgb;
  const [, r, g, b] = match;
  return `#${[r, g, b].map((v) => parseInt(v).toString(16).padStart(2, "0")).join("")}`;
}

export function mergeAnalysis(
  aiResult: {
    typography?: TypographyInfo[];
    tokens?: TokenSet;
  } | null,
  extracted: ExtractedStyles,
): { tokens: TokenSet; typography: TypographyInfo[]; colors: ColorInfo[] } {
  // Colors: use extracted CSS colors, convert RGB to hex
  const colors: ColorInfo[] = extracted.colors.slice(0, 8).map((c) => ({
    hex: rgbToHex(c.value),
    role: c.properties.includes("background-color")
      ? "background"
      : c.properties.includes("border-color")
        ? "border"
        : "text",
    percentage: c.count,
  }));

  // Typography: prefer extracted fonts
  const typography: TypographyInfo[] = extracted.fonts.map((f) => ({
    size: "16px",
    weight: f.weights[0] ?? 400,
    letterSpacing: "0px",
    role: "body",
  }));

  // Tokens: merge extracted + AI
  const tokens: TokenSet = {
    colors: {},
    spacing: {},
    radius: {},
    typography: aiResult?.tokens?.typography ?? typography,
  };

  // Colors from extracted
  extracted.colors.slice(0, 8).forEach((c, i) => {
    const hex = rgbToHex(c.value);
    const role = c.properties.includes("background-color")
      ? "bg"
      : c.properties.includes("border-color")
        ? "border"
        : "text";
    tokens.colors[`--${role}-${i}`] = hex;
  });

  // Override with AI colors if available (better role naming)
  if (aiResult?.tokens?.colors) {
    Object.assign(tokens.colors, aiResult.tokens.colors);
  }

  // Spacing from extracted
  extracted.spacing.slice(0, 8).forEach((s) => {
    tokens.spacing[`--space-${s.value}`] = s.value;
  });
  if (aiResult?.tokens?.spacing) {
    Object.assign(tokens.spacing, aiResult.tokens.spacing);
  }

  // Radius from extracted
  extracted.borderRadius.slice(0, 5).forEach((r) => {
    tokens.radius[`--radius-${r.value}`] = r.value;
  });
  if (aiResult?.tokens?.radius) {
    Object.assign(tokens.radius, aiResult.tokens.radius);
  }

  return { tokens, typography: aiResult?.typography ?? typography, colors };
}
