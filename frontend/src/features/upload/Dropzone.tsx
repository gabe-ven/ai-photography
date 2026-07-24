import { motion } from "framer-motion";
import { useRef, useState, type DragEvent } from "react";
import { ACCEPTED_TYPES } from "@/lib/api";

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
        borderColor: dragging ? "#0a0a0a" : "#e0e0e0",
      }}
      exit={{ opacity: 0, scale: 0.96, y: -8 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="flex min-h-[200px] cursor-pointer flex-col items-start justify-center gap-2 border bg-bg-off p-16 text-left"
    >
      <p className="font-display text-xl italic text-muted">Drop a photograph here</p>
      <p className="font-mono text-xs text-subtle">or click to browse</p>
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
