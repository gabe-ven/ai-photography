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
    <div
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
      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
        dragging
          ? "border-emerald-400 bg-emerald-400/5"
          : "border-neutral-700 hover:border-neutral-500 hover:bg-neutral-900"
      }`}
    >
      <div className="text-5xl">📷</div>
      <p className="text-lg font-medium text-neutral-100">
        Drop a photo here, or click to browse
      </p>
      <p className="text-sm text-neutral-500">
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
    </div>
  );
}
