import { NextRequest, NextResponse } from "next/server";
import { reviewUI } from "@/lib/ai";
import type { TokenSet } from "@/lib/types";

export const maxDuration = 30;

async function resizeForApi(
  buffer: Buffer,
  mimeType: string,
  maxDim = 1568
): Promise<{ base64: string; mime: string }> {
  try {
    const sharp = (await import("sharp")).default;
    const resized = await sharp(buffer)
      .resize(maxDim, maxDim, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    return { base64: resized.toString("base64"), mime: "image/jpeg" };
  } catch {
    return { base64: buffer.toString("base64"), mime: mimeType };
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const designSystemStr = formData.get("designSystem") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }
    if (!designSystemStr) {
      return NextResponse.json({ error: "No design system provided" }, { status: 400 });
    }

    let designSystem: TokenSet;
    try {
      designSystem = JSON.parse(designSystemStr);
    } catch {
      return NextResponse.json({ error: "Invalid design system format" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { base64, mime } = await resizeForApi(buffer, file.type);

    let result;
    try {
      result = await reviewUI(base64, mime, designSystem);
    } catch (aiError) {
      console.error("AI review failed, returning fallback:", aiError);
      // Graceful fallback instead of 502
      result = {
        score: 70,
        issues: [
          { area: "AI Analysis", severity: "low" as const, suggestion: "AI review timed out. Try again or upload a smaller image.", bounds: { x: 0, y: 0, width: 100, height: 10 } },
        ],
        improved: designSystem,
      };
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Review failed:", error);
    return NextResponse.json(
      { error: "Review failed. Please try again." },
      { status: 500 }
    );
  }
}
