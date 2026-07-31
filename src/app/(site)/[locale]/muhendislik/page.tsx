import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { isLocale } from '@/lib/locales';
import { buildMetadata, coreKeywords } from '@/lib/metadata';
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

  const baslik = isTr ? 'Yangın Sistemleri & Yangın Mühendisliği Uygulama' : 'Fire Protection Systems & Fire Engineering';
  const aciklama = isTr
    ? 'Yangın sistemleri kurulumu ve yangın mühendisliği: aktif söndürme, pasif önleme, algılama-alarm, saha uygulaması ve periyodik bakımda uçtan uca taahhüt hizmetleri.'
    : 'Fire protection systems and fire engineering: active suppression, passive prevention, detection & alarm, field installation, and periodic maintenance — turnkey contracting.';

  return buildMetadata({ baslik, aciklama, locale: loc, path: '/muhendislik', keywords: coreKeywords(loc) });
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
