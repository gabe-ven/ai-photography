import { animate, motion, useMotionValue } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import type { OverlayToggles } from "@/components/composition/CompositionOverlay";
import { CompositionOverlayLayers } from "@/components/composition/CompositionOverlayLayers";
import { CompositionToggles } from "@/components/composition/CompositionToggles";
import { PhotoSkeleton } from "@/components/Shimmer";
import { CARD_SPRING } from "@/lib/motionVariants";
import type { CompositionInfo, ExifInfo, FujifilmRecipe } from "@/types/analysis";

const PHOTO_ENTRANCE_SPRING = { type: "spring" as const, stiffness: 150, damping: 22 };
const ARROW_SPRING = { type: "spring" as const, stiffness: 500, damping: 30 };

interface Dimensions {
  width: number;
  height: number;
}

interface PhotographSectionProps {
  file: File;
  previewUrl: string | null;
  exif: ExifInfo | null;
  composition: CompositionInfo | null;
  /** Fujifilm film-recipe, when the AI deemed one applicable (Fuji bodies). */
  recipe: FujifilmRecipe | null;
  canEdit: boolean;
  onChooseAnother: () => void;
  onEditPhoto: () => void;
}

/** Section 1 of the results report — the full-width photo, its one-line EXIF
 * summary, live composition-overlay toggles drawn directly on the photo, and
 * the choose-another/edit actions. */
