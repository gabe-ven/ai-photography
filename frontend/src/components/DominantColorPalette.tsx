import type { ColorSwatch } from "@/types/analysis";

interface DominantColorPaletteProps {
  colors: ColorSwatch[];
}

export function DominantColorPalette({ colors }: DominantColorPaletteProps) {
  if (colors.length === 0) {
    return <p className="text-sm text-neutral-500">No colors detected.</p>;
  }

  return (
    <div>
      <div className="flex h-10 w-full overflow-hidden rounded-lg ring-1 ring-white/10">
        {colors.map((color, index) => (
          <div
            key={`${color.hex}-${index}`}
            title={`${color.hex} · ${Math.round(color.proportion * 100)}%`}
            style={{
              width: `${color.proportion * 100}%`,
              backgroundColor: color.hex,
            }}
          />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {colors.map((color, index) => (
          <li
            key={`${color.hex}-legend-${index}`}
            className="flex items-center gap-2 text-xs"
          >
            <span
              className="h-4 w-4 shrink-0 rounded ring-1 ring-white/10"
              style={{ backgroundColor: color.hex }}
            />
            <span className="font-mono uppercase text-neutral-300">{color.hex}</span>
            <span className="text-neutral-500">
              {Math.round(color.proportion * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
