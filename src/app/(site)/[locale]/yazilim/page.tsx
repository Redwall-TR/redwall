import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { isLocale, pick } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { getProducts, getService } from '@/lib/cms/queries';
import { Section, Cta } from '@/components/ui';
import { ServiceIcon } from '@/components/ui/icons';
import { PageHero } from '@/components/sections/PageHero';
import { SectionHeading, IntroLead } from '@/components/sections/page-blocks';
import ProductGrid, { type ProductCard } from '@/components/sections/ProductGrid';
import { RichContent } from '@/components/ui/RichContent';
import { ACCENT } from '@/lib/theme';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocaleString {
  tr: string;
  en: string;
}

interface ServiceData {
  isKolu: string;
  baslik: LocaleString;
  ozet: LocaleString;
  chips?: Array<Record<'tr' | 'en', unknown>>;
  girisLead?: Record<'tr' | 'en', unknown>;
  girisParagraflar?: Array<Record<'tr' | 'en', unknown>>;
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
    getService('yazilim') as Promise<ServiceData | null>,
    getProducts() as Promise<ProductCard[]>,
  ]);

  const isTr = locale === 'tr';

  // Hero content
  const heroEyebrow = isTr ? 'Yazılım' : 'Software';
  const heroBaslik =
    service?.baslik ? (pick(service.baslik, locale) ?? (isTr ? 'Yazılım Ürünlerimiz' : 'Our Software Products')) : (isTr ? 'Yazılım Ürünlerimiz' : 'Our Software Products');
  const heroAciklama =
    service?.ozet
      ? (pick(service.ozet, locale) ?? undefined)
      : isTr
        ? 'Fikri mülkiyeti bize ait YangınPro ve MekanikPro — yangın ve mekanik mühendislik süreçlerini dijitalleştiren özgün yazılım çözümleri.'
        : 'YangınPro and MekanikPro — proprietary software solutions owned by Redwall that digitise fire and mechanical engineering workflows.';

  // Chips — CMS'ten (service.chips); yoksa varsayılan
  const heroChips =
    service?.chips && service.chips.length > 0
      ? service.chips
          .map((c) => pick(c, locale))
          .filter((v): v is string => typeof v === 'string' && v.length > 0)
      : isTr
        ? ['YangınPro', 'MekanikPro', 'Bulut Tabanlı', 'Ar-Ge']
        : ['YangınPro', 'MekanikPro', 'Cloud-Based', 'R&D'];

  // Intro (giriş) — CMS'ten (service.girisLead / girisParagraflar, richText); yoksa
  // varsayılan metin. RichContent hem Lexical'i hem düz string fallback'i render eder.
  const introLead: unknown =
    (service?.girisLead ? pick(service.girisLead, locale) : undefined) ??
    (isTr
      ? 'Redwall Yazılım iş kolu, yangın ve mekanik mühendislik alanlarında kullanılan ve fikri mülkiyeti tamamen bize ait yazılım ürünleri geliştirmektedir.'
      : "Redwall's Software arm develops engineering software products — fully owned intellectual property — for the fire-safety and mechanical engineering sectors.");
  const introBody: unknown[] =
    service?.girisParagraflar && service.girisParagraflar.length > 0
      ? service.girisParagraflar.map((p) => pick(p, locale))
      : isTr
        ? [
            'YangınPro ve MekanikPro, sektörün ihtiyaçlarından yola çıkılarak Ar-Ge süreçlerimizle tasarlanmış ve yerli mühendislik zekâsının ürünüdür.',
            'Bu ürünleri geliştiriyor, markalaştırıyor ve pazarlıyoruz. Kullanıcılarımız; rutin hesaplamalardan mevzuat uyumu kontrolüne kadar her aşamada dijital desteğe kavuşurken, firmamız yazılım gelirleriyle sürdürülebilir Ar-Ge döngüsünü finanse etmektedir.',
          ]
        : [
            'YangınPro and MekanikPro were conceived through our R&D process, built around real-world engineering needs, and represent homegrown engineering intelligence.',
            'We develop, brand, and market these products ourselves. While users gain digital support at every stage — from routine calculations to regulatory compliance checks — the software revenue finances our sustainable R&D cycle.',
          ];

  // Products section heading
  const productsEyebrow = isTr ? 'Ürünler' : 'Products';
  const productsBaslik = isTr ? 'Yazılım Ürünlerimiz' : 'Our Software Products';

  // CTA content
  const ctaBaslik = isTr ? 'Demo Talep Edin' : 'Request a Demo';
  const ctaAciklama = isTr
    ? 'YangınPro veya MekanikPro hakkında ücretsiz demo almak için bize ulaşın.'
    : 'Contact us for a free demo of YangınPro or MekanikPro.';
  const ctaButonEtiket = isTr ? 'Demo Talep Et' : 'Request a Demo';

  return (
    <>
      <PageHero
        eyebrow={heroEyebrow}
        title={heroBaslik}
        description={heroAciklama}
        accent={ACCENT}
        chips={heroChips}
        glyph={<ServiceIcon name="code" className="h-[26rem] w-[26rem]" />}
      />

      {/* Intro section */}
      <Section tone="muted">
        <IntroLead
          lead={<RichContent value={introLead} />}
          body={introBody.map((p, i) => (
            <RichContent key={i} value={p} />
          ))}
          accent={ACCENT}
        />
      </Section>

      {/* Product grid */}
      <Section>
        <SectionHeading
          eyebrow={productsEyebrow}
          title={productsBaslik}
          accent={ACCENT}
        />
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
