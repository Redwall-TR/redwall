import type { Metadata } from 'next';
import { LOCALES, type Locale } from '@/lib/locales';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://redwall.tr';

export function buildMetadata({
  baslik,
  aciklama,
  locale,
  path = '',
  gorselUrl,
  type,
}: {
  baslik: string;
  aciklama: string;
  locale: Locale;
  path?: string;
  gorselUrl?: string;
  type?: 'website' | 'article';
}): Metadata {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) {
    languages[l] = `${SITE_URL}/${l}${path}`;
  }

  const ogImage = gorselUrl ?? `${SITE_URL}/og-default.png`;

  return {
    title: baslik,
    description: aciklama,
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
