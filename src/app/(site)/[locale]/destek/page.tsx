import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { isLocale, pick, type Locale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { getRichPage } from '@/lib/cms/queries';
import { Section } from '@/components/ui';
import { RichText } from '@payloadcms/richtext-lexical/react';
import { PageHero } from '@/components/sections/PageHero';
import { ServiceIcon } from '@/components/ui/icons';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocaleString {
  tr: string;
  en: string;
}

interface RichPageData {
  slug: unknown;
  baslik: LocaleString;
  icerik?: Record<string, unknown>;
  kategori?: string;
  sonGuncelleme?: string;
}

const SLUG = 'destek';

// CMS-backed sayfa: Payload Local API i18n için headers() okur → tam dinamik.
export const dynamic = 'force-dynamic';

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : 'tr';
  const data = (await getRichPage(SLUG)) as RichPageData | null;

  const baslik =
    (data ? (pick(data.baslik, loc) ?? data.baslik.tr) : loc === 'tr' ? 'Destek' : 'Support') + ' | Redwall';
  const aciklama =
    loc === 'tr'
      ? 'Redwall destek kanalları, dokümantasyon ve kullanıcı yardımı.'
      : 'Redwall support channels, documentation and user assistance.';

  return buildMetadata({ baslik, aciklama, locale: loc, path: `/${SLUG}` });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DestekPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const data = (await getRichPage(SLUG)) as RichPageData | null;
  if (!data) notFound();

  const isTr = locale === 'tr';
  const baslik = pick(data.baslik, locale) ?? data.baslik.tr;
  const sonGuncellemeTarih = data.sonGuncelleme ? data.sonGuncelleme.slice(0, 10) : null;

  const icerikLexical = data.icerik
    ? (pick(data.icerik as Record<'tr' | 'en', Record<string, unknown>>, locale) ?? undefined)
    : undefined;

  return (
    <>
      <PageHero
        eyebrow={isTr ? 'Destek' : 'Support'}
        title={baslik ?? ''}
        accent="#e63950"
        chips={sonGuncellemeTarih ? [sonGuncellemeTarih] : undefined}
        glyph={<ServiceIcon name="shield-check" className="h-[26rem] w-[26rem]" />}
      />

      <Section>
        <div className="max-w-3xl space-y-6">
          {icerikLexical && (
            <div className="prose prose-neutral dark:prose-invert">
              <RichText data={icerikLexical as unknown as Parameters<typeof RichText>[0]['data']} />
            </div>
          )}
        </div>
      </Section>
    </>
  );
}
