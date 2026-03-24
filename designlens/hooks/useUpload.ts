"use client";

import { useCallback, useState } from "react";
import type { ReferenceImage, AnalysisResult, ColorInfo, ExtractedStyles, PageMetadata } from "@/lib/types";
import { validateFile } from "@/lib/upload";
import { hashFile } from "@/lib/hash";
import { extractColors } from "@/lib/colors";
import { getCachedAnalysis, setCachedAnalysis } from "@/lib/storage";
import { saveImage } from "@/lib/image-store";
import type { ToastType, ToastAction } from "@/components/ui/Toast";

interface UseUploadOptions {
  projectId: string;
  addReference: (projectId: string, ref: ReferenceImage) => void;
  updateReference: (
    projectId: string,
    refId: string,
    updater: (ref: ReferenceImage) => ReferenceImage
  ) => void;
  showToast?: (type: ToastType, message: string, action?: ToastAction) => void;
}

export function useUpload({ projectId, addReference, updateReference, showToast }: UseUploadOptions) {
  const [urlLoading, setUrlLoading] = useState(false);

  const handleUrlAnalysis = useCallback(
    async (url: string) => {
      setUrlLoading(true);
      const refId = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      let hostname = url;
      try {
        hostname = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
      } catch { /* use raw url */ }

      const ref: ReferenceImage = {
        id: refId,
        fileName: hostname,
        filePath: "",
        status: "processing",
        sourceUrl: url,
        uploadedAt: new Date().toISOString(),
      };
      addReference(projectId, ref);

      try {
        const res = await fetch("/api/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `Capture failed: ${res.status}`);
        }

        const data = await res.json() as {
          screenshot: string;
          extractedStyles: ExtractedStyles;
          metadata: PageMetadata;
          analysis: {
            typography: AnalysisResult["typography"];
            layout: AnalysisResult["layout"];
            tokens: AnalysisResult["tokens"];
            colors: ColorInfo[];
            aiAvailable: boolean;
          };
        };

        const analysis: AnalysisResult = {
          id: `analysis_${Date.now()}`,
          imageHash: url,
          fileName: hostname,
          colors: data.analysis.colors,
          typography: data.analysis.typography,
          layout: data.analysis.layout,
          tokens: data.analysis.tokens,
          aiAvailable: data.analysis.aiAvailable,
          createdAt: new Date().toISOString(),
        };

        updateReference(projectId, refId, (r) => ({
          ...r,
          status: "analyzed",
          filePath: data.screenshot,
          analysis,
          extractedStyles: data.extractedStyles,
          pageMetadata: data.metadata,
        }));
      } catch (err) {
        showToast?.(
          "error",
          err instanceof Error ? err.message : "URL capture failed",
        );
        updateReference(projectId, refId, (r) => ({
          ...r,
          status: "error",
          error: err instanceof Error ? err.message : "Capture failed",
        }));
      } finally {
        setUrlLoading(false);
      }
    },
    [projectId, addReference, updateReference, showToast],
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        // 1. Validate
        const error = validateFile(file);
        if (error) {
          showToast?.("error", `Upload rejected: ${error.message}`);
          console.warn(`Upload rejected: ${error.message}`);
          continue;
        }

        // 2. Create preview URL (blob for immediate display, replaced with data URL later)
        const previewUrl = URL.createObjectURL(file);
        const refId = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        // Convert to persistent data URL and save to IndexedDB
        fileToDataUrl(file).then((dataUrl) => {
          saveImage(refId, dataUrl).catch(() => {});
          updateReference(projectId, refId, (r) => ({
            ...r,
            filePath: dataUrl,
          }));
          URL.revokeObjectURL(previewUrl);
        });

        // 3. Add as processing
        const ref: ReferenceImage = {
          id: refId,
          fileName: file.name,
          filePath: previewUrl,
          status: "processing",
          uploadedAt: new Date().toISOString(),
        };
        addReference(projectId, ref);

        // 4. Process in background
        processFile(file, refId, projectId, updateReference, showToast).catch((err) => {
          console.error("Upload processing failed:", err);
          updateReference(projectId, refId, (r) => ({
            ...r,
            status: "error",
            error: err instanceof Error ? err.message : "Unknown error",
          }));
        });
      }
    },
    [projectId, addReference, updateReference, showToast]
  );

  return { handleFiles, handleUrlAnalysis, urlLoading };
}

