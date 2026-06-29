import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { isLocale, pick, type Locale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { getSolution } from '@/lib/cms/queries';
import { Section } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { PageHero } from '@/components/sections/PageHero';
import { ServiceIcon } from '@/components/ui/icons';
import { RichText } from '@payloadcms/richtext-lexical/react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocaleString {
  tr: string;
  en: string;
}

interface SolutionData {
  slug: unknown;
  baslik: LocaleString;
  ozet?: LocaleString;
  icerik?: Record<string, unknown>;
  ikon?: string;
  hedefKitle?: LocaleString;
}

// ── Rendering ─────────────────────────────────────────────────────────────────
// CMS-backed sayfa: Payload Local API i18n için headers() okur → statik üretim
// DYNAMIC_SERVER_USAGE verir. Detay tamamen dinamik (on-demand) render edilir.
export const dynamic = 'force-dynamic';

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc: Locale = isLocale(locale) ? locale : 'tr';

  const data = (await getSolution(slug)) as SolutionData | null;

  if (!data) {
    return buildMetadata({
      baslik: loc === 'tr' ? 'Çözüm | Redwall' : 'Solution | Redwall',
      aciklama: loc === 'tr' ? 'Redwall çözümü.' : 'Redwall solution.',
      locale: loc,
      path: `/cozumler/${slug}`,
    });
  }

  const title = pick(data.baslik, loc) ?? data.baslik.tr;
  const description =
    (data.ozet ? (pick(data.ozet, loc) ?? undefined) : undefined) ??
    (loc === 'tr' ? 'Redwall çözümü.' : 'Redwall solution.');

  return buildMetadata({
    baslik: `${title} | Redwall`,
    aciklama: description,
    locale: loc,
    path: `/cozumler/${slug}`,
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CozumDetayPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const data = (await getSolution(slug)) as SolutionData | null;

  if (!data) notFound();

  const isTr = locale === 'tr';
  const baslik = pick(data.baslik, locale) ?? data.baslik.tr;
  const ozet = data.ozet ? (pick(data.ozet, locale) ?? undefined) : undefined;

  // data.icerik is a locale-keyed object: { tr: LexicalState, en: LexicalState }
  const icerikLexical = data.icerik
    ? (pick(
        data.icerik as Record<'tr' | 'en', Record<string, unknown>>,
        locale,
      ) ?? undefined)
    : undefined;

  // hedefKitle is a localized textarea (single string) — split into list items by line.
  const hedefKitleText = data.hedefKitle
    ? (pick(data.hedefKitle, locale) ?? undefined)
    : undefined;
  const hedefKitleItems = (hedefKitleText ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <>
      <PageHero
        eyebrow={isTr ? 'Çözüm' : 'Solution'}
        title={baslik ?? ''}
        description={ozet}
        accent="#e63950"
        glyph={
          <ServiceIcon
            name={data.ikon ?? 'shield-check'}
            className="h-[26rem] w-[26rem]"
          />
        }
      />

      {/* İçerik */}
      {icerikLexical && (
        <Section>
          <div className="max-w-3xl prose prose-neutral dark:prose-invert">
            <RichText
              data={
                icerikLexical as unknown as Parameters<typeof RichText>[0]['data']
              }
            />
          </div>
        </Section>
      )}

      {/* Hedef Kitle */}
      {hedefKitleItems.length > 0 && (
        <Section tone="muted">
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl mb-8">
            {isTr ? 'Kimler İçin?' : 'Who Is It For?'}
          </h2>
          <ul className="mx-auto grid max-w-2xl gap-3 sm:grid-cols-2">
            {hedefKitleItems.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl border border-border bg-background px-5 py-4"
              >
                <span
                  className="mt-0.5 flex-shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full text-primary"
                  style={{ backgroundColor: '#e639501a' }}
                >
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="text-sm text-foreground leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Back link */}
      <Section>
        <Link
          href="/cozumler"
          className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {isTr ? 'Tüm Çözümlere Dön' : 'Back to All Solutions'}
        </Link>
      </Section>
    </>
  );
}
