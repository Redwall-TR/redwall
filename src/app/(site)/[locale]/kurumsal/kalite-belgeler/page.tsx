import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { isLocale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import PageContent from '@/components/sections/PageContent';

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = !isLocale(locale) || locale === 'tr';
  const loc = isTr ? ('tr' as const) : ('en' as const);

  const baslik = isTr ? 'Kalite Yönetimi, Standartlar & Belgeler | Redwall' : 'Quality Management, Standards & Certificates | Redwall';
  const aciklama = isTr
    ? 'Redwall kalite yönetim yaklaşımımız, uyduğumuz ulusal ve uluslararası standartlar ile yangın güvenliği alanındaki sertifikalarımız hakkında bilgi edinin.'
    : 'Learn about Redwall\'s quality management approach, the national and international standards we comply with, and our fire-safety certifications.';

  return buildMetadata({ baslik, aciklama, locale: loc, path: '/kurumsal/kalite-belgeler' });
}

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return [{ locale: 'tr' }, { locale: 'en' }];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function KaliteBelgelerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  return <PageContent slug="kalite-belgeler" locale={locale} />;
}
