import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { isLocale, pick, type Locale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { getSolutions } from '@/lib/cms/queries';
import { Section } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { PageHero } from '@/components/sections/PageHero';
import { ServiceIcon } from '@/components/ui/icons';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocaleString {
  tr: string;
  en: string;
}

interface SolutionCard {
  slug: string;
  baslik: LocaleString;
  ozet?: LocaleString;
  ikon?: string;
}

// ── Rendering ─────────────────────────────────────────────────────────────────
// CMS-backed sayfa: Payload Local API i18n için headers() okur → statik üretim
// DYNAMIC_SERVER_USAGE verir. Liste tamamen dinamik (on-demand) render edilir.
export const dynamic = 'force-dynamic';

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : 'tr';

  const baslik = loc === 'tr' ? 'Çözümler — Redwall' : 'Solutions — Redwall';
  const aciklama =
    loc === 'tr'
      ? 'Redwall\'ın sektörel ve teknik çözümlerini keşfedin.'
      : 'Explore Redwall\'s sector-specific and technical solutions.';

  return buildMetadata({ baslik, aciklama, locale: loc, path: '/cozumler' });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CozumlerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const solutions = (await getSolutions()) as unknown as SolutionCard[];

  const isTr = locale === 'tr';
  const heading = isTr ? 'Çözümler' : 'Solutions';
  const description = isTr
    ? 'Sektörel ve teknik ihtiyaçlarınıza yönelik uçtan uca çözümlerimizi keşfedin.'
    : 'Explore our end-to-end solutions for your sector-specific and technical needs.';

  return (
    <>
      <PageHero
        eyebrow={heading}
        title={heading}
        description={description}
        accent="#e63950"
        glyph={<ServiceIcon name="shield-check" className="h-[26rem] w-[26rem]" />}
      />

      {solutions.length === 0 ? (
        <Section>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ServiceIcon
              name="shield-check"
              className="h-16 w-16 text-muted mb-6 opacity-40"
            />
            <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
              {isTr ? 'Henüz çözüm yok' : 'No solutions yet'}
            </h2>
            <p className="text-muted max-w-md">
              {isTr ? 'Yakında çözümler eklenecek.' : 'Solutions coming soon.'}
            </p>
          </div>
        </Section>
      ) : (
        <Section>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {solutions.map((solution) => {
              const baslik = pick(solution.baslik, locale) ?? solution.baslik.tr;
              const ozet = solution.ozet
                ? (pick(solution.ozet, locale) ?? undefined)
                : undefined;

              return (
                <Link
                  key={solution.slug}
                  href={
                    `/cozumler/${solution.slug}` as Parameters<typeof Link>[0]['href']
                  }
                  className="group flex flex-col rounded-2xl border border-border bg-surface p-6 hover:border-primary transition-colors"
                >
                  {solution.ikon && (
                    <span
                      className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl text-primary"
                      style={{ backgroundColor: '#e639501a' }}
                    >
                      <ServiceIcon name={solution.ikon} className="h-6 w-6" />
                    </span>
                  )}
                  <h2 className="font-display text-lg font-bold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors">
                    {baslik}
                  </h2>
                  {ozet && (
                    <p className="text-sm text-muted leading-relaxed line-clamp-3 flex-1">
                      {ozet}
                    </p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    {isTr ? 'Detayları gör' : 'View details'}
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </Link>
              );
            })}
          </div>
        </Section>
      )}
    </>
  );
}
