import { NextRequest, NextResponse } from "next/server";
import { enhanceUI } from "@/lib/ai";
import type { ReviewIssue, TokenSet } from "@/lib/types";

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
    const issuesStr = formData.get("issues") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }
    if (!designSystemStr) {
      return NextResponse.json({ error: "No design system provided" }, { status: 400 });
    }
    if (!issuesStr) {
      return NextResponse.json({ error: "No issues provided" }, { status: 400 });
    }

    let designSystem: Pick<TokenSet, "colors" | "spacing" | "radius">;
    try {
      const parsed = JSON.parse(designSystemStr);
      designSystem = {
        colors: parsed.colors ?? {},
        spacing: parsed.spacing ?? {},
        radius: parsed.radius ?? {},
      };
    } catch {
      return NextResponse.json({ error: "Invalid design system format" }, { status: 400 });
    }

    let issues: ReviewIssue[];
    try {
      issues = JSON.parse(issuesStr);
    } catch {
      return NextResponse.json({ error: "Invalid issues format" }, { status: 400 });
    }

    const localeStr = (formData.get("locale") as string | null) ?? "en";

    const buffer = Buffer.from(await file.arrayBuffer());
    const { base64, mime } = await resizeForApi(buffer, file.type);

    try {
      const result = await enhanceUI(base64, mime, designSystem, issues, localeStr);
      return NextResponse.json(result);
    } catch (aiError) {
      console.error("AI enhance failed, returning fallback:", aiError);
      return NextResponse.json({ enhancements: [], improvedScore: 0 });
    }
  } catch (error) {
    console.error("Enhance failed:", error);
    return NextResponse.json({ enhancements: [], improvedScore: 0 });
  }
}
