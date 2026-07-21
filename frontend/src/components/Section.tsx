import type { ReactNode } from "react";

interface SectionProps {
  /** Editorial section number, e.g. "01". */
  number: string;
  title: string;
  description?: string;
  /** Optional element rendered at the top-right (e.g. a status badge). */
  action?: ReactNode;
  children: ReactNode;
}

/**
 * A titled report section. Card-less by design — a thin hr plus a
 * number/title header on the page background. Only the content inside
 * (metric cards, InfoCards, etc.) is individually boxed.
 */
export function Section({ number, title, description, action, children }: SectionProps) {
  return (
    <section>
      <hr className="border-border" />
      <div className="mb-8 mt-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-muted">{number}</span>
          <span className="font-mono text-xs uppercase tracking-widest text-muted">
            {title}
          </span>
        </div>
        {action}
      </div>
      {description && (
        <p className="-mt-6 mb-8 max-w-2xl text-sm text-muted">{description}</p>
      )}
      {children}
    </section>
  );
}
