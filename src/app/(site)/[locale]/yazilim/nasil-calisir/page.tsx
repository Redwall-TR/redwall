import type { Metadata } from 'next';
import { buildRichPageMetadata, RichPageView, type RichPageConfig } from '@/components/sections/RichPageView';

// CMS-backed sayfa: Payload Local API i18n için headers() okur → tam dinamik.
export const dynamic = 'force-dynamic';

const CFG: RichPageConfig = {
  slug: 'nasil-calisir',
  path: '/yazilim/nasil-calisir',
  eyebrowTr: 'Yazılım',
  eyebrowEn: 'Software',
  fallbackTitleTr: 'Nasıl Çalışır',
  fallbackTitleEn: 'How It Works',
  aciklamaTr: 'YangınPro ve MekanikPro ile proje, hesap ve raporlama akışı.',
  aciklamaEn: 'Project, calculation and reporting workflow with YangınPro and MekanikPro.',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildRichPageMetadata(CFG, locale);
}

export default async function NasilCalisirPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <RichPageView cfg={CFG} locale={locale} />;
}
