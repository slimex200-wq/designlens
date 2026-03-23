import { NextRequest, NextResponse } from "next/server";
import { reviewUI } from "@/lib/ai";
import type { TokenSet } from "@/lib/types";

export const maxDuration = 30;

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
    const base64 = buffer.toString("base64");

    let result;
    try {
      result = await reviewUI(base64, file.type, designSystem);
    } catch (aiError) {
      console.error("AI review failed:", aiError);
      return NextResponse.json(
        { error: "AI review failed. Check your API key and try again." },
        { status: 502 }
      );
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
