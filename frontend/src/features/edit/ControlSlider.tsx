interface ControlSliderProps {
  label: string;
  value: number;
  aiValue: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

export function ControlSlider({ label, value, aiValue, min, max, step, onChange }: ControlSliderProps) {
  const isDirty = value !== aiValue;
  const decimals = step < 1 ? 1 : 0;

  return (
    <div className="py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
          {label}
          {isDirty && (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Differs from AI suggestion" />
          )}
        </span>
        <span className="font-mono text-sm text-ink">{formatSigned(value, decimals)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-border accent-accent"
      />
    </div>
  );
}

function formatSigned(value: number, decimals: number): string {
  const rounded = Number(value.toFixed(decimals));
  const fixed = rounded.toFixed(decimals);
  return rounded > 0 ? `+${fixed}` : fixed;
}
