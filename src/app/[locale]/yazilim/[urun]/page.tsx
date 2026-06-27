import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { isLocale, pick, LOCALES } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { sanityFetch } from '@/sanity/lib/fetch';
import { PRODUCT_QUERY, PRODUCTS_QUERY } from '@/sanity/lib/queries';
import { Section, Cta } from '@/components/ui';
import { ServiceIcon } from '@/components/ui/icons';
import { PageHero } from '@/components/sections/PageHero';
import { SectionHeading, FeatureCard } from '@/components/sections/page-blocks';
import ProductFeatures, { type Feature } from '@/components/sections/ProductFeatures';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocaleString {
  tr: string;
  en: string;
}

interface ProductData {
  ad: string;
  slogan?: LocaleString;
  aciklama?: LocaleString;
  ozellikler?: Array<{ baslik?: LocaleString; aciklama?: LocaleString }>;
  hedefKitle?: LocaleString[];
  ekranGorselleri?: unknown[];
}

interface ProductsListItem {
  slug: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCENT = '#e63950';

// ── Known product slugs (always prerender) ────────────────────────────────────

const KNOWN_SLUGS = ['yanginpro', 'mekanikpro'] as const;
type KnownSlug = (typeof KNOWN_SLUGS)[number];

function isKnownSlug(s: string): s is KnownSlug {
  return (KNOWN_SLUGS as readonly string[]).includes(s);
}

// ── Feature icon mapping (index-based per product) ───────────────────────────

const FEATURE_ICONS: Record<KnownSlug, string[]> = {
  yanginpro: ['shield-check', 'building', 'ruler', 'document', 'key', 'gauge'],
  mekanikpro: ['gauge', 'ruler', 'droplet', 'wrench', 'document', 'refresh'],
};

// ── Fallback content ──────────────────────────────────────────────────────────

const FALLBACK: Record<KnownSlug, { ad: string; slogan: LocaleString; aciklama: LocaleString; ozellikler: Feature[]; hedefKitle: LocaleString[] }> = {
  yanginpro: {
    ad: 'YangınPro',
    slogan: {
      tr: 'Bina Yangın Güvenliği Uyumluluğunu Otomatikleştirin',
      en: 'Automate Building Fire-Safety Compliance',
    },
    aciklama: {
      tr: 'YangınPro, Türkiye yangın güvenliği yönetmelikleri (BYKHY 2007/2024) kapsamında bina, kat ve oda detayında yapı verisini değerlendiren bir uyumluluk ve denetim platformudur. Kural motoru uyumsuzlukları otomatik tespit eder, raporlar ve takip eder; belediyeler ve kurumlar tüm denetim süreçlerini tek bir bulut tabanlı sistemde yönetir. SaaS olarak veya kendi sunucunuzda (self-hosted) çalışır.',
      en: 'YangınPro is a compliance and inspection platform that evaluates structural data at the building, floor, and room level under Turkey\'s fire-safety regulations (BYKHY 2007/2024). Its rule engine automatically detects, reports, and tracks non-compliances, letting municipalities and institutions manage the entire inspection process in one cloud-based system. Runs as SaaS or self-hosted on your own servers.',
    },
    ozellikler: [
      {
        baslik: { tr: 'Kural Motoru ile Otomatik Denetim', en: 'Automated Inspection via Rule Engine' },
        aciklama: {
          tr: 'Binayı yürürlükteki yangın güvenliği yönetmeliğiyle (BYKHY 2007/2024) otomatik karşılaştırır; uyumsuzlukları madde bazında tespit eder ve düzeltme önerileri sunar.',
          en: 'Automatically compares the building against the current fire-safety regulation (BYKHY 2007/2024), detecting non-compliances article by article and offering remediation recommendations.',
        },
      },
      {
        baslik: { tr: 'Bina · Kat · Oda Yapı Modeli', en: 'Building · Floor · Room Data Model' },
        aciklama: {
          tr: 'Yapı verisini bina, kat ve oda hiyerarşisinde detaylı girin; kullanım amacı, alan ve ekipman bilgileriyle her mekânı eksiksiz tanımlayın.',
          en: 'Enter structural data in a building–floor–room hierarchy; fully define each space with its usage, area, and equipment details.',
        },
      },
      {
        baslik: { tr: '3B Bina Görselleştirme', en: '3D Building Visualisation' },
        aciklama: {
          tr: 'Girilen yapı verisini etkileşimli 3B modelle önizleyin; katları ve mekânları görsel olarak inceleyerek hataları erken yakalayın.',
          en: 'Preview the entered structural data as an interactive 3D model; review floors and spaces visually to catch errors early.',
        },
      },
      {
        baslik: { tr: 'Otomatik Rapor & PDF Export', en: 'Automated Reporting & PDF Export' },
        aciklama: {
          tr: 'Uygunluk raporlarını, eksiklik listelerini ve denetim çıktılarını tek tıkla PDF olarak üretin; başvuru ve arşiv için hazır belgeler.',
          en: 'Generate compliance reports, deficiency lists, and inspection outputs as PDFs with one click — documents ready for submissions and archiving.',
        },
      },
      {
        baslik: { tr: 'Çok Kiracılı Kurum Yönetimi', en: 'Multi-Tenant Institution Management' },
        aciklama: {
          tr: 'Kurum hiyerarşisi, rol bazlı yetkilendirme ve abonelik yönetimiyle birden fazla kurumu ve kullanıcıyı güvenle yönetin.',
          en: 'Manage multiple institutions and users securely with institution hierarchy, role-based access control, and subscription management.',
        },
      },
      {
        baslik: { tr: 'Gerçek Zamanlı Bildirim & Takip', en: 'Real-Time Notifications & Tracking' },
        aciklama: {
          tr: 'Analiz tamamlandığında anlık bildirim alın; denetim durumunu, geçmişi ve aktiviteleri tek panelden gerçek zamanlı takip edin.',
          en: 'Receive instant notifications when analysis completes; track inspection status, history, and activity in real time from a single panel.',
        },
      },
    ],
    hedefKitle: [
      { tr: 'Belediye yangın denetim birimleri', en: 'Municipal fire-inspection units' },
      { tr: 'Bina yöneticileri', en: 'Building managers' },
      { tr: 'AVM ve otel işletmecileri', en: 'Shopping-mall and hotel operators' },
      { tr: 'Mühendislik ve danışmanlık firmaları', en: 'Engineering and consulting firms' },
    ],
  },
  mekanikpro: {
    ad: 'MekanikPro',
    slogan: {
      tr: 'Mekanik Hesapları Otomatikleştirin',
      en: 'Automate Mechanical Calculations',
    },
    aciklama: {
      tr: 'MekanikPro, ısıtma-soğutma yükü hesapları, tesisat boyutlandırma, sıhhi tesisat ve mekanik HVAC mühendisliği süreçlerini tek platformda otomatikleştiren yazılımdır. Proje sürelerini kısaltın, hesap hatalarını sıfıra indirin ve profesyonel raporlarla teslim hızınızı artırın.',
      en: 'MekanikPro is software that automates heating-cooling load calculations, installation sizing, plumbing, and mechanical HVAC engineering workflows on a single platform. Shorten project timelines, reduce calculation errors to zero, and increase your delivery speed with professional reports.',
    },
    ozellikler: [
      {
        baslik: { tr: 'Isı Kaybı & Kazancı Hesabı', en: 'Heat Loss & Gain Calculation' },
        aciklama: {
          tr: 'TS 825 ve ASHRAE 62.1 standartlarına uygun bölge bazlı ısıtma ve soğutma yükü hesapları; çoklu iklim bölgesi desteği.',
          en: 'Zone-based heating and cooling load calculations compliant with TS 825 and ASHRAE 62.1; supports multiple climate zones.',
        },
      },
      {
        baslik: { tr: 'Tesisat Boyutlandırma', en: 'Installation Sizing' },
        aciklama: {
          tr: 'Hava kanalı ve boru ağı boyutlandırma hesapları; basınç kayıpları, hız profilleri ve enerji verimliliği analizleri.',
          en: 'Air duct and pipe network sizing calculations; pressure losses, velocity profiles, and energy-efficiency analyses.',
        },
      },
      {
        baslik: { tr: 'Sıhhi Tesisat Hesapları', en: 'Plumbing Calculations' },
        aciklama: {
          tr: 'Soğuk-sıcak su tesisat debisi ve basınç hesapları, pis su ağı boyutlandırma ve hidrolik denge analizi.',
          en: 'Cold and hot water installation flow and pressure calculations, drainage network sizing, and hydraulic balance analysis.',
        },
      },
      {
        baslik: { tr: 'HVAC Ekipman Seçimi', en: 'HVAC Equipment Selection' },
        aciklama: {
          tr: 'Hesap sonuçlarına göre klima santrali, fan-coil, kazan ve soğutma grubu seçim önerileri; enerji tüketimi karşılaştırması.',
          en: 'Equipment selection recommendations for air handling units, fan coils, boilers, and chillers based on calculation results; energy-consumption comparison.',
        },
      },
      {
        baslik: { tr: 'Otomatik Rapor Üretimi', en: 'Automatic Report Generation' },
        aciklama: {
          tr: 'Mekanik hesap raporu, teknik şartname ve malzeme listelerini PDF / Word formatında tek tıkla üretir; proje teslim paketinizi hazır hale getirir.',
          en: 'Generates mechanical calculation reports, technical specifications, and material lists in PDF / Word format with a single click; prepares your project delivery package.',
        },
      },
      {
        baslik: { tr: 'Proje Arşivi & İşbirliği', en: 'Project Archive & Collaboration' },
        aciklama: {
          tr: 'Tüm mekanik projelerinizi bulut tabanlı arşivde saklayın; ekip üyeleriyle eş zamanlı çalışın ve revizyon geçmişini takip edin.',
          en: 'Store all your mechanical projects in a cloud-based archive; work simultaneously with team members and track revision history.',
        },
      },
    ],
    hedefKitle: [
      { tr: 'Makine mühendisleri ve HVAC tasarımcıları', en: 'Mechanical engineers and HVAC designers' },
      { tr: 'Mekanik taahhüt firmaları', en: 'Mechanical contracting firms' },
      { tr: 'Proje yönetim ve mühendislik ofisleri', en: 'Project management and engineering offices' },
      { tr: 'Bina enerji verimliliği danışmanları', en: 'Building energy-efficiency consultants' },
    ],
  },
};

// ── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const products = await sanityFetch<ProductsListItem[]>(PRODUCTS_QUERY, {}, []);

