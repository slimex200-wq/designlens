import { NextResponse } from "next/server";
import { generateEnhancedImage } from "@/lib/openai";
import type { Enhancement } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, enhancements } = body as {
      image: string;
      enhancements: Enhancement[];
    };

    if (!image || !enhancements?.length) {
      return NextResponse.json(
        { error: "Missing image or enhancements" },
        { status: 400 },
      );
    }

    const base64 = image.replace(/^data:image\/\w+;base64,/, "");

    const result = await generateEnhancedImage(base64, enhancements);

    return NextResponse.json({
      imageUrl: `data:image/png;base64,${result.imageBase64}`,
      generationTime: result.generationTime,
    });
  } catch (err) {
    console.error("Image generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Image generation failed" },
      { status: 500 },
    );
  }
}
