import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

interface EdgeOverlayProps {
  imageUrl: string;
}

/**
 * Optional edge visualization. Computes a Sobel edge map from the *actual*
 * uploaded pixels (not fabricated) and paints it on a transparent canvas.
 * The canvas uses object-contain so it letterboxes identically to the photo.
 */
export function EdgeOverlay({ imageUrl }: EdgeOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      if (cancelled) return;
      // Cap working resolution for performance; aspect ratio preserved.
      const maxDim = 900;
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));

      const work = document.createElement("canvas");
      work.width = w;
      work.height = h;
      const wctx = work.getContext("2d", { willReadFrequently: true });
      const canvas = canvasRef.current;
      if (!wctx || !canvas) return;

      wctx.drawImage(img, 0, 0, w, h);
      const { data } = wctx.getImageData(0, 0, w, h);

      const gray = new Float32Array(w * h);
      for (let i = 0; i < w * h; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const out = ctx.createImageData(w, h);

      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          const gx =
            -gray[idx - w - 1] - 2 * gray[idx - 1] - gray[idx + w - 1] +
            gray[idx - w + 1] + 2 * gray[idx + 1] + gray[idx + w + 1];
          const gy =
            -gray[idx - w - 1] - 2 * gray[idx - w] - gray[idx - w + 1] +
            gray[idx + w - 1] + 2 * gray[idx + w] + gray[idx + w + 1];
          const mag = Math.min(255, Math.hypot(gx, gy));
          const o = idx * 4;
          out.data[o] = 52;
          out.data[o + 1] = 211;
          out.data[o + 2] = 153;
          out.data[o + 3] = mag > 60 ? mag : 0; // threshold; transparent elsewhere
        }
      }
      ctx.putImageData(out, 0, 0);
    };

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return (
    <motion.canvas
      ref={canvasRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.85 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="pointer-events-none absolute inset-0 h-full w-full object-contain"
    />
  );
}
