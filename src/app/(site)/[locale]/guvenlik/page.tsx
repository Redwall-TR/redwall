import type { Metadata } from 'next';
import { buildRichPageMetadata, RichPageView, type RichPageConfig } from '@/components/sections/RichPageView';

// CMS-backed sayfa: Payload Local API i18n için headers() okur → tam dinamik.
export const dynamic = 'force-dynamic';

const CFG: RichPageConfig = {
  slug: 'guvenlik',
  path: '/guvenlik',
  eyebrowTr: 'Güvenlik',
  eyebrowEn: 'Security',
  fallbackTitleTr: 'Güvenlik ve Veri Koruma',
  fallbackTitleEn: 'Security & Data Protection',
  aciklamaTr: 'Redwall altyapısında veri güvenliği, KVKK uyumu ve erişim kontrolü.',
  aciklamaEn: 'Data security, KVKK/GDPR alignment and access control in Redwall infrastructure.',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildRichPageMetadata(CFG, locale);
}

export default async function GuvenlikPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <RichPageView cfg={CFG} locale={locale} />;
}
