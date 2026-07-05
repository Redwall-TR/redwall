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

  const baslik = isTr ? 'Yangın Mühendisliği & Söndürme Sistemi Uygulama | Redwall' : 'Fire Engineering & Suppression System Installation | Redwall';
  const aciklama = isTr
    ? 'Aktif söndürme, pasif önleme, saha uygulaması, sıhhi tesisat ve periyodik bakım alanlarında uçtan uca yangın mühendisliği ve taahhüt hizmetleri sunuyoruz.'
    : 'End-to-end fire engineering and contracting services covering active suppression, passive prevention, field installation, plumbing, and periodic maintenance.';

  return buildMetadata({ baslik, aciklama, locale: loc, path: '/muhendislik' });
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