export function PhotographSection({
  file,
  previewUrl,
  exif,
  composition,
  recipe,
  canEdit,
  onChooseAnother,
  onEditPhoto,
}: PhotographSectionProps) {
  const [dims, setDims] = useState<Dimensions | null>(null);
  const [introPlayed, setIntroPlayed] = useState(false);
  const linesAvailable = composition ? composition.leading_lines.lines.length > 0 : false;
  const horizonAvailable = composition ? composition.horizon.horizon_detected : false;

  const [toggles, setToggles] = useState<OverlayToggles>({
    thirds: true,
    subject: true,
    lines: linesAvailable,
    horizon: horizonAvailable,
    edges: false,
  });

  // Reset overlay defaults whenever a new analysis arrives.
  useEffect(() => {
    setToggles({
      thirds: true,
      subject: true,
      lines: linesAvailable,
      horizon: horizonAvailable,
      edges: false,
    });
  }, [composition, linesAvailable, horizonAvailable]);

  // Stagger the overlay reveal on the photo's first paint only ("drawn on after
  // the photo appears"). Once the intro window passes, delays reset to 0 so
  // live user toggles stay instant. Tied to `dims` so it starts when the photo
  // has actually loaded, not just when the component mounted.
  useEffect(() => {
    if (!dims) return;
    setIntroPlayed(false);
    const id = setTimeout(() => setIntroPlayed(true), 1400);
    return () => clearTimeout(id);
  }, [dims]);

  const handleLoad = useCallback((width: number, height: number) => {
    setDims({ width, height });
  }, []);

  const toggle = (key: keyof OverlayToggles) =>
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  const exifRows: Array<[string, string | null]> = exif
    ? [
        ["Focal length", exif.focal_length],
        ["Aperture", exif.aperture],
        ["Shutter", exif.shutter_speed],
        ["ISO", exif.iso != null ? String(exif.iso) : null],
      ]
    : [];

  const rs = recipe?.settings;
  const recipeRows: Array<[string, string]> = rs
    ? ([
        ["Grain", rs.grain],
        ["Color Chrome", rs.color_chrome_effect],
        ["White Balance", rs.white_balance],
        ["Highlights", rs.highlights != null ? signed(rs.highlights) : null],
        ["Shadows", rs.shadows != null ? signed(rs.shadows) : null],
        ["Color", rs.color != null ? signed(rs.color) : null],
        ["Sharpness", rs.sharpness != null ? signed(rs.sharpness) : null],
        ["Noise Reduction", rs.noise_reduction != null ? signed(rs.noise_reduction) : null],
      ].filter((row): row is [string, string] => row[1] != null))
    : [];

  return (
    <div className="flex flex-col gap-8">
      <hr className="relative left-1/2 w-screen -translate-x-1/2" />

      <div className="grid grid-cols-5 items-start gap-8">
        {/* Photo — left, dominant */}
        <div className="col-span-3">
          <div className="relative w-full overflow-hidden bg-bg">
            {previewUrl ? (
              <motion.img
                layoutId="photo-preview"
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ layout: CARD_SPRING, default: PHOTO_ENTRANCE_SPRING }}
                src={previewUrl}
                alt={file.name}
                draggable={false}
                onLoad={(e) =>
                  handleLoad(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)
                }
                className="block w-full select-none object-contain"
              />
            ) : (
              <PhotoSkeleton className="aspect-[3/2] w-full" />
            )}

            {composition && previewUrl && (
              <CompositionOverlayLayers
                imageUrl={previewUrl}
                composition={composition}
                toggles={toggles}
                dims={dims}
                staggerReveal={!introPlayed}
              />
            )}
          </div>
        </div>

        {/* Info — right */}
        <div className="col-span-2 flex flex-col">
          <h2 className="font-display text-2xl text-text">{cameraName(exif, file.name)}</h2>

          {exif?.has_exif && (
            <dl className="mt-4">
              {exifRows.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between border-b border-border py-2"
                >
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-subtle">
                    {label}
                  </dt>
                  <dd className="font-mono text-base text-text">{value ?? "—"}</dd>
                </div>
              ))}
            </dl>
          )}

          {recipe && (recipe.film_simulation || recipeRows.length > 0) && (
            <>
              <hr className="my-6" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-subtle">
                Fujifilm recipe
              </p>
              {recipe.film_simulation && (
                <p className="mt-2 font-mono text-base text-text">{recipe.film_simulation}</p>
              )}
              {recipeRows.length > 0 && (
                <dl className="mt-3">
                  {recipeRows.map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-4 border-b border-border py-2"
                    >
                      <dt className="font-mono text-[10px] uppercase tracking-widest text-subtle">
                        {label}
                      </dt>
                      <dd className="text-right font-mono text-sm text-text">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {recipe.reasoning && (
                <p className="mt-3 text-xs italic leading-relaxed text-muted">{recipe.reasoning}</p>
              )}
            </>
          )}

          {composition && (
            <>
              <hr className="my-6" />
              <CompositionToggles
                variant="rows"
                toggles={toggles}
                onToggle={toggle}
                linesAvailable={linesAvailable}
                horizonAvailable={horizonAvailable}
              />
            </>
          )}

          <hr className="my-6" />
          <div className="flex items-center gap-4">
            <button
              onClick={onChooseAnother}
              className="font-mono text-xs font-medium uppercase tracking-widest text-muted transition-colors hover:text-text"
            >
              Choose another
            </button>
            {canEdit && (
              <>
                <span className="text-border">|</span>
                <EditPhotoLink onClick={onEditPhoto} />
              </>
            )}
          </div>
        </div>
      </div>

      <hr className="relative left-1/2 w-screen -translate-x-1/2" />
    </div>
  );
}

function EditPhotoLink({ onClick }: { onClick: () => void }) {
  const arrowX = useMotionValue(0);

  return (
    <motion.button
      onClick={onClick}
      onHoverStart={() => animate(arrowX, 6, ARROW_SPRING)}
      onHoverEnd={() => animate(arrowX, 0, ARROW_SPRING)}
      className="font-mono text-xs font-medium uppercase tracking-widest text-muted transition-colors hover:text-text"
    >
      Edit photo{" "}
      <motion.span className="inline-block" style={{ x: arrowX }}>
        →
      </motion.span>
    </motion.button>
  );
}

/** Camera make + model for the info column heading, e.g. "FUJIFILM X-T30 III".
 * Falls back to the filename when there's no EXIF. */
function cameraName(exif: ExifInfo | null, filename: string): string {
  if (!exif || !exif.has_exif) return filename;
  const name = [exif.make, exif.model].filter(Boolean).join(" ").trim();
  return name || filename;
}

/** Fujifilm recipe adjustments are signed values, e.g. "+2" / "-1". */
function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}
