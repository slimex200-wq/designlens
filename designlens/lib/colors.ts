import type { ColorInfo } from "./types";

type RGB = [number, number, number];

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}

function colorDistance(a: RGB, b: RGB): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function classifyRole(_hex: string, rgb: RGB, rank: number, totalPixels: number, count: number): string {
  const luminance = getLuminance(rgb[0], rgb[1], rgb[2]);
  const percentage = (count / totalPixels) * 100;

  if (percentage > 30 && luminance < 0.1) return "background";
  if (percentage > 30 && luminance > 0.8) return "background";
  if (rank === 0) return "background";
  if (luminance > 0.7 && percentage > 10) return "text";
  if (luminance < 0.15 && percentage > 10) return "text";
  if (percentage < 10 && percentage > 2) return "accent";
  if (percentage <= 2) return "border";
  return "secondary";
}

export function extractColors(imageData: Uint8ClampedArray, width: number, height: number): ColorInfo[] {
  const sampleStep = Math.max(1, Math.floor((width * height) / 50000));
  const colorCounts = new Map<string, { rgb: RGB; count: number }>();

  for (let i = 0; i < imageData.length; i += 4 * sampleStep) {
    const r = Math.min(255, Math.round(imageData[i] / 8) * 8);
    const g = Math.min(255, Math.round(imageData[i + 1] / 8) * 8);
    const b = Math.min(255, Math.round(imageData[i + 2] / 8) * 8);
    const key = `${r},${g},${b}`;
    const existing = colorCounts.get(key);
    if (existing) { existing.count++; } else { colorCounts.set(key, { rgb: [r, g, b], count: 1 }); }
  }

  const sorted = Array.from(colorCounts.values()).sort((a, b) => b.count - a.count);
  const merged: Array<{ rgb: RGB; count: number }> = [];
  for (const color of sorted) {
    const similar = merged.find((m) => colorDistance(m.rgb, color.rgb) < 30);
    if (similar) { similar.count += color.count; } else { merged.push({ ...color }); }
    if (merged.length >= 20) break;
  }

  merged.sort((a, b) => b.count - a.count);
  const totalSampled = merged.reduce((sum, c) => sum + c.count, 0);
  const top = merged.slice(0, 8);

  return top.map((c, i) => ({
    hex: rgbToHex(c.rgb[0], c.rgb[1], c.rgb[2]),
    role: classifyRole(rgbToHex(c.rgb[0], c.rgb[1], c.rgb[2]), c.rgb, i, totalSampled, c.count),
    percentage: Math.round((c.count / totalSampled) * 100),
  }));
}
