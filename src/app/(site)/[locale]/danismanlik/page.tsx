import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { isLocale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import ServiceDetail from '@/components/sections/ServiceDetail';

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = !isLocale(locale) || locale === 'tr';
  const loc = isTr ? ('tr' as const) : ('en' as const);

  const baslik = isTr ? 'Yangın Güvenliği Danışmanlığı & İtfaiye Raporu | Redwall' : 'Fire Safety Consulting & Fire Department Approval | Redwall';
  const aciklama = isTr
    ? 'İtfaiyeden olumlu rapor almak, mevzuata tam uyum sağlamak ve yangın güvenliği projelerinizi doğru yönetmek için profesyonel danışmanlık hizmetleri sunuyoruz.'
    : 'Professional fire consulting to obtain a positive fire-department report, achieve full regulatory compliance, and correctly manage your fire-safety projects.';

  return buildMetadata({ baslik, aciklama, locale: loc, path: '/danismanlik' });
}

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return [{ locale: 'tr' }, { locale: 'en' }];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DanismanlikPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  return <ServiceDetail isKolu="danismanlik" locale={locale} />;
}
