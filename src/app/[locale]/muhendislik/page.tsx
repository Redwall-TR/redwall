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
      ? 'Mühendislik & Uygulama | Redwall'
      : 'Engineering & Application | Redwall',
    description: isTr
      ? 'Aktif söndürme, pasif önleme, saha uygulaması, sıhhi tesisat ve periyodik bakım alanlarında uçtan uca mühendislik ve taahhüt hizmetleri.'
      : 'End-to-end engineering and contracting services in active suppression, passive prevention, field application, plumbing installation, and periodic maintenance.',
  };
}

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return [{ locale: 'tr' }, { locale: 'en' }];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function MuhendislikPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  return <ServiceDetail isKolu="muhendislik" locale={locale} />;
}
