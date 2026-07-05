import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { isLocale, pick } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { getProduct } from '@/lib/cms/queries';
import { Section, Cta } from '@/components/ui';
import { ServiceIcon } from '@/components/ui/icons';
import { RichContent } from '@/components/ui/RichContent';
import { PageHero } from '@/components/sections/PageHero';
import { SectionHeading } from '@/components/sections/page-blocks';
import ProductFeatures, { type Feature } from '@/components/sections/ProductFeatures';
import { ACCENT } from '@/lib/theme';
import { FALLBACK, FEATURE_ICONS, KNOWN_SLUGS, type KnownSlug, type LocaleString } from '@/data/urun-fallback';
import { JsonLd } from '@/components/seo/JsonLd';
import { softwareAppJsonLd, breadcrumbJsonLd } from '@/lib/jsonLd';
import { lexicalToPlainText } from '@/lib/lexicalToPlainText';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RichLocaleString {
  tr: unknown;
  en: unknown;
}

interface ProductData {
  ad: string;
  slogan?: LocaleString;
  aciklama?: RichLocaleString;
  ozellikler?: Array<{ baslik?: LocaleString; aciklama?: RichLocaleString; icon?: string }>;
  hedefKitle?: LocaleString[];
  ekranGorselleri?: unknown[];
}

function isKnownSlug(s: string): s is KnownSlug {
  return (KNOWN_SLUGS as readonly string[]).includes(s);
}

// ── Rendering ───────────────────────────────────────────────────────────────
// CMS-backed sayfa: Payload Local API i18n için headers() okur → statik üretim
// DYNAMIC_SERVER_USAGE verir. Detay tamamen dinamik (on-demand) render edilir.
export const dynamic = 'force-dynamic';

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; urun: string }>;
}): Promise<Metadata> {
  const { locale, urun } = await params;
  const loc = isLocale(locale) ? locale : 'tr';

  const data = await getProduct(urun) as ProductData | null;

  let ad = urun;
  let slogan: string | undefined;

  if (data) {
    ad = data.ad ?? urun;
    slogan = data.slogan ? (pick(data.slogan, loc) ?? undefined) : undefined;
  } else if (isKnownSlug(urun)) {
    const fb = FALLBACK[urun];
    ad = fb.ad;
    slogan = pick(fb.slogan, loc) ?? undefined;
  }

  const baslik = `${ad} | Redwall`;
  const aciklama = slogan ?? (loc === 'tr' ? `${ad} — Redwall yazılım ürünü.` : `${ad} — Redwall software product.`);

  return buildMetadata({ baslik, aciklama, locale: loc, path: `/yazilim/${urun}` });
}

// ── Decorative mockups ────────────────────────────────────────────────────────

function MockupChrome({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
      <span className="h-3 w-3 rounded-full bg-red-500/70" />
      <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
      <span className="h-3 w-3 rounded-full bg-green-500/70" />
      <span className="mx-auto text-xs text-white/30 font-mono">{title}</span>
    </div>
  );
}

