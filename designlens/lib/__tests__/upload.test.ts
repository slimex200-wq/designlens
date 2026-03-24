import { describe, it, expect } from "vitest";
import { validateFile } from "../upload";

function makeFile(name: string, type: string, sizeBytes: number): File {
  const buffer = new ArrayBuffer(sizeBytes);
  return new File([buffer], name, { type });
}

describe("validateFile", () => {
  it("accepts PNG files", () => {
    const file = makeFile("test.png", "image/png", 1024);
    expect(validateFile(file)).toBeNull();
  });

  it("accepts JPEG files", () => {
    const file = makeFile("test.jpg", "image/jpeg", 1024);
    expect(validateFile(file)).toBeNull();
  });

  it("accepts WebP files", () => {
    const file = makeFile("test.webp", "image/webp", 1024);
    expect(validateFile(file)).toBeNull();
  });

  it("rejects unsupported formats", () => {
    const file = makeFile("test.gif", "image/gif", 1024);
    const result = validateFile(file);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("format");
  });

  it("rejects SVG files", () => {
    const file = makeFile("test.svg", "image/svg+xml", 1024);
    const result = validateFile(file);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("format");
  });

  it("rejects files over 10MB", () => {
    const file = makeFile("big.png", "image/png", 11 * 1024 * 1024);
    const result = validateFile(file);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("size");
    expect(result!.message).toContain("10MB");
  });

  it("accepts files at exactly 10MB", () => {
    const file = makeFile("exact.png", "image/png", 10 * 1024 * 1024);
    expect(validateFile(file)).toBeNull();
  });

  it("format check runs before size check", () => {
    const file = makeFile("big.gif", "image/gif", 11 * 1024 * 1024);
    const result = validateFile(file);
    expect(result!.type).toBe("format");
  });
});
