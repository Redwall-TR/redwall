import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';

import { getHome, getServices, getFeaturedProjects, getFeaturedReferences, getReferenceProjectCounts, getSiteSettings } from '@/lib/cms/queries';
import { pick, isLocale, type Locale } from '@/lib/locales';
import { buildMetadata, coreKeywords } from '@/lib/metadata';
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
    (loc === 'tr'
      ? 'Yangın Danışmanlığı ve Yangın Sistemleri — Yazılım, Danışmanlık, Mühendislik'
      : 'Fire Safety Consulting & Fire Protection Systems — Software, Consulting, Engineering');

  const description: string =
    (seo?.aciklama ? (pick(seo.aciklama as LocaleString, loc) ?? undefined) : undefined) ??
    (loc === 'tr'
      ? 'Yangın danışmanlığı, yangın sistemleri ve yangın güvenliği mühendisliği; itfaiye raporu ve mevzuat uyumunda uçtan uca çözümler. YangınPro/MekanikPro yazılımlarıyla güvenilir ortağınız.'
      : 'Fire safety consulting, fire protection systems and fire safety engineering; end-to-end solutions for fire-department compliance — powered by YangınPro/MekanikPro software.');

  return buildMetadata({ baslik: title, aciklama: description, locale: loc, path: '', keywords: coreKeywords(loc) });
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

      {/* ── Uzmanlık (görsel + metin, E-E-A-T) ────────────────── */}
      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <Image
                src="/images/saha-ekip.jpg"
                alt={
                  locale === 'tr'
                    ? 'Baretli mühendis ekibi sahada yangın güvenliği projesini inceliyor'
                    : 'Engineering team in hard hats reviewing a fire safety project on site'
                }
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-3 hidden w-44 overflow-hidden rounded-xl border-4 border-background shadow-xl sm:block">
              <div className="relative aspect-[16/10]">
                <Image
                  src="/images/teknik-plan.jpg"
                  alt={
                    locale === 'tr'
                      ? 'Yangın projesi teknik çizimi üzerinde çalışma'
                      : 'Working on fire project technical drawings'
                  }
                  fill
                  sizes="176px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <div>
            <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20">
              {locale === 'tr' ? 'Neden Redwall' : 'Why Redwall'}
            </span>
            <h2 className="mt-4 font-display text-2xl font-bold text-foreground sm:text-3xl">
              {locale === 'tr'
                ? 'Mühendislik disiplini, sahada kanıtlanmış tecrübe'
                : 'Engineering discipline, proven on site'}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              {locale === 'tr'
                ? 'Projeden itfaiye onayına, sistem kurulumundan periyodik bakıma kadar yangın güvenliğinin her aşamasını tek elden yürütüyoruz. Kendi yazılımlarımızla desteklenen süreçler, mevzuata tam uyum ve ölçülebilir güvenlik sağlar.'
                : 'From design to fire-department approval, from system installation to periodic maintenance, we manage every stage of fire safety in one place — backed by our own software for full compliance and measurable safety.'}
            </p>
            <ul className="mt-6 space-y-3">
              {(locale === 'tr'
                ? ['İtfaiye uyumlu proje ve raporlama', 'Aktif + pasif sistemlerde anahtar teslim uygulama', 'Periyodik bakım ve denetime hazırlık']
                : ['Fire-department compliant design & reporting', 'Turnkey active + passive system installation', 'Periodic maintenance & audit readiness']
              ).map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground/80">
                  <span className="mt-1 flex-shrink-0 text-primary" aria-hidden>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

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

      {/* ── Yangın sistemleri görsel showcase ─────────────────── */}
      <Section tone="muted">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            {locale === 'tr' ? 'Uçtan uca yangın sistemleri' : 'End-to-end fire protection systems'}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted">
            {locale === 'tr'
              ? 'Algılama ve alarmdan söndürmeye, pasif önlemlerden periyodik bakıma kadar yangın sistemlerini projelendiriyor, kuruyor ve işler durumda tutuyoruz.'
              : 'From detection and alarm to suppression, passive protection and periodic maintenance — we design, install and maintain fire systems.'}
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {[
            {
              src: '/images/yangin-algilama.jpg',
              altTr: 'Duvara monte kırmızı yangın alarm butonu — yangın algılama ve ihbar sistemi',
              altEn: 'Red wall-mounted fire alarm call point — fire detection and alarm system',
              titleTr: 'Algılama & Alarm',
              titleEn: 'Detection & Alarm',
              descTr: 'Adresli/konvansiyonel algılama, duman-ısı dedektörleri, alarm ve seslendirme.',
              descEn: 'Addressable/conventional detection, smoke-heat detectors, alarm and voice systems.',
            },
            {
              src: '/images/yangin-sondurme.jpg',
              altTr: 'Bölgelere ayrılmış kırmızı borulu endüstriyel yangın sprinkler söndürme sistemi',
              altEn: 'Zoned industrial red-pipe fire sprinkler suppression system',
              titleTr: 'Söndürme Sistemleri',
              titleEn: 'Suppression Systems',
              descTr: 'Sprinkler, hidrant, yangın dolabı, köpüklü ve gazlı söndürme, pompa istasyonları.',
              descEn: 'Sprinkler, hydrant, hose reels, foam and clean-agent suppression, pump stations.',
            },
          ].map((it) => (
            <figure key={it.src} className="group relative overflow-hidden rounded-2xl bg-[#141416]">
              <div className="relative aspect-[16/10]">
                <Image
                  src={it.src}
                  alt={locale === 'tr' ? it.altTr : it.altEn}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141416] via-[#141416]/20 to-transparent" />
              </div>
              <figcaption className="absolute inset-x-0 bottom-0 p-5 text-white">
                <h3 className="font-display text-lg font-semibold">
                  {locale === 'tr' ? it.titleTr : it.titleEn}
                </h3>
                <p className="mt-1 text-sm text-white/75">
                  {locale === 'tr' ? it.descTr : it.descEn}
                </p>
              </figcaption>
            </figure>
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
