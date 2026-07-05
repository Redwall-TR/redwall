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

  const baslik = isTr ? 'Hakkımızda — Redwall Yangın Güvenliği Şirketi' : 'About Us — Redwall Integrated Fire Safety Company';
  const aciklama = isTr
    ? 'Redwall Yangın Danışmanlık Yazılım ve Mühendislik Hizmetleri — yazılım, danışmanlık ve mühendisliği tek çatıda birleştiren bütünleşik yangın güvenliği şirketi.'
    : 'Redwall Fire Safety — an integrated company uniting software, consulting, and engineering under one roof to deliver complete fire-safety solutions.';

  return buildMetadata({ baslik, aciklama, locale: loc, path: '/kurumsal/hakkimizda' });
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
