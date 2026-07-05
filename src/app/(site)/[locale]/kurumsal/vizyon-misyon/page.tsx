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

  const baslik = isTr ? 'Vizyon & Misyon — Redwall Yangın Güvenliği Şirketi' : 'Vision & Mission — Redwall Fire Safety Company';
  const aciklama = isTr
    ? "Redwall'ın vizyonu, misyonu ve temel değerleri — yangın güvenliğinde lider bütünleşik çözüm ortağı olma hedefimizi ve kurumsal ilkelerimizi keşfedin."
    : "Redwall's vision, mission, and core values — discover our goal of becoming the leading integrated fire-safety solution partner and our guiding principles.";

  return buildMetadata({ baslik, aciklama, locale: loc, path: '/kurumsal/vizyon-misyon' });
}

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return [{ locale: 'tr' }, { locale: 'en' }];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function VizyonMisyonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  return <PageContent slug="vizyon-misyon" locale={locale} />;
}
