import OpenAI, { toFile } from "openai";
import type { Enhancement } from "./types";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey });
}

function buildPrompt(enhancements: Enhancement[]): string {
  const changes = enhancements.map((e, i) => {
    switch (e.type) {
      case "color":
        return `${i + 1}. Change color from ${e.before} to ${e.after}: ${e.description}`;
      case "spacing":
        return `${i + 1}. Adjust spacing from ${e.before} to ${e.after}: ${e.description}`;
      case "typography":
        return `${i + 1}. Change typography from ${e.before} to ${e.after}: ${e.description}`;
      case "position":
        return `${i + 1}. Reposition: ${e.before} → ${e.after}: ${e.description}`;
      case "contrast":
        return `${i + 1}. Improve contrast from ${e.before} to ${e.after}: ${e.description}`;
      default:
        return `${i + 1}. ${e.description}`;
    }
  });

  return `You are a UI designer. Edit this UI screenshot by applying ONLY these specific changes:

${changes.join("\n")}

CRITICAL RULES:
- Keep everything else EXACTLY the same
- Do not add, remove, or rearrange any elements
- Only modify the specified areas
- Maintain the same resolution, aspect ratio, and overall layout
- The result should look like a real UI screenshot, not an illustration`;
}

export async function generateEnhancedImage(
  imageBase64: string,
  enhancements: Enhancement[],
): Promise<{ imageBase64: string; generationTime: number }> {
  const client = getClient();
  const prompt = buildPrompt(enhancements);
  const start = Date.now();

  const imageFile = await toFile(Buffer.from(imageBase64, "base64"), "input.png", { type: "image/png" });

  const response = await client.images.edit({
    model: "gpt-image-1",
    image: imageFile,
    prompt,
    n: 1,
    size: "1024x1024",
  });

  const generationTime = Date.now() - start;
  const outputBase64 = response.data?.[0]?.b64_json;

  if (!outputBase64) {
    throw new Error("No image returned from OpenAI");
  }

  return { imageBase64: outputBase64, generationTime };
}
