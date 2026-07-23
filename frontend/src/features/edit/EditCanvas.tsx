import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { processImageData } from "./imageProcessing";
import type { GradingAdjustments } from "@/types/analysis";

// Matches the backend's VLM_MAX_EDGE convention for "sharp enough, fast
// enough" — capping preview resolution keeps per-frame reprocessing cheap
// while dragging sliders.
const PREVIEW_MAX_EDGE = 1024;

export interface EditCanvasHandle {
  exportJPEG: () => Promise<Blob | null>;
}

interface EditCanvasProps {
  imageUrl: string;
  adjustments: GradingAdjustments;
}

export const EditCanvas = forwardRef<EditCanvasHandle, EditCanvasProps>(function EditCanvas(
  { imageUrl, adjustments },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const sourceDataRef = useRef<ImageData | null>(null);
  const adjustmentsRef = useRef(adjustments);
  const rafRef = useRef<number | null>(null);

  adjustmentsRef.current = adjustments;

  function render() {
    const canvas = canvasRef.current;
    const source = sourceDataRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !source || !ctx) return;
    ctx.putImageData(processImageData(source, adjustmentsRef.current), 0, 0);
  }

  // Load the image once per URL, draw the capped-resolution preview source
  // into an offscreen buffer.
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      imageRef.current = img;

      const scale = Math.min(1, PREVIEW_MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
      const width = Math.round(img.naturalWidth * scale);
      const height = Math.round(img.naturalHeight * scale);

      const offscreen = document.createElement("canvas");
      offscreen.width = width;
      offscreen.height = height;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return;
      offCtx.drawImage(img, 0, 0, width, height);
      sourceDataRef.current = offCtx.getImageData(0, 0, width, height);

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }
      render();
    };
    img.src = imageUrl;
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  // Redraw on adjustment change, batched to one paint per frame so
  // dragging a slider stays smooth.
  useEffect(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(render);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjustments]);

  useImperativeHandle(
    ref,
    () => ({
      exportJPEG: async () => {
        const img = imageRef.current;
        if (!img) return null;

        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(img, 0, 0);
        const fullData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        ctx.putImageData(processImageData(fullData, adjustmentsRef.current), 0, 0);

        return new Promise((resolve) => {
          canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
        });
      },
    }),
    [],
  );

  return <canvas ref={canvasRef} className="block max-h-[520px] w-auto max-w-full" />;
});
