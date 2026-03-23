import { NextRequest, NextResponse } from "next/server";
import { analyzeDesign } from "@/lib/ai";

export const maxDuration = 30; // Vercel serverless timeout (seconds)

/** Resize image buffer to fit within maxDim, returns JPEG base64. */
async function resizeForApi(buffer: Buffer, mimeType: string, maxDim = 1568): Promise<{ base64: string; mime: string }> {
  // For the AI API, we cap at 1568px (Claude's recommended max for vision).
  // Use sharp if available, otherwise send as-is.
  try {
    const sharp = (await import("sharp")).default;
    const resized = await sharp(buffer)
      .resize(maxDim, maxDim, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    return { base64: resized.toString("base64"), mime: "image/jpeg" };
  } catch {
    // sharp not available (e.g. edge runtime) — send original
    return { base64: buffer.toString("base64"), mime: mimeType };
  }
}

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
    const { base64, mime } = await resizeForApi(buffer, file.type);

    let aiResult = null;
    try {
      aiResult = await analyzeDesign(base64, mime);
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
