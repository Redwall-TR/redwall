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
    title: isTr ? 'Hakkımızda | Redwall' : 'About Us | Redwall',
    description: isTr
      ? 'Redwall Yangın Danışmanlık Yazılım ve Mühendislik Hizmetleri — yazılım, danışmanlık ve mühendisliği tek çatı altında birleştiren bütünleşik bir yangın güvenliği şirketi.'
      : 'Redwall Fire Safety — an integrated fire safety company uniting software, consulting, and engineering under one roof.',
  };
}

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return [{ locale: 'tr' }, { locale: 'en' }];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HakkimizdaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  return <PageContent slug="hakkimizda" locale={locale} />;
}