async function processFile(
  file: File,
  refId: string,
  projectId: string,
  updateReference: UseUploadOptions["updateReference"],
  showToast?: UseUploadOptions["showToast"]
) {
  // Hash file and check cache
  const fileHash = await hashFile(file);
  const cached = getCachedAnalysis(fileHash);
  if (cached) {
    updateReference(projectId, refId, (r) => ({
      ...r,
      status: "analyzed",
      analysis: cached,
    }));
    return;
  }

  // Extract colors from canvas
  let algorithmicColors: ColorInfo[] = [];
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    algorithmicColors = extractColors(imageData.data, bitmap.width, bitmap.height);
    bitmap.close();
  } catch (err) {
    console.warn("Color extraction failed:", err);
  }

  // Call AI analysis API
  try {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("/api/analyze", { method: "POST", body: formData });
    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const aiResult = await res.json();

    // Merge algorithmic colors with AI results
    const mergedColors =
      algorithmicColors.length > 0 ? algorithmicColors : aiResult.colors ?? [];

    const aiAvailable = aiResult.aiAvailable !== false;

    const analysis: AnalysisResult = {
      id: `analysis_${Date.now()}`,
      imageHash: fileHash,
      fileName: file.name,
      colors: mergedColors,
      typography: aiResult.typography ?? [],
      layout: aiResult.layout ?? { type: "unknown", spacing: {}, grid: "" },
      tokens: aiResult.tokens ?? { colors: {}, spacing: {}, radius: {}, typography: [] },
      aiAvailable,
      createdAt: new Date().toISOString(),
    };

    if (!aiAvailable) {
      showToast?.(
        "error",
        "AI analysis unavailable — showing color extraction only.",
        { label: "Retry", onClick: () => processFile(file, refId, projectId, updateReference, showToast) }
      );
    }

    const saved = setCachedAnalysis(fileHash, analysis);
    if (!saved) {
      showToast?.(
        "error",
        "Storage full — analysis won't be cached. Clear old projects to free space."
      );
    }

    updateReference(projectId, refId, (r) => ({
      ...r,
      status: "analyzed",
      analysis,
    }));
  } catch (err) {
    // If AI fails, still save algorithmic colors as partial result
    if (algorithmicColors.length > 0) {
      const partialAnalysis: AnalysisResult = {
        id: `analysis_${Date.now()}`,
        imageHash: fileHash,
        fileName: file.name,
        colors: algorithmicColors,
        typography: [],
        layout: { type: "unknown", spacing: {}, grid: "" },
        tokens: {
          colors: Object.fromEntries(
            algorithmicColors.map((c) => [`--${c.role}`, c.hex])
          ),
          spacing: {},
          radius: {},
          typography: [],
        },
        aiAvailable: false,
        createdAt: new Date().toISOString(),
      };

      showToast?.(
        "error",
        "AI analysis failed — showing color extraction only.",
        { label: "Retry", onClick: () => processFile(file, refId, projectId, updateReference, showToast) }
      );

      const saved = setCachedAnalysis(fileHash, partialAnalysis);
      if (!saved) {
        showToast?.(
          "error",
          "Storage full — partial analysis won't be cached."
        );
      }

      updateReference(projectId, refId, (r) => ({
        ...r,
        status: "analyzed",
        analysis: partialAnalysis,
      }));
    } else {
      const isNetworkError =
        err instanceof TypeError && err.message === "Failed to fetch";
      showToast?.(
        "error",
        isNetworkError
          ? "Network error — could not reach analysis API."
          : `Analysis failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        isNetworkError
          ? {
              label: "Retry",
              onClick: () =>
                processFile(file, refId, projectId, updateReference, showToast),
            }
          : undefined
      );
      updateReference(projectId, refId, (r) => ({
        ...r,
        status: "error",
        error: err instanceof Error ? err.message : "Analysis failed",
      }));
    }
  }
}

/** Convert file to data URL without resizing — IndexedDB has no size limit. */
async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
