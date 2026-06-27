import { type Locale } from '@/lib/locales';
import { urlFor } from '@/sanity/lib/image';
import { LogoWall } from '@/components/ui';

// ── Types ────────────────────────────────────────────────────────────────────

export interface Ref {
  ad: string;
  logo?: unknown;
}

interface ReferenceStripProps {
  references: Ref[];
  locale: Locale;
}

const ACCENT = '#e63950';

// ── Component ────────────────────────────────────────────────────────────────

export default function ReferenceStrip({ references, locale }: ReferenceStripProps) {
  if (references.length === 0) return null;

  const isTr = locale === 'tr';
  const eyebrow = isTr ? 'Referanslar' : 'References';
  const baslik = isTr ? 'Bize Güvenen Kurumlar' : 'Trusted by Leading Organizations';

  const logos = references.map((ref) => ({
    ad: ref.ad,
    src: ref.logo
      ? urlFor(ref.logo as Parameters<typeof urlFor>[0]).width(240).height(120).fit('max').url()
      : undefined,
  }));

  return (
    <section className="border-y border-border bg-surface py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <div className="mb-3 flex items-center justify-center gap-3">
            <span className="h-px w-8" style={{ backgroundColor: ACCENT }} aria-hidden />
            <span
              className="text-xs font-semibold uppercase tracking-[0.22em]"
              style={{ color: ACCENT }}
            >
              {eyebrow}
            </span>
            <span className="h-px w-8" style={{ backgroundColor: ACCENT }} aria-hidden />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">{baslik}</h2>
        </div>

        <LogoWall logos={logos} />
      </div>
    </section>
  );
}
