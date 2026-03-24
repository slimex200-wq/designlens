import { describe, it, expect } from "vitest";
import { extractColors } from "../colors";

function makeImageData(pixels: Array<[number, number, number]>): {
  data: Uint8ClampedArray;
  width: number;
  height: number;
} {
  const data = new Uint8ClampedArray(pixels.length * 4);
  for (let i = 0; i < pixels.length; i++) {
    data[i * 4] = pixels[i][0];
    data[i * 4 + 1] = pixels[i][1];
    data[i * 4 + 2] = pixels[i][2];
    data[i * 4 + 3] = 255;
  }
  return { data, width: pixels.length, height: 1 };
}

describe("extractColors", () => {
  it("returns an array of ColorInfo objects", () => {
    const pixels: Array<[number, number, number]> = Array(100).fill([10, 10, 10]);
    const { data, width, height } = makeImageData(pixels);
    const result = extractColors(data, width, height);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("hex");
    expect(result[0]).toHaveProperty("role");
    expect(result[0]).toHaveProperty("percentage");
  });

  it("returns hex strings in correct format", () => {
    const pixels: Array<[number, number, number]> = Array(100).fill([255, 0, 0]);
    const { data, width, height } = makeImageData(pixels);
    const result = extractColors(data, width, height);

    for (const color of result) {
      expect(color.hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("percentage values sum to approximately 100", () => {
    const pixels: Array<[number, number, number]> = [
      ...Array(70).fill([0, 0, 0] as [number, number, number]),
      ...Array(30).fill([255, 255, 255] as [number, number, number]),
    ];
    const { data, width, height } = makeImageData(pixels);
    const result = extractColors(data, width, height);
    const totalPct = result.reduce((sum, c) => sum + c.percentage, 0);

    expect(totalPct).toBeGreaterThanOrEqual(95);
    expect(totalPct).toBeLessThanOrEqual(105);
  });

  it("dominant color appears first", () => {
    const pixels: Array<[number, number, number]> = [
      ...Array(80).fill([0, 0, 0] as [number, number, number]),
      ...Array(20).fill([255, 0, 0] as [number, number, number]),
    ];
    const { data, width, height } = makeImageData(pixels);
    const result = extractColors(data, width, height);

    expect(result[0].percentage).toBeGreaterThan(result[result.length - 1].percentage);
  });

  it("classifies dark dominant color as background", () => {
    const pixels: Array<[number, number, number]> = [
      ...Array(80).fill([10, 10, 10] as [number, number, number]),
      ...Array(20).fill([200, 50, 50] as [number, number, number]),
    ];
    const { data, width, height } = makeImageData(pixels);
    const result = extractColors(data, width, height);

    expect(result[0].role).toBe("background");
  });

  it("returns at most 8 colors", () => {
    const colors: Array<[number, number, number]> = [];
    for (let i = 0; i < 20; i++) {
      colors.push(...Array(10).fill([i * 13, i * 7, i * 11] as [number, number, number]));
    }
    const { data, width, height } = makeImageData(colors);
    const result = extractColors(data, width, height);

    expect(result.length).toBeLessThanOrEqual(8);
  });

  it("handles single-color image", () => {
    const pixels: Array<[number, number, number]> = Array(50).fill([128, 128, 128]);
    const { data, width, height } = makeImageData(pixels);
    const result = extractColors(data, width, height);

    expect(result.length).toBe(1);
    expect(result[0].percentage).toBe(100);
  });

  it("merges similar colors within distance threshold", () => {
    const pixels: Array<[number, number, number]> = [
      ...Array(50).fill([100, 100, 100] as [number, number, number]),
      ...Array(50).fill([102, 102, 102] as [number, number, number]),
    ];
    const { data, width, height } = makeImageData(pixels);
    const result = extractColors(data, width, height);

    // Colors within distance 30 should be merged
    expect(result.length).toBe(1);
  });
});
