import type { AnalysisResponse } from "@/types/analysis";

export const MAX_UPLOAD_MB = 25;
export const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
  "image/bmp",
];

export class ApiError extends Error {}

/** Client-side guardrails that mirror the backend's validation. */
export function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Unsupported file type. Use JPEG, PNG, WEBP, TIFF, or BMP.";
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return `Image is larger than the ${MAX_UPLOAD_MB}MB limit.`;
  }
  return null;
}

export async function analyzeImage(file: File): Promise<AnalysisResponse> {
  const body = new FormData();
  body.append("file", file);

  const res = await fetch("/api/analyze", { method: "POST", body });

  if (!res.ok) {
    let detail = `Request failed (${res.status}).`;
    try {
      const data = await res.json();
      if (data?.detail) detail = data.detail;
    } catch {
      // response had no JSON body; keep the default message
    }
    throw new ApiError(detail);
  }

  return res.json();
}
