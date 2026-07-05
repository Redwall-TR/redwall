import { type Locale } from '@/lib/locales';
import { mediaUrl } from '@/lib/cms/image';
import { LogoWall } from '@/components/ui';
import { referansHref } from '@/lib/references';
import { ACCENT } from '@/lib/theme';

// ── Types ────────────────────────────────────────────────────────────────────

export interface Ref {
  id: string;
  ad: string;
  slug?: string;
  logo?: unknown;
}

interface ReferenceStripProps {
  references: Ref[];
  counts: Record<string, number>;
  locale: Locale;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ReferenceStrip({ references, counts, locale }: ReferenceStripProps) {
  if (references.length === 0) return null;

  const isTr = locale === 'tr';
  const eyebrow = isTr ? 'Referanslar' : 'References';
  const baslik = isTr ? 'Bize Güvenen Kurumlar' : 'Trusted by Leading Organizations';

  const logos = references.map((ref) => ({
    ad: ref.ad,
    src: ref.logo ? mediaUrl(ref.logo) : undefined,
    href: referansHref({ id: ref.id, slug: ref.slug }, counts),
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
