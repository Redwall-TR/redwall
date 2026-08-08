import type { Metadata } from 'next';
import { LOCALES, type Locale } from '@/lib/locales';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://redwall.tr';

/**
 * Çekirdek hedef anahtar kelimeler (TR).
 * Not: `keywords` meta'sı Google'da zayıf sinyaldir; asıl güç title/description/
 * H1 ve JSON-LD'dedir. Şehir yığını YAPMIYORUZ (spam); şehir kapsamı 81-il
 * `areaServed` JSON-LD'sinden gelir.
 */
export const CORE_KEYWORDS_TR = [
  'yangın danışmanlığı',
  'yangın sistemleri',
  'yangın güvenliği',
  'yangın algılama sistemleri',
  'yangın söndürme sistemleri',
  'yangın güvenliği mühendisliği',
  'itfaiye raporu',
  'yangın projesi',
];

export const CORE_KEYWORDS_EN = [
  'fire safety consulting',
  'fire protection systems',
  'fire safety',
  'fire detection systems',
  'fire suppression systems',
  'fire safety engineering',
];

export const coreKeywords = (locale: Locale): string[] =>
  locale === 'en' ? CORE_KEYWORDS_EN : CORE_KEYWORDS_TR;

export function buildMetadata({
  baslik,
  aciklama,
  locale,
  path = '',
  gorselUrl,
  type,
  keywords,
  locales,
}: {
  baslik: string;
  aciklama: string;
  locale: Locale;
  path?: string;
  gorselUrl?: string;
  type?: 'website' | 'article';
  keywords?: string[];
  /** Sayfanın gerçekten var olduğu diller. TR-only sayfalar (şehir landing'leri)
   *  ['tr'] geçmeli — yoksa hreflang olmayan /en sürümünü işaret eder (kopya sinyali). */
  locales?: Locale[];
}): Metadata {
  const languages: Record<string, string> = {};
  for (const l of locales ?? LOCALES) {
    languages[l] = `${SITE_URL}/${l}${path}`;
  }
  // x-default: dil seçimini yapan prefixsiz kök URL (middleware /tr'ye yönlendirir).
  // Google'ın kök `/` ile `/tr` arasında kararsız kalıp farklı canonical seçmesini önler.
  languages['x-default'] = `${SITE_URL}${path || '/'}`;

  const ogImage = gorselUrl ?? `${SITE_URL}/og-default.png`;

  return {
    title: baslik,
    description: aciklama,
    ...(keywords && keywords.length ? { keywords } : {}),
    alternates: {
      canonical: `${SITE_URL}/${locale}${path}`,
      languages,
    },
    openGraph: {
      title: baslik,
      description: aciklama,
      url: `${SITE_URL}/${locale}${path}`,
      siteName: 'Redwall',
      locale,
      type: type ?? 'website',
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title: baslik,
      description: aciklama,
      images: [ogImage],
    },
  };
}