// YangınPro — building fire-safety compliance dashboard
function ComplianceMockup({ productName, isEn }: { productName: string; isEn: boolean }) {
  const tiles = [
    { label: isEn ? 'Buildings' : 'Binalar', val: '128', tone: 'text-white' },
    { label: isEn ? 'Compliance' : 'Uyumluluk', val: '87%', tone: 'text-green-400' },
    { label: isEn ? 'Findings' : 'Bulgular', val: '34', tone: 'text-amber' },
  ] as const;

  const statusMap = {
    ok: { label: isEn ? 'Compliant' : 'Uyumlu', cls: 'bg-green-400' },
    review: { label: isEn ? 'In review' : 'İnceleniyor', cls: 'bg-amber' },
    fail: { label: isEn ? 'Non-compliant' : 'Uyumsuz', cls: 'bg-red-500' },
  } as const;

  const buildings: { name: string; meta: string; pct: number; status: keyof typeof statusMap }[] = [
    { name: 'Plaza A', meta: isEn ? '24 floors' : '24 kat', pct: 96, status: 'ok' },
    { name: isEn ? 'Hotel D' : 'Otel D', meta: isEn ? '12 floors' : '12 kat', pct: 91, status: 'ok' },
    { name: isEn ? 'Hospital B' : 'Hastane B', meta: isEn ? '8 floors' : '8 kat', pct: 71, status: 'review' },
    { name: isEn ? 'Mall C' : 'AVM C', meta: isEn ? '5 floors' : '5 kat', pct: 58, status: 'fail' },
  ];

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-[#141416] shadow-2xl">
      <MockupChrome title={`${productName} · ${isEn ? 'Compliance' : 'Uyumluluk Paneli'}`} />
      <div className="p-6 space-y-4">
        {/* Stat tiles */}
        <div className="grid grid-cols-3 gap-4">
          {tiles.map((tile) => (
            <div key={tile.label} className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-white/40">{tile.label}</span>
              <span className={`text-2xl font-bold ${tile.tone}`}>{tile.val}</span>
            </div>
          ))}
        </div>

        {/* Building inspection list */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <span className="text-[10px] uppercase tracking-wider text-white/40 mb-3 block">
            {isEn ? 'Building Inspection Status' : 'Bina Denetim Durumu'}
          </span>
          <div className="space-y-3">
            {buildings.map((b) => {
              const s = statusMap[b.status];
              return (
                <div key={b.name} className="flex items-center gap-3">
                  <span className={`h-2 w-2 flex-shrink-0 rounded-full ${s.cls}`} />
                  <div className="w-24 flex-shrink-0">
                    <div className="truncate text-xs text-white/80">{b.name}</div>
                    <div className="text-[10px] text-white/35">{b.meta}</div>
                  </div>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full ${s.cls}`} style={{ width: `${b.pct}%` }} />
                  </div>
                  <span className="w-20 flex-shrink-0 text-right text-[10px] text-white/50">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rule engine strip */}
        <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
          <span
            className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3 4 6v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V6l-8-3Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <span className="text-[11px] text-white/55">
            {isEn ? 'BYKHY 2007/2024 · 2,090 rules evaluated' : 'BYKHY 2007/2024 · 2.090 kural değerlendirildi'}
          </span>
        </div>
      </div>
    </div>
  );
}

// MekanikPro (and other calc-style products) — calculation dashboard
function CalcMockup({ productName, isEn }: { productName: string; isEn: boolean }) {
  const tiles = [
    { label: isEn ? 'Projects' : 'Projeler', val: '24' },
    { label: isEn ? 'Calculations' : 'Hesaplar', val: '186' },
    { label: isEn ? 'Reports' : 'Raporlar', val: '52' },
  ];
  const statusItems = isEn
    ? ['Completed', 'In progress', 'Awaiting approval']
    : ['Tamamlandı', 'Devam ediyor', 'Onay bekliyor'];

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-[#141416] shadow-2xl">
      <MockupChrome title={productName} />
      <div className="p-6 grid grid-cols-3 gap-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-white/40">{tile.label}</span>
            <span className="text-2xl font-bold text-white">{tile.val}</span>
          </div>
        ))}
        <div className="col-span-2 rounded-xl bg-white/5 border border-white/10 p-4">
          <span className="text-[10px] uppercase tracking-wider text-white/40 mb-3 block">
            {isEn ? 'Monthly Calculations' : 'Aylık Hesaplar'}
          </span>
          <div className="flex items-end gap-2 h-16">
            {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
              <div key={i} className="flex-1 rounded-sm bg-primary/60" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider text-white/40">
            {isEn ? 'Status' : 'Durum'}
          </span>
          {statusItems.map((s) => (
            <div key={s} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
              <span className="text-[10px] text-white/50 truncate">{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardMockup({ productName, locale, slug }: { productName: string; locale: string; slug: string }) {
  const isEn = locale === 'en';
  return slug === 'yanginpro' ? (
    <ComplianceMockup productName={productName} isEn={isEn} />
  ) : (
    <CalcMockup productName={productName} isEn={isEn} />
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function UrunDetayPage({
  params,
}: {
  params: Promise<{ locale: string; urun: string }>;
}) {
  const { locale, urun } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const data = await getProduct(urun) as ProductData | null;

  // Yayında değil veya bulunamadı → 404. (getProduct, yayinda==true filtreler;
  // yayından kaldırılan ürün KNOWN_SLUGS fallback'ine düşmeden 404 olur.)
  if (!data) notFound();

  // Resolve content: Sanity data or fallback
  const fb = isKnownSlug(urun) ? FALLBACK[urun] : null;

  const ad = data?.ad ?? fb?.ad ?? urun;
  const slogan =
    (data?.slogan ? pick(data.slogan, locale) : undefined) ??
    (fb?.slogan ? pick(fb.slogan, locale) : undefined) ??
    undefined;
  const aciklama: unknown =
    (data?.aciklama ? pick(data.aciklama, locale) : undefined) ??
    (fb?.aciklama ? pick(fb.aciklama, locale) : undefined) ??
    undefined;

  // Features: use Sanity ozellikler if non-empty, else fallback
  const rawFeatures =
    data?.ozellikler && data.ozellikler.length > 0 ? data.ozellikler : (fb?.ozellikler ?? []);
  const features: Feature[] = rawFeatures.filter(
    (f): f is Feature => !!f.baslik && !!f.aciklama
  );

  // Target audience
  const hedefKitle: LocaleString[] =
    data?.hedefKitle && data.hedefKitle.length > 0 ? data.hedefKitle : (fb?.hedefKitle ?? []);

  const isTr = locale === 'tr';

  // Hero chips — first feature titles (up to 4)
  const heroChips = features.slice(0, 4).map(
    (f) => pick(f.baslik, locale) ?? f.baslik.tr
  );

  // Icon list for features
  const iconList = isKnownSlug(urun) ? FEATURE_ICONS[urun] : [];

  // Section labels
  const featuresEyebrow = isTr ? 'Özellikler' : 'Features';
  const featuresBaslik = isTr ? `${ad} Yetenekleri` : `${ad} Capabilities`;
  const featuresAciklama = isTr
    ? `${ad}'ın öne çıkan yetenekleri`
    : `Key capabilities of ${ad}`;

  const audienceTitle = isTr ? 'Kimler İçin?' : 'Who Is It For?';
  const audienceSubtitle = isTr
    ? `${ad} şu kullanıcı gruplarına hitap etmektedir:`
    : `${ad} is designed for the following user groups:`;

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://redwall.tr';
  const urunUrl = `${SITE_URL}/${locale}/yazilim/${urun}`;
  const appDescription = aciklama != null ? lexicalToPlainText(aciklama) || undefined : undefined;
  const appLd = softwareAppJsonLd({
    name: ad,
    description: appDescription,
    url: urunUrl,
    category: 'BusinessApplication',
  });
  const bcLd = breadcrumbJsonLd([
    { name: isTr ? 'Ana Sayfa' : 'Home', url: `${SITE_URL}/${locale}` },
    { name: isTr ? 'Yazılım' : 'Software', url: `${SITE_URL}/${locale}/yazilim` },
    { name: ad, url: urunUrl },
  ]);

  return (
    <>
      <JsonLd data={appLd} />
      <JsonLd data={bcLd} />
      {/* Hero */}
      <PageHero
        eyebrow={isTr ? 'Yazılım Ürünü' : 'Software Product'}
        title={ad}
        description={slogan}
        accent={ACCENT}
        chips={heroChips.length > 0 ? heroChips : undefined}
        glyph={<ServiceIcon name="gauge" className="h-[26rem] w-[26rem]" />}
      />

      {/* Ürün Hakkında */}
      {aciklama != null && (
        <Section>
          <RichContent value={aciklama} className="prose prose-neutral dark:prose-invert max-w-none" />
        </Section>
      )}

      {/* Interface mockup */}
      <Section tone="dark">
        <div className="max-w-3xl mx-auto">
          <DashboardMockup productName={ad} locale={locale} slug={urun} />
        </div>
      </Section>

      {/* Features */}
      {features.length > 0 && (
        <Section>
          <SectionHeading
            eyebrow={featuresEyebrow}
            title={featuresBaslik}
            description={featuresAciklama}
            accent={ACCENT}
          />
          {iconList.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-7 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                >
                  <span
                    className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-200 group-hover:scale-x-100"
                    style={{ backgroundColor: ACCENT }}
                    aria-hidden
                  />
                  <div
                    className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${ACCENT}14`, color: ACCENT }}
                  >
                    <ServiceIcon name={feature.icon ?? iconList[i] ?? 'gauge'} className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground">
                    {pick(feature.baslik, locale) ?? feature.baslik.tr}
                  </h3>
                  <RichContent
                    value={pick(feature.aciklama as Record<'tr' | 'en', unknown>, locale)}
                    className="mt-2.5 text-sm leading-relaxed text-muted prose prose-sm max-w-none dark:prose-invert prose-p:my-0"
                  />
                </div>
              ))}
            </div>
          ) : (
            <ProductFeatures features={features} locale={locale} />
          )}
        </Section>
      )}

      {/* Target audience */}
      {hedefKitle.length > 0 && (
        <Section tone="muted">
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              {audienceTitle}
            </h2>
            <p className="mt-2 text-muted text-sm max-w-xl mx-auto">
              {audienceSubtitle}
            </p>
          </div>
          <ul className="mx-auto max-w-2xl grid gap-3 sm:grid-cols-2">
            {hedefKitle.map((item, i) => {
              const label = pick(item, locale) ?? item.tr;
              return (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-border bg-background px-5 py-4"
                >
                  <span
                    className="mt-0.5 flex-shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${ACCENT}1a`, color: ACCENT }}
                  >
                    <svg
                      className="h-3 w-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span className="text-sm text-foreground leading-snug">{label}</span>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {/* Demo CTA */}
      <Cta
        baslik={isTr ? `${ad} ile Tanışın` : `Meet ${ad}`}
        aciklama={
          isTr
            ? `${ad}'ı ücretsiz demo ile keşfedin. Ekibimiz sizinle iletişime geçsin.`
            : `Explore ${ad} with a free demo. Our team will get in touch with you.`
        }
        buton={{
          etiket: isTr ? 'Demo Talep Et' : 'Request a Demo',
          href: '/iletisim',
        }}
      />
    </>
  );
}
