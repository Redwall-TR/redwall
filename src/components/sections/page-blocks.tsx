import type { CSSProperties, ReactNode } from 'react';
import { ServiceIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

// Shared sub-page building blocks. Callers pass already-localized strings and a
// fixed hex `accent` (each page carries its own signature color). Keeping these
// in one place makes every sub-page read as one designed family.

export function SectionHeading({
  eyebrow,
  title,
  description,
  accent,
  align = 'left',
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  accent: string;
  align?: 'left' | 'center';
}) {
  const centered = align === 'center';
  return (
    <div className={cn('mb-12 max-w-2xl', centered && 'mx-auto text-center')}>
      {eyebrow && (
        <div className={cn('mb-3 flex items-center gap-3', centered && 'justify-center')}>
          <span className="h-px w-8" style={{ backgroundColor: accent }} />
          <span
            className="text-xs font-semibold uppercase tracking-[0.22em]"
            style={{ color: accent }}
          >
            {eyebrow}
          </span>
        </div>
      )}
      <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-muted">{description}</p>}
    </div>
  );
}

export function FeatureCard({
  icon,
  title,
  description,
  accent,
}: {
  icon?: string;
  title: string;
  description: ReactNode;
  accent: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-7 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
      <span
        className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-200 group-hover:scale-x-100"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      {icon && (
        <div
          className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}14`, color: accent } as CSSProperties}
        >
          <ServiceIcon name={icon} className="h-6 w-6" />
        </div>
      )}
      <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
      <div className="mt-2.5 text-sm leading-relaxed text-muted">{description}</div>
    </div>
  );
}

export function ProcessTimeline({
  steps,
  accent,
}: {
  steps: { num: number; title: string; description: ReactNode }[];
  accent: string;
}) {
  return (
    <ol className="relative mx-auto max-w-3xl">
      <span className="absolute bottom-6 left-[23px] top-6 w-px bg-border" aria-hidden />
      {steps.map((s) => (
        <li key={s.num} className="relative flex gap-6 pb-10 last:pb-0">
          <span
            className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 bg-background font-display text-sm font-bold"
            style={{ borderColor: accent, color: accent } as CSSProperties}
          >
            {String(s.num).padStart(2, '0')}
          </span>
          <div className="pt-1.5">
            <h3 className="font-display text-base font-bold text-foreground">{s.title}</h3>
            <div className="mt-1.5 text-sm leading-relaxed text-muted">{s.description}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function IntroLead({
  lead,
  body,
  accent,
  children,
}: {
  lead: ReactNode;
  body?: ReactNode[];
  accent: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl">
      <div
        className="border-l-2 pl-6 font-display text-xl font-medium leading-snug text-foreground sm:text-2xl"
        style={{ borderColor: accent }}
      >
        {lead}
      </div>
      {body?.map((p, i) => (
        <div key={i} className="mt-6 max-w-3xl text-base leading-relaxed text-muted">
          {p}
        </div>
      ))}
      {children}
    </div>
  );
}
