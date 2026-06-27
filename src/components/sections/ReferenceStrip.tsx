import { type Locale } from '@/lib/locales';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

export interface Ref {
  ad: string;
  logo?: unknown;
}

interface ReferenceStripProps {
  references: Ref[];
  locale: Locale;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ReferenceStrip({ references, locale }: ReferenceStripProps) {
  if (references.length === 0) return null;

  const label =
    locale === 'tr' ? 'Bize Güvenen Kurumlar' : 'Trusted By';

  return (
    <section className="py-14 bg-surface border-y border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-muted">
          {label}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {references.map((ref) => (
            <span
              key={ref.ad}
              className={cn(
                'inline-flex items-center rounded-full border border-border bg-background',
                'px-4 py-2 text-sm font-medium text-foreground/80',
                'transition-colors hover:border-primary/40 hover:text-foreground',
              )}
            >
              {ref.ad}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
