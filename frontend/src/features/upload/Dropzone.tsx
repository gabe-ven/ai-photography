import { motion } from "framer-motion";
import { useRef, useState, type DragEvent } from "react";
import { ACCEPTED_TYPES, MAX_UPLOAD_MB } from "@/lib/api";

interface DropzoneProps {
  onFile: (file: File) => void;
}

export function Dropzone({ onFile }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      animate={{
        scale: dragging ? 1.015 : 1,
        borderColor: dragging ? "#0a0a08" : "#e8e8e4",
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="flex cursor-pointer flex-col items-center justify-center gap-3 border border-dashed p-16 text-center hover:border-heading/40"
    >
      <p className="font-mono text-sm text-muted">
        Drop a photograph here — or click to browse
      </p>
      <p className="font-mono text-xs text-muted">
        JPEG, PNG, WEBP, TIFF or BMP · up to {MAX_UPLOAD_MB}MB
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </motion.div>
  );
}