  const slugs: string[] =
    products.length > 0
      ? products.map((p) => p.slug).filter(Boolean)
      : [...KNOWN_SLUGS];

  return slugs.flatMap((slug) =>
    LOCALES.map((locale) => ({ locale, urun: slug }))
  );
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; urun: string }>;
}): Promise<Metadata> {
  const { locale, urun } = await params;
  const loc = isLocale(locale) ? locale : 'tr';

  const data = await sanityFetch<ProductData | null>(PRODUCT_QUERY, { slug: urun }, null);

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

// ── Decorative mockup ─────────────────────────────────────────────────────────

function DashboardMockup({ productName, locale }: { productName: string; locale: string }) {
  const isEn = locale === 'en';
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
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <span className="h-3 w-3 rounded-full bg-red-500/70" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
        <span className="h-3 w-3 rounded-full bg-green-500/70" />
        <span className="mx-auto text-xs text-white/30 font-mono">{productName}</span>
      </div>

      {/* Dashboard body */}
      <div className="p-6 grid grid-cols-3 gap-4">
        {/* Stat tiles */}
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-white/40">{tile.label}</span>
            <span className="text-2xl font-bold text-white">{tile.val}</span>
          </div>
        ))}

        {/* Bar chart mock */}
        <div className="col-span-2 rounded-xl bg-white/5 border border-white/10 p-4">
          <span className="text-[10px] uppercase tracking-wider text-white/40 mb-3 block">
            {isEn ? 'Monthly Calculations' : 'Aylık Hesaplar'}
          </span>
          <div className="flex items-end gap-2 h-16">
            {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-primary/60"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* Status list mock */}
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function UrunDetayPage({
  params,
}: {
  params: Promise<{ locale: string; urun: string }>;
}) {
  const { locale, urun } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const data = await sanityFetch<ProductData | null>(PRODUCT_QUERY, { slug: urun }, null);

  // Unknown slug → 404
  if (!data && !isKnownSlug(urun)) notFound();

  // Resolve content: Sanity data or fallback
  const fb = isKnownSlug(urun) ? FALLBACK[urun] : null;

  const ad = data?.ad ?? fb?.ad ?? urun;
  const slogan =
    (data?.slogan ? pick(data.slogan, locale) : undefined) ??
    (fb?.slogan ? pick(fb.slogan, locale) : undefined) ??
    undefined;
  const aciklama =
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

  return (
    <>
      {/* Hero */}
      <PageHero
        eyebrow={isTr ? 'Yazılım Ürünü' : 'Software Product'}
        title={ad}
        description={aciklama ?? slogan}
        accent={ACCENT}
        chips={heroChips.length > 0 ? heroChips : undefined}
        glyph={<ServiceIcon name="gauge" className="h-[26rem] w-[26rem]" />}
      />

      {/* Interface mockup */}
      <Section tone="dark">
        <div className="max-w-3xl mx-auto">
          <DashboardMockup productName={ad} locale={locale} />
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
                <FeatureCard
                  key={i}
                  icon={iconList[i] ?? 'gauge'}
                  accent={ACCENT}
                  title={pick(feature.baslik, locale) ?? feature.baslik.tr}
                  description={pick(feature.aciklama, locale) ?? feature.aciklama.tr}
                />
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
