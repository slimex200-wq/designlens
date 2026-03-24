import { NextResponse } from "next/server";
import { captureUrl } from "@/lib/capture";
import { analyzeDesign } from "@/lib/ai";
import { mergeAnalysis } from "@/lib/merge-analysis";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Step 1: Capture screenshot + extract styles
    const { screenshot, extractedStyles, metadata } = await captureUrl(url);

    // Step 2: AI analysis on the screenshot
    let aiResult = null;
    try {
      aiResult = await analyzeDesign(screenshot, "image/jpeg");
    } catch (err) {
      console.warn("AI analysis failed for URL capture:", err);
    }

    // Step 3: Merge results
    const merged = mergeAnalysis(aiResult, extractedStyles);

    return NextResponse.json({
      screenshot: `data:image/jpeg;base64,${screenshot}`,
      extractedStyles,
      metadata,
      analysis: {
        typography: merged.typography,
        layout: aiResult?.layout ?? { type: "unknown", spacing: {}, grid: "" },
        tokens: merged.tokens,
        colors: merged.colors,
        aiAvailable: aiResult !== null,
      },
    });
  } catch (err) {
    console.error("Capture error:", err);
    const message = err instanceof Error ? err.message : "Capture failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
