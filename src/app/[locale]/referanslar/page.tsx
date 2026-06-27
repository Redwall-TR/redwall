import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { sanityFetch } from '@/sanity/lib/fetch';
import { REFERENCES_QUERY } from '@/sanity/lib/queries';
import { urlFor } from '@/sanity/lib/image';
import { isLocale, pick, type Locale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { Section, LogoWall, Cta } from '@/components/ui';
import { PageHero } from '@/components/sections/PageHero';
import { ServiceIcon } from '@/components/ui/icons';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Reference {
  ad: string;
  logo?: unknown;
  gorus?: {
    metin: { tr: string; en: string };
    kisi: string;
    unvan: { tr: string; en: string };
  };
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = !isLocale(locale) || locale === 'tr';
  const loc = isTr ? ('tr' as const) : ('en' as const);

  const baslik = isTr ? 'Referanslar | Redwall' : 'References | Redwall';
  const aciklama = isTr
    ? 'Redwall olarak çalıştığımız kurumlar ve iş ortaklarımız.'
    : 'Organizations and business partners we have worked with at Redwall.';

  return buildMetadata({ baslik, aciklama, locale: loc, path: '/referanslar' });
}

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return [{ locale: 'tr' }, { locale: 'en' }];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ReferanslarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const loc: Locale = locale;
  const references = await sanityFetch<Reference[]>(REFERENCES_QUERY, {}, []);

  const heading = loc === 'tr' ? 'Referanslar' : 'References';
  const description =
    loc === 'tr'
      ? 'Birlikte çalıştığımız kurumlar ve iş ortaklarımız.'
      : 'Organizations and business partners we have worked with.';

  const logoItems = references.map((ref) => ({
    ad: ref.ad,
    src: ref.logo ? urlFor(ref.logo as Parameters<typeof urlFor>[0]).width(200).url() : undefined,
  }));

  const testimonials = references.filter((ref) => ref.gorus);

  const emptyLabel =
    loc === 'tr'
      ? 'Referans listemiz yakında burada olacak.'
      : 'Our reference list will appear here soon.';

  const ctaBaslik =
    loc === 'tr'
      ? 'Siz de referanslarımız arasına katılın'
      : 'Join our references';
  const ctaAciklama =
    loc === 'tr'
      ? 'Projeleriniz için güvenilir bir iş ortağı arıyorsanız, hemen teklif alın.'
      : 'If you are looking for a reliable partner for your projects, get a quote now.';
  const ctaButon =
    loc === 'tr' ? 'Teklif Al' : 'Get a Quote';

  return (
    <>
      <PageHero
        eyebrow={loc === 'tr' ? 'Referanslar' : 'References'}
        title={heading}
        description={description}
        accent="#e63950"
        glyph={<ServiceIcon name="building" className="h-[26rem] w-[26rem]" />}
      />

      {/* Logo Wall */}
      <Section tone="muted">
        {references.length > 0 ? (
          <LogoWall logos={logoItems} />
        ) : (
          <p className="text-center text-muted py-12">{emptyLabel}</p>
        )}
      </Section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <Section>
          <h2 className="mb-10 font-display text-2xl font-bold sm:text-3xl">
            {loc === 'tr' ? 'Müşteri Görüşleri' : 'Client Testimonials'}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((ref) => {
              const metin = pick(ref.gorus!.metin, loc) ?? '';
              const unvan = pick(ref.gorus!.unvan, loc) ?? '';
              return (
                <figure
                  key={ref.ad}
                  className="relative flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 pl-8 overflow-hidden"
                >
                  {/* accent left-rule */}
                  <span
                    className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
                    style={{ backgroundColor: '#e63950' }}
                    aria-hidden
                  />
                  {/* decorative quote mark */}
                  <span
                    className="absolute right-4 top-3 font-display text-7xl font-bold leading-none select-none"
                    style={{ color: '#e63950', opacity: 0.12 }}
                    aria-hidden
                  >
                    &ldquo;
                  </span>
                  <blockquote className="relative flex-1 text-base leading-relaxed text-foreground/80">
                    &ldquo;{metin}&rdquo;
                  </blockquote>
                  <figcaption className="border-t border-border pt-4">
                    <p className="font-semibold">{ref.gorus!.kisi}</p>
                    {unvan && (
                      <p className="mt-0.5 text-sm text-muted">
                        {unvan} — {ref.ad}
                      </p>
                    )}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </Section>
      )}

      <Cta
        baslik={ctaBaslik}
        aciklama={ctaAciklama}
        buton={{ etiket: ctaButon, href: '/teklif' }}
      />
    </>
  );
}
