import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { sanityFetch } from '@/sanity/lib/fetch';
import {
  HOME_QUERY,
  SERVICES_QUERY,
  FEATURED_PROJECTS_QUERY,
  REFERENCES_QUERY,
  SITE_SETTINGS_QUERY,
} from '@/sanity/lib/queries';
import { pick, isLocale, type Locale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { Button, Section, Stat } from '@/components/ui';

import Hero from '@/components/sections/Hero';
import ServiceCards from '@/components/sections/ServiceCards';
import FeaturedProjects, { type FeaturedProject } from '@/components/sections/FeaturedProjects';
import ReferenceStrip, { type Ref } from '@/components/sections/ReferenceStrip';
import { Link } from '@/i18n/navigation';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocaleString {
  tr: string;
  en: string;
}

interface HomeData {
  heroBaslik?: LocaleString;
  heroAltMetin?: LocaleString;
  heroBirincilCta?: { etiket: LocaleString; href: string };
  heroIkincilCta?: { etiket: LocaleString; href: string };
  yaklasim?: unknown;
  oneCikanUrun?: {
    slug: string;
    ad?: LocaleString;
    slogan?: LocaleString;
  };
}

interface Istatistik {
  deger: string;
  etiket?: LocaleString;
}

interface SiteSettings {
  sirketAdi?: string;
  istatistikler?: Istatistik[];
  seo?: {
    baslik?: LocaleString;
    aciklama?: LocaleString;
  };
}

// ── Fallback stats ─────────────────────────────────────────────────────────────

const FALLBACK_STATS: { deger: string; etiket: Record<Locale, string> }[] = [
  { deger: '20+', etiket: { tr: 'Yıl Tecrübe', en: 'Years of Experience' } },
  { deger: '500+', etiket: { tr: 'Proje', en: 'Projects' } },
  { deger: '200+', etiket: { tr: 'Kurumsal Müşteri', en: 'Corporate Clients' } },
];

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : 'tr';

  const settings = await sanityFetch<SiteSettings | null>(SITE_SETTINGS_QUERY, {}, null);

  const title =
    (settings?.seo?.baslik ? pick(settings.seo.baslik, loc) : undefined) ??
    (loc === 'tr' ? 'Redwall — Yangın Güvenliği Çözümleri' : 'Redwall — Fire Safety Solutions');

  const description =
    (settings?.seo?.aciklama ? pick(settings.seo.aciklama, loc) : undefined) ??
    (loc === 'tr'
      ? 'Yangın güvenliğinde yazılım, danışmanlık ve mühendislik hizmetleriyle uçtan uca çözümler.'
      : 'End-to-end fire safety solutions covering software, consulting, and engineering.');

  return buildMetadata({ baslik: title, aciklama: description, locale: loc, path: '' });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const [home, services, featured, refs, settings] = await Promise.all([
    sanityFetch<HomeData | null>(HOME_QUERY, {}, null),
    sanityFetch<unknown[]>(SERVICES_QUERY, {}, []),
    sanityFetch<FeaturedProject[]>(FEATURED_PROJECTS_QUERY, {}, []),
    sanityFetch<Ref[]>(REFERENCES_QUERY, {}, []),
    sanityFetch<SiteSettings | null>(SITE_SETTINGS_QUERY, {}, null),
  ]);

  // Stats: use Sanity data if present, else fallback
  const istatistikler = settings?.istatistikler ?? [];

  // Featured product teaser
  const oneCikanUrun = home?.oneCikanUrun ?? null;

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <Hero data={home} locale={locale} />

      {/* ── Service cards ─────────────────────────────────────── */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ServiceCards services={services as any} locale={locale} />

      {/* ── Stats band ────────────────────────────────────────── */}
      <Section tone="muted">
        <div className="mb-10 text-center">
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            {locale === 'tr' ? 'Rakamlarla Redwall' : 'Redwall by the Numbers'}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {istatistikler.length > 0
            ? istatistikler.map((stat, i) => (
                <Stat
                  key={i}
                  deger={stat.deger}
                  etiket={stat.etiket ? (pick(stat.etiket, locale) ?? stat.etiket.tr) : ''}
                />
              ))
            : FALLBACK_STATS.map((stat) => (
                <Stat
                  key={stat.deger}
                  deger={stat.deger}
                  etiket={stat.etiket[locale]}
                />
              ))}
        </div>
      </Section>

      {/* ── Featured product teaser ───────────────────────────── */}
      {oneCikanUrun && (
        <Section tone="dark">
          <div className="flex flex-col items-center text-center gap-6">
            <span className="inline-flex rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/30">
              {locale === 'tr' ? 'Öne Çıkan Yazılım' : 'Featured Software'}
            </span>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl max-w-2xl">
              {oneCikanUrun.ad ? (pick(oneCikanUrun.ad, locale) ?? oneCikanUrun.ad.tr) : ''}
            </h2>
            {oneCikanUrun.slogan && (
              <p className="text-white/70 max-w-xl text-base leading-relaxed">
                {pick(oneCikanUrun.slogan, locale) ?? oneCikanUrun.slogan.tr}
              </p>
            )}
            <Link
              href={`/yazilim/${oneCikanUrun.slug}`}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              {locale === 'tr' ? 'Ürünü İncele' : 'View Product'}
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </Section>
      )}

      {/* ── Featured projects ─────────────────────────────────── */}
      <FeaturedProjects projects={featured} locale={locale} />

      {/* ── Reference strip ───────────────────────────────────── */}
      <ReferenceStrip references={refs} locale={locale} />

      {/* ── Closing CTA ───────────────────────────────────────── */}
      <Section tone="dark">
        <div className="flex flex-col items-center text-center gap-6">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl max-w-2xl">
            {locale === 'tr'
              ? 'Projeniz için özel teklif alın'
              : 'Get a custom quote for your project'}
          </h2>
          <p className="text-white/70 max-w-xl text-base leading-relaxed">
            {locale === 'tr'
              ? 'Yangın güvenliği ihtiyaçlarınızı değerlendiriyor, size en uygun çözümü sunuyoruz.'
              : 'We assess your fire safety needs and deliver the solution that fits best.'}
          </p>
          <Button
            href="/teklif"
            variant="primary"
            className="bg-primary text-white hover:bg-primary/90"
          >
            {locale === 'tr' ? 'Teklif İste' : 'Request a Quote'}
          </Button>
        </div>
      </Section>
    </>
  );
}
