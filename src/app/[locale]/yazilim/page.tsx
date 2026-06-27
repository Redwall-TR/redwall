import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { isLocale, pick } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { sanityFetch } from '@/sanity/lib/fetch';
import { PRODUCTS_QUERY, SERVICE_QUERY } from '@/sanity/lib/queries';
import { PageHeader, Section, Cta } from '@/components/ui';
import ProductGrid, { type ProductCard } from '@/components/sections/ProductGrid';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocaleString {
  tr: string;
  en: string;
}

interface ServiceData {
  isKolu: string;
  baslik: LocaleString;
  ozet: LocaleString;
  icerik?: unknown;
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = !isLocale(locale) || locale === 'tr';
  const loc = isTr ? ('tr' as const) : ('en' as const);

  const baslik = isTr ? 'Yazılım | Redwall' : 'Software | Redwall';
  const aciklama = isTr
    ? 'Fikri mülkiyeti Redwall\'a ait YangınPro ve MekanikPro yazılımları ile yangın ve mekanik mühendislik süreçlerinizi dijitalleştirin.'
    : 'Digitise your fire and mechanical engineering workflows with YangınPro and MekanikPro — proprietary software developed and owned by Redwall.';

  return buildMetadata({ baslik, aciklama, locale: loc, path: '/yazilim' });
}

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return [{ locale: 'tr' }, { locale: 'en' }];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function YazilimPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  // Fetch service and products in parallel
  const [service, products] = await Promise.all([
    sanityFetch<ServiceData | null>(SERVICE_QUERY, { isKolu: 'yazilim' }, null),
    sanityFetch<ProductCard[]>(PRODUCTS_QUERY, {}, []),
  ]);

  const isTr = locale === 'tr';

  // PageHeader content
  const headerUst = isTr ? 'Yazılım' : 'Software';
  const headerBaslik =
    service?.baslik ? (pick(service.baslik, locale) ?? (isTr ? 'Yazılım Ürünlerimiz' : 'Our Software Products')) : (isTr ? 'Yazılım Ürünlerimiz' : 'Our Software Products');
  const headerAciklama =
    service?.ozet
      ? (pick(service.ozet, locale) ?? undefined)
      : isTr
        ? 'Fikri mülkiyeti bize ait YangınPro ve MekanikPro — yangın ve mekanik mühendislik süreçlerini dijitalleştiren özgün yazılım çözümleri.'
        : 'YangınPro and MekanikPro — proprietary software solutions owned by Redwall that digitise fire and mechanical engineering workflows.';

  // Intro paragraphs (fallback when no service.icerik)
  const introParagraphs = isTr
    ? [
        'Redwall Yazılım iş kolu, yangın ve mekanik mühendislik alanlarında kullanılan ve fikri mülkiyeti tamamen bize ait yazılım ürünleri geliştirmektedir. YangınPro ve MekanikPro, sektörün ihtiyaçlarından yola çıkılarak Ar-Ge süreçlerimizle tasarlanmış ve yerli mühendislik zekâsının ürünüdür.',
        'Bu ürünleri geliştiriyor, markalaştırıyor ve pazarlıyoruz. Kullanıcılarımız; rutin hesaplamalardan mevzuat uyumu kontrolüne kadar her aşamada dijital desteğe kavuşurken, firmamız yazılım gelirleriyle sürdürülebilir Ar-Ge döngüsünü finanse etmektedir.',
      ]
    : [
        'Redwall\'s Software arm develops engineering software products — fully owned intellectual property — for the fire-safety and mechanical engineering sectors. YangınPro and MekanikPro were conceived through our R&D process, built around real-world engineering needs, and represent homegrown engineering intelligence.',
        'We develop, brand, and market these products ourselves. While users gain digital support at every stage — from routine calculations to regulatory compliance checks — the software revenue finances our sustainable R&D cycle.',
      ];

  // CTA content
  const ctaBaslik = isTr
    ? 'Demo Talep Edin'
    : 'Request a Demo';
  const ctaAciklama = isTr
    ? 'YangınPro veya MekanikPro hakkında ücretsiz demo almak için bize ulaşın.'
    : 'Contact us for a free demo of YangınPro or MekanikPro.';
  const ctaButonEtiket = isTr ? 'Demo Talep Et' : 'Request a Demo';

  return (
    <>
      <PageHeader ust={headerUst} baslik={headerBaslik} aciklama={headerAciklama} />

      {/* Intro section */}
      <Section tone="muted">
        <div className="max-w-3xl">
          {introParagraphs.map((p, i) => (
            <p key={i} className={`text-base leading-relaxed text-muted${i > 0 ? ' mt-4' : ''}`}>
              {p}
            </p>
          ))}
        </div>
      </Section>

      {/* Product grid */}
      <Section>
        <h2 className="font-display text-2xl font-bold text-foreground mb-8">
          {isTr ? 'Ürünlerimiz' : 'Our Products'}
        </h2>
        <ProductGrid products={products} locale={locale} />
      </Section>

      {/* CTA */}
      <Cta
        baslik={ctaBaslik}
        aciklama={ctaAciklama}
        buton={{ etiket: ctaButonEtiket, href: '/iletisim' }}
      />
    </>
  );
}
