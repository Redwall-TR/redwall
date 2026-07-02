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

// Tek-slug richPage rotaları için paylaşılan veri-çekme + render. mevzuat /
// guvenlik / destek / yazilim-nasil-calisir bunu config ile kullanır; böylece
// rendering/metadata mantığı tek yerde tutulur (4-5 kopya yerine).

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

export interface RichPageConfig {
  slug: string;
  path: string;
  eyebrowTr: string;
  eyebrowEn: string;
  fallbackTitleTr: string;
  fallbackTitleEn: string;
  aciklamaTr: string;
  aciklamaEn: string;
}

export async function buildRichPageMetadata(cfg: RichPageConfig, locale: string): Promise<Metadata> {
  const loc: Locale = isLocale(locale) ? locale : 'tr';
  const data = (await getRichPage(cfg.slug)) as RichPageData | null;

  const baslik =
    (data
      ? (pick(data.baslik, loc) ?? data.baslik.tr)
      : loc === 'tr'
        ? cfg.fallbackTitleTr
        : cfg.fallbackTitleEn) + ' | Redwall';
  const aciklama = loc === 'tr' ? cfg.aciklamaTr : cfg.aciklamaEn;

  return buildMetadata({ baslik, aciklama, locale: loc, path: cfg.path });
}

export async function RichPageView({ cfg, locale }: { cfg: RichPageConfig; locale: string }) {
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const data = (await getRichPage(cfg.slug)) as RichPageData | null;
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
        eyebrow={isTr ? cfg.eyebrowTr : cfg.eyebrowEn}
        title={baslik ?? ''}
        accent="#e63950"
        chips={sonGuncellemeTarih ? [sonGuncellemeTarih] : undefined}
        glyph={<ServiceIcon name="shield-check" className="h-[26rem] w-[26rem]" />}
      />

      <Section>
        <div className="space-y-6">
          {icerikLexical && (
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <RichText data={icerikLexical as unknown as Parameters<typeof RichText>[0]['data']} />
            </div>
          )}
        </div>
      </Section>
    </>
  );
}
