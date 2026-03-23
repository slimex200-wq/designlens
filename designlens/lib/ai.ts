import Anthropic from "@anthropic-ai/sdk";
import type { TypographyInfo, LayoutInfo, TokenSet, ReviewResult } from "./types";

const client = new Anthropic();

export async function analyzeDesign(imageBase64: string, mimeType: string) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mimeType as "image/png" | "image/jpeg" | "image/webp", data: imageBase64 },
          },
          {
            type: "text",
            text: `Analyze this UI screenshot. Return JSON only, no markdown:
{
  "typography": [{"role": "heading"|"body"|"label"|"caption", "size": "px value", "weight": number, "letterSpacing": "px value"}],
  "layout": {"type": "single-column"|"two-column"|"grid"|"sidebar"|"dashboard", "spacing": {"section": "px", "card": "px", "element": "px"}, "grid": "description"},
  "tokens": {
    "colors": {"--name": "#hex"},
    "spacing": {"--name": "px"},
    "radius": {"--name": "px"},
    "typography": [{"role": "string", "size": "px", "weight": number, "letterSpacing": "px"}]
  }
}`,
          },
        ],
      },
    ],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "";
  const text = raw.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  try {
    return JSON.parse(text) as {
      typography: TypographyInfo[];
      layout: LayoutInfo;
      tokens: TokenSet;
    };
  } catch {
    throw new Error("Failed to parse AI analysis response");
  }
}

export async function reviewUI(
  imageBase64: string,
  mimeType: string,
  designSystem: TokenSet
): Promise<ReviewResult> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mimeType as "image/png" | "image/jpeg" | "image/webp", data: imageBase64 },
          },
          {
            type: "text",
            text: `Review this UI against the following design system:
${JSON.stringify(designSystem, null, 2)}

Evaluate: visual hierarchy, color consistency, spacing regularity, contrast/accessibility.

Return JSON only:
{
  "score": 0-100,
  "issues": [{"area": "description", "severity": "high"|"medium"|"low", "suggestion": "actionable fix", "bounds": {"x": 0-100, "y": 0-100, "width": 0-100, "height": 0-100}}],
  "improved": { same TokenSet format with suggested improvements }
}`,
          },
        ],
      },
    ],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "";
  const text = raw.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  try {
    return JSON.parse(text) as ReviewResult;
  } catch {
    throw new Error("Failed to parse AI review response");
  }
}
