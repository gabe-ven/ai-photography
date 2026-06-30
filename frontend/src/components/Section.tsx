import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  description?: string;
  /** Optional element rendered at the top-right (e.g. a status badge). */
  action?: ReactNode;
  children: ReactNode;
}

/**
 * A titled report section. The analysis report is a vertical stack of these,
 * so future panels (Composition, Lighting, AI Critique) drop in as siblings
 * without touching existing layout.
 */
export function Section({ title, description, action, children }: SectionProps) {
  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-5">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-100">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-neutral-500">{description}</p>
          )}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
