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
    title: isTr ? 'Vizyon & Misyon | Redwall' : 'Vision & Mission | Redwall',
    description: isTr
      ? "Redwall'ın vizyonu, misyonu ve temel değerleri — yangın güvenliğinde lider bütünleşik çözüm ortağı olma hedefi."
      : "Redwall's vision, mission, and core values — the goal of becoming a leading integrated fire safety partner.",
  };
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
