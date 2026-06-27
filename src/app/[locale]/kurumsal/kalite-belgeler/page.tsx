import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { isLocale } from '@/lib/locales';
import PageContent from '@/components/sections/PageContent';

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = !isLocale(locale) || locale === 'tr';

  return {
    title: isTr ? 'Kalite & Belgeler | Redwall' : 'Quality & Certificates | Redwall',
    description: isTr
      ? 'Redwall kalite yönetim yaklaşımı, uyduğumuz ulusal ve uluslararası standartlar ile sertifikalarımız.'
      : 'Redwall\'s quality management approach, the national and international standards we comply with, and our certificates.',
  };
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
