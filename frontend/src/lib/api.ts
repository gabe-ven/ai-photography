import type { AnalysisResponse, AIAnalysisResponse } from "@/types/analysis";

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

async function postForm<T>(endpoint: string, body: FormData): Promise<T> {
  const res = await fetch(endpoint, { method: "POST", body });

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

export async function analyzeImage(file: File): Promise<AnalysisResponse> {
  const body = new FormData();
  body.append("file", file);
  return postForm<AnalysisResponse>("/api/analyze", body);
}

/**
 * Request the AI critique. Runs separately from analyzeImage so the fast CV
 * metrics can render first; the prior analysis is passed as `context` so the
 * model reasons from the already-computed measurements.
 */
export async function generateAIAnalysis(
  file: File,
  context?: AnalysisResponse | null,
): Promise<AIAnalysisResponse> {
  const body = new FormData();
  body.append("file", file);
  if (context) body.append("context", JSON.stringify(context));
  return postForm<AIAnalysisResponse>("/api/ai-analysis", body);
}
