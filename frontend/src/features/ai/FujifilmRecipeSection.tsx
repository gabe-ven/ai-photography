import { Section } from "@/components/Section";
import type { FujifilmRecipe } from "@/types/analysis";

export function FujifilmRecipeSection({ recipe }: { recipe: FujifilmRecipe }) {
  const s = recipe.settings;
  const rows: Array<[string, string | number | null | undefined]> = [
    ["Grain", s?.grain],
    ["Color Chrome Effect", s?.color_chrome_effect],
    ["White Balance", s?.white_balance],
    ["Highlights", s?.highlights != null ? signed(s.highlights) : null],
    ["Shadows", s?.shadows != null ? signed(s.shadows) : null],
    ["Color", s?.color != null ? signed(s.color) : null],
    ["Sharpness", s?.sharpness != null ? signed(s.sharpness) : null],
    ["Noise Reduction", s?.noise_reduction != null ? signed(s.noise_reduction) : null],
  ];

  return (
    <Section number="04" title="FUJIFILM RECIPE">
      <div className="space-y-6">
        {recipe.film_simulation && (
          <p className="font-serif text-3xl italic text-heading">{recipe.film_simulation}</p>
        )}
        <div className="max-w-md divide-y divide-border">
          {rows.map(([label, value]) =>
            value != null ? (
              <div key={label} className="flex items-center justify-between py-3">
                <span className="font-mono text-xs uppercase tracking-wide text-muted">
                  {label}
                </span>
                <span className="font-mono text-sm font-medium text-heading">{value}</span>
              </div>
            ) : null,
          )}
        </div>
        {recipe.reasoning && (
          <p className="max-w-2xl text-sm italic leading-relaxed text-muted">
            {recipe.reasoning}
          </p>
        )}
      </div>
    </Section>
  );
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}
