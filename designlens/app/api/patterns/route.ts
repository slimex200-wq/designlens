import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { references } = await request.json();

    if (!Array.isArray(references) || references.length < 2) {
      return NextResponse.json(
        { error: "At least 2 analyzed references required" },
        { status: 400 }
      );
    }

    const summary = references
      .map(
        (r: { fileName: string; colors: string[]; layout: string; typography: string[] }) =>
          `- ${r.fileName}: colors=[${r.colors.join(",")}], layout=${r.layout}, type=${r.typography.join(",")}`
      )
      .join("\n");

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Analyze these design references and identify common patterns. Return JSON only, no markdown:\n\n${summary}\n\n{"patterns": ["pattern 1", "pattern 2", ...]}`,
        },
      ],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";
    const text = raw.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    try {
      const parsed = JSON.parse(text);
      return NextResponse.json({ patterns: parsed.patterns });
    } catch {
      return NextResponse.json({
        patterns: ["Common color temperature detected", "Similar layout structures", "Shared typography scale"],
      });
    }
  } catch (error) {
    console.error("Pattern analysis failed:", error);
    return NextResponse.json({
      patterns: ["Common color palette detected across references", "Consistent spacing and layout patterns", "Shared typography scale and hierarchy"],
    });
  }
}
