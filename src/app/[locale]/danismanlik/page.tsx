import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { isLocale } from '@/lib/locales';
import ServiceDetail from '@/components/sections/ServiceDetail';

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = !isLocale(locale) || locale === 'tr';

  return {
    title: isTr
      ? 'Yangın Danışmanlığı | Redwall'
      : 'Fire Consulting | Redwall',
    description: isTr
      ? 'İtfaiyeden olumlu rapor almak, mevzuata tam uyum sağlamak ve yangın güvenliği projelerinizi doğru şekilde yönetmek için profesyonel danışmanlık hizmetleri.'
      : 'Professional consulting services to obtain a positive fire-department report, achieve full regulatory compliance, and correctly manage your fire-safety projects.',
  };
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
