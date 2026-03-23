const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_RESOLUTION = 4096;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export type UploadError = {
  type: "size" | "resolution" | "format";
  message: string;
};

export function validateFile(file: File): UploadError | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return { type: "format", message: "Unsupported format. Use PNG, JPG, or WebP." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { type: "size", message: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.` };
  }
  return null;
}

export async function validateResolution(file: File): Promise<UploadError | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      if (img.width > MAX_RESOLUTION || img.height > MAX_RESOLUTION) {
        resolve({ type: "resolution", message: `Image too large (${img.width}x${img.height}). Max ${MAX_RESOLUTION}x${MAX_RESOLUTION}.` });
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
}
