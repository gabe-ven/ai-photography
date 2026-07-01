import { motion } from "framer-motion";
import type { BoundingBox, Point } from "@/types/analysis";

interface SubjectMarkerProps {
  width: number;
  height: number;
  centroid: Point;
  /** Detector bounding box (normalized). Drawn when present. */
  bbox?: BoundingBox | null;
  /** Detected subject label, shown beside the box when available. */
  label?: string | null;
}

/**
 * Crosshair marker at the estimated subject centroid. When the subject came
 * from the detector (bbox present), its bounding box is drawn too.
 */
export function SubjectMarker({
  width,
  height,
  centroid,
  bbox,
  label,
}: SubjectMarkerProps) {
  const cx = centroid.x * width;
  const cy = centroid.y * height;
  const r = Math.max(width, height) / 45;
  const stroke = Math.max(width, height) / 320;
  const tick = r * 1.8;

  const box = bbox
    ? {
        x: bbox.x0 * width,
        y: bbox.y0 * height,
        w: (bbox.x1 - bbox.x0) * width,
        h: (bbox.y1 - bbox.y0) * height,
      }
    : null;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    >
      {box && (
        <>
          <rect
            x={box.x}
            y={box.y}
            width={box.w}
            height={box.h}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={stroke}
            strokeDasharray={`${tick} ${tick * 0.6}`}
            rx={r * 0.4}
          />
          {label && (
            <text
              x={box.x + stroke * 2}
              y={Math.max(box.y - stroke * 2, r)}
              fill="#f59e0b"
              fontSize={r * 1.1}
              fontWeight={600}
            >
              {label}
            </text>
          )}
        </>
      )}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f59e0b" strokeWidth={stroke} />
      <circle cx={cx} cy={cy} r={stroke * 1.5} fill="#f59e0b" />
      <line x1={cx - tick} y1={cy} x2={cx - r} y2={cy} stroke="#f59e0b" strokeWidth={stroke} />
      <line x1={cx + r} y1={cy} x2={cx + tick} y2={cy} stroke="#f59e0b" strokeWidth={stroke} />
      <line x1={cx} y1={cy - tick} x2={cx} y2={cy - r} stroke="#f59e0b" strokeWidth={stroke} />
      <line x1={cx} y1={cy + r} x2={cx} y2={cy + tick} stroke="#f59e0b" strokeWidth={stroke} />
    </motion.g>
  );
}
