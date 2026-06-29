import type { Metadata } from 'next';
import { buildRichPageMetadata, RichPageView, type RichPageConfig } from '@/components/sections/RichPageView';

// CMS-backed sayfa: Payload Local API i18n için headers() okur → tam dinamik.
export const dynamic = 'force-dynamic';

const CFG: RichPageConfig = {
  slug: 'mevzuat',
  path: '/mevzuat',
  eyebrowTr: 'Mevzuat',
  eyebrowEn: 'Compliance',
  fallbackTitleTr: 'Mevzuat Uyumluluğu',
  fallbackTitleEn: 'Regulatory Compliance',
  aciklamaTr: 'Redwall yazılım ve hizmetlerinin yangın güvenliği mevzuatı ile uyumu.',
  aciklamaEn: 'How Redwall software and services align with fire-safety regulation.',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildRichPageMetadata(CFG, locale);
}

export default async function MevzuatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <RichPageView cfg={CFG} locale={locale} />;
}
