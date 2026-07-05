import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { getHome, getServices, getFeaturedProjects, getFeaturedReferences, getReferenceProjectCounts, getSiteSettings } from '@/lib/cms/queries';
import { pick, isLocale, type Locale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { Button, Section, Stat } from '@/components/ui';

import Hero from '@/components/sections/Hero';
import ServiceCards from '@/components/sections/ServiceCards';
import FeaturedProjects from '@/components/sections/FeaturedProjects';
import ReferenceStrip from '@/components/sections/ReferenceStrip';
import { Link } from '@/i18n/navigation';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocaleString {
  tr: string;
  en: string;
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

  const settings = await getSiteSettings();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seo = settings?.seo as any;

  const title: string =
    (seo?.baslik ? (pick(seo.baslik as LocaleString, loc) ?? undefined) : undefined) ??
    (loc === 'tr' ? 'Redwall — Yangın Güvenliği Danışmanlık ve Mühendislik' : 'Redwall — Fire Safety Consulting & Engineering');

  const description: string =
    (seo?.aciklama ? (pick(seo.aciklama as LocaleString, loc) ?? undefined) : undefined) ??
    (loc === 'tr'
      ? 'Yangın güvenliğinde danışmanlık, mühendislik ve YangınPro/MekanikPro yazılımlarıyla uçtan uca çözümler. İtfaiye raporu ve mevzuat uyumunda güvenilir ortağınız.'
      : 'End-to-end fire safety solutions: consulting, engineering, and YangınPro/MekanikPro software — your trusted partner for compliance and fire-department approval.');

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

  const [home, services, featured, refs, refCounts, settings] = await Promise.all([
    getHome(),
    getServices(),
    getFeaturedProjects(),
    getFeaturedReferences(),
    getReferenceProjectCounts(),
    getSiteSettings(),
  ]);

  // Stats: use Sanity data if present, else fallback
  const istatistikler = settings?.istatistikler ?? [];

  // Featured product teaser
  const oneCikanUrun = home?.oneCikanUrun ?? null;

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────── */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Hero data={home as any} locale={locale} />

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
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (istatistikler as any[]).map((stat, i) => (
                <Stat
                  key={i}
                  deger={stat.deger ?? ''}
                  etiket={stat.etiket ? (pick(stat.etiket, locale) ?? stat.etiket?.tr ?? '') : ''}
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
              {oneCikanUrun.ad ? (pick(oneCikanUrun.ad as LocaleString, locale) ?? (oneCikanUrun.ad as LocaleString).tr) : ''}
            </h2>
            {oneCikanUrun.slogan && (
              <p className="text-white/70 max-w-xl text-base leading-relaxed">
                {pick(oneCikanUrun.slogan as LocaleString, locale) ?? (oneCikanUrun.slogan as LocaleString).tr}
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
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <FeaturedProjects projects={featured as any} locale={locale} />

      {/* ── Reference strip ───────────────────────────────────── */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ReferenceStrip references={refs as any} counts={refCounts} locale={locale} />

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
