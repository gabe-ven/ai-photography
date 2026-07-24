import { memo, useCallback, useState } from "react";
import type { CompositionInfo } from "@/types/analysis";
import { CompositionOverlayLayers } from "./CompositionOverlayLayers";

export interface OverlayToggles {
  thirds: boolean;
  subject: boolean;
  lines: boolean;
  horizon: boolean;
  edges: boolean;
}

interface CompositionOverlayProps {
  imageUrl: string;
  composition: CompositionInfo;
  toggles: OverlayToggles;
}

interface Dimensions {
  width: number;
  height: number;
}

/**
 * Renders the photo with toggleable annotation layers on top. The photo is a
 * memoized layer keyed only on its URL, so toggling overlays never re-renders
 * or reloads the image.
 */
export function CompositionOverlay({
  imageUrl,
  composition,
  toggles,
}: CompositionOverlayProps) {
  const [dims, setDims] = useState<Dimensions | null>(null);

  const handleLoad = useCallback((width: number, height: number) => {
    setDims({ width, height });
  }, []);

  return (
    <div className="relative w-full overflow-hidden bg-bg">
      <PhotoLayer imageUrl={imageUrl} onLoad={handleLoad} />
      <CompositionOverlayLayers
        imageUrl={imageUrl}
        composition={composition}
        toggles={toggles}
        dims={dims}
      />
    </div>
  );
}

const PhotoLayer = memo(function PhotoLayer({
  imageUrl,
  onLoad,
}: {
  imageUrl: string;
  onLoad: (width: number, height: number) => void;
}) {
  return (
    <img
      src={imageUrl}
      alt="Analyzed photograph"
      draggable={false}
      onLoad={(e) =>
        onLoad(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)
      }
      className="block max-h-[700px] w-full select-none object-contain"
    />
  );
});
