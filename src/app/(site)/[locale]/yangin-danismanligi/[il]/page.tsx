import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { buildMetadata, coreKeywords } from '@/lib/metadata';
import { getCity, CITY_SLUGS, SERVICES } from '@/lib/city-content';
import CityServicePage from '@/components/sections/CityServicePage';

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; il: string }>;
}): Promise<Metadata> {
  const { locale, il } = await params;
  const city = getCity(il);
  if (locale !== 'tr' || !city) return {};

  const svc = SERVICES.danismanlik;
  const baslik = `${city.il} ${svc.adKisa} & İtfaiye Raporu`;
  const aciklama = `${city.il} (${city.merkez}) ve ilçelerinde ${svc.hizmetEtiketi}: itfaiye uygunluk raporu, yangın risk analizi ve mevzuat uyumu. Yerel sanayi ve yapı stoğunu bilen ekiple uçtan uca çözüm.`;
  const keywords = [
    `${city.il.toLocaleLowerCase('tr')} ${svc.hizmetEtiketi}`,
    `${city.il.toLocaleLowerCase('tr')} yangın sistemleri`,
    ...coreKeywords('tr'),
  ];

  return buildMetadata({
    baslik,
    aciklama,
    locale: 'tr',
    path: `/yangin-danismanligi/${city.slug}`,
    keywords,
  });
}

// ── Static params (yalnızca TR) ─────────────────────────────────────────────────

export function generateStaticParams({ params }: { params: { locale: string } }) {
  if (params.locale !== 'tr') return [];
  return CITY_SLUGS.map((il) => ({ il }));
}

// ── Page ────────────────────────────────────────────────────────────────────────

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; il: string }>;
}) {
  const { locale, il } = await params;
  if (locale !== 'tr') notFound();
  const city = getCity(il);
  if (!city) notFound();
  setRequestLocale(locale);

  return <CityServicePage city={city} service="danismanlik" />;
}
