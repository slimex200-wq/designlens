import { NextRequest, NextResponse } from "next/server";
import { analyzeDesign } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mimeType = file.type;

    let aiResult = null;
    try {
      aiResult = await analyzeDesign(base64, mimeType);
    } catch (aiError) {
      console.warn("AI analysis failed, returning colors-only:", aiError);
    }

    return NextResponse.json({
      typography: aiResult?.typography ?? [],
      layout: aiResult?.layout ?? { type: "unknown", spacing: {}, grid: "" },
      tokens: aiResult?.tokens ?? { colors: {}, spacing: {}, radius: {}, typography: [] },
      aiAvailable: aiResult !== null,
    });
  } catch (error) {
    console.error("Analysis failed:", error);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
