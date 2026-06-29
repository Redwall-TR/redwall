import type { Metadata } from 'next';
import { buildRichPageMetadata, RichPageView, type RichPageConfig } from '@/components/sections/RichPageView';

// CMS-backed sayfa: Payload Local API i18n için headers() okur → tam dinamik.
export const dynamic = 'force-dynamic';

const CFG: RichPageConfig = {
  slug: 'destek',
  path: '/destek',
  eyebrowTr: 'Destek',
  eyebrowEn: 'Support',
  fallbackTitleTr: 'Destek',
  fallbackTitleEn: 'Support',
  aciklamaTr: 'Redwall destek kanalları, dokümantasyon ve kullanıcı yardımı.',
  aciklamaEn: 'Redwall support channels, documentation and user assistance.',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildRichPageMetadata(CFG, locale);
}

export default async function DestekPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <RichPageView cfg={CFG} locale={locale} />;
}
