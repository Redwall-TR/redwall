import type { CSSProperties } from 'react';
import { getPage } from '@/lib/cms/queries';
import { pick, type Locale } from '@/lib/locales';
import { Section, Cta } from '@/components/ui';
import { PageHero } from '@/components/sections/PageHero';
import {
  SectionHeading,
  FeatureCard,
  IntroLead,
} from '@/components/sections/page-blocks';
import { ServiceIcon } from '@/components/ui/icons';

// ── Types ─────────────────────────────────────────────────────────────────────

type Slug = 'hakkimizda' | 'vizyon-misyon' | 'kalite-belgeler';
type LocaleString = { tr: string; en: string };

interface PageCard {
  icon?: string;
  baslik?: LocaleString;
  aciklama?: LocaleString;
}

interface PageData {
  baslik?: LocaleString;
  altBaslik?: LocaleString;
  chips?: LocaleString[];
  girisLead?: LocaleString;
  girisParagraflar?: LocaleString[];
  vizyonBaslik?: LocaleString;
  vizyonMetin?: LocaleString;
  misyonBaslik?: LocaleString;
  misyonMetin?: LocaleString;
  kartlarEyebrow?: LocaleString;
  kartlarBaslik?: LocaleString;
  kartlarAciklama?: LocaleString;
  kartlar?: PageCard[];
}

// ── Shared accent ─────────────────────────────────────────────────────────────

const ACCENT = '#e63950';

// ── Fallback titles ───────────────────────────────────────────────────────────

const FALLBACK_TITLES: Record<Slug, Record<Locale, string>> = {
  'hakkimizda': {
    tr: 'Hakkımızda',
    en: 'About Us',
  },
  'vizyon-misyon': {
    tr: 'Vizyon & Misyon',
    en: 'Vision & Mission',
  },
  'kalite-belgeler': {
    tr: 'Kalite & Belgeler',
    en: 'Quality & Certificates',
  },
};

const FALLBACK_SUBTITLES: Record<Slug, Record<Locale, string>> = {
  'hakkimizda': {
    tr: 'Yangın güvenliğinde yazılımı, danışmanlığı ve mühendisliği tek çatı altında birleştiren bütünleşik bir yapı',
    en: 'An integrated approach that unites software, consulting, and engineering under one roof for fire safety',
  },
  'vizyon-misyon': {
    tr: 'Güvenli bir gelecek inşa etmek için rehberimiz',
    en: 'Our guiding principles for building a safer future',
  },
  'kalite-belgeler': {
    tr: 'Standartlara bağlılığımız ve belgelendirme süreçlerimiz',
    en: 'Our commitment to standards and certification processes',
  },
};

// ── Hakkımızda Fallback ───────────────────────────────────────────────────────

function HakkimizdaFallback({ locale }: { locale: Locale }) {
  const isTr = locale === 'tr';

  const highlights = isTr
    ? [
        {
          icon: 'code',
          baslik: 'Yazılım',
          aciklama:
            'Fikri mülkiyeti bize ait YangınPro ve MekanikPro ürünleriyle mühendislerin hesaplama ve raporlama süreçlerini dijitalleştiriyoruz.',
        },
        {
          icon: 'shield-check',
          baslik: 'Danışmanlık',
          aciklama:
            'İtfaiye mevzuatına tam uyum için proje başından onaya kadar yanınızdayız; ruhsat süreçlerini uçtan uca yönetiyoruz.',
        },
        {
          icon: 'wrench',
          baslik: 'Mühendislik',
          aciklama:
            'Aktif söndürme sistemleri, pasif yangın koruması ve mekanik tesisat alanlarında tasarımdan sahaya kadar çözüm üretiyoruz.',
        },
      ]
    : [
        {
          icon: 'code',
          baslik: 'Software',
          aciklama:
            'We digitise calculation and reporting workflows with YangınPro and MekanikPro — proprietary products developed in-house.',
        },
        {
          icon: 'shield-check',
          baslik: 'Consulting',
          aciklama:
            'We stay by your side from project inception through fire-authority approval, managing the permitting process end to end.',
        },
        {
          icon: 'wrench',
          baslik: 'Engineering',
          aciklama:
            'We deliver field solutions in active suppression, passive fire protection, and mechanical installation — from design to completion.',
        },
      ];

  const leadTr =
    'Redwall Yangın Danışmanlık Yazılım ve Mühendislik Hizmetleri LTD Şti., yangın güvenliği alanında üç kritik disiplini — yazılım geliştirme, mevzuat danışmanlığı ve mühendislik uygulamaları — tek bir çatı altında buluşturmak amacıyla kurulmuştur.';

  const leadEn =
    'Redwall Fire Safety was founded with a clear purpose: to bring together three critical disciplines — software development, regulatory consulting, and engineering applications — under a single roof.';

  const bodyTr = [
    'Bu bütünleşik yapı, bir projenin dijital hesaplama aşamasından itfaiye onayına, oradan da sahaya kadar kesintisiz bir süreç yönetimi sağlar. Sektörde on yılı aşkın birikimiyle Redwall; oteller, alışveriş merkezleri, endüstriyel tesisler ve kamu yapıları başta olmak üzere Türkiye genelinde 500\'den fazla projede yangın güvenliği çözümleri sunmuştur.',
    'Redwall\'un temel farkı, bu üç disiplinin ayrı ekipler yerine ortak bir bilgi havuzu ve süreç mimarisinden beslenmesidir. Böylece yazılımda üretilen veriler danışmanlık sürecini besler, danışmanlıkta elde edilen saha deneyimi yazılımın gelişimine geri döner ve mühendislik uygulamaları gerçek proje gereksinimlerine göre sürekli güncellenir.',
  ];

  const bodyEn = [
    'This integrated structure enables seamless project management from the digital calculation phase through fire-authority approval and all the way to field implementation. With over a decade of industry experience, Redwall has delivered fire safety solutions across more than 500 projects throughout Turkey, including hotels, shopping centres, industrial facilities, and public buildings.',
    'Redwall\'s key differentiator is that all three disciplines draw from a shared knowledge base and process architecture rather than operating as separate silos. Data generated by software enriches the consulting process; field experience gathered during consulting cycles back into product development; and engineering applications are continuously refined to reflect real project requirements.',
  ];

  return (
    <>
      {/* ── Company story ─────────────────────────────────────────── */}
      <Section>
        <IntroLead
          lead={isTr ? leadTr : leadEn}
          body={isTr ? bodyTr : bodyEn}
          accent={ACCENT}
        />
      </Section>

      {/* ── Neden Redwall / Why Redwall ───────────────────────────── */}
      <Section tone="muted">
        <SectionHeading
          eyebrow={isTr ? 'Neden Redwall' : 'Why Redwall'}
          title={isTr ? 'Üç Disiplin, Tek Çatı' : 'Three Disciplines, One Roof'}
          description={
            isTr
              ? 'Yazılım, danışmanlık ve mühendislik kollarımız ortak bir bilgi havuzundan beslenerek entegre çözümler üretir.'
              : 'Our software, consulting, and engineering arms draw from a shared knowledge base to deliver integrated solutions.'
          }
          accent={ACCENT}
        />
        <div className="grid gap-6 sm:grid-cols-3">
          {highlights.map((item) => (
            <FeatureCard
              key={item.baslik}
              icon={item.icon}
              title={item.baslik}
              description={item.aciklama}
              accent={ACCENT}
            />
          ))}
        </div>
      </Section>
    </>
  );
}

// ── Vizyon-Misyon Fallback ────────────────────────────────────────────────────

function VizyonMisyonFallback({ locale }: { locale: Locale }) {
  const isTr = locale === 'tr';

  const degerler = isTr
    ? [
        {
          icon: 'shield-check',
          baslik: 'Güvenlik',
          aciklama: 'İnsan hayatını ve mülkü korumak her kararımızın merkezindedir.',
        },
        {
          icon: 'clipboard',
          baslik: 'Uyumluluk',
          aciklama: 'Türk yapı mevzuatı ve uluslararası standartlara eksiksiz uyum sağlarız.',
        },
        {
          icon: 'gauge',
          baslik: 'Yenilikçilik',
          aciklama: 'Teknolojiyi ve veriyi kullanarak yangın güvenliği süreçlerini sürekli geliştiririz.',
        },
      ]
    : [
        {
          icon: 'shield-check',
          baslik: 'Safety',
          aciklama: 'Protecting human life and property is at the centre of every decision we make.',
        },
        {
          icon: 'clipboard',
          baslik: 'Compliance',
          aciklama: 'We ensure full adherence to Turkish building regulations and international standards.',
        },
        {
          icon: 'gauge',
          baslik: 'Innovation',
          aciklama: 'We continuously improve fire safety processes by harnessing technology and data.',
        },
      ];

  return (
    <>
      {/* ── Vizyon / Vision ───────────────────────────────────────── */}
      <Section>
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Vizyon panel */}
          <div
            className="rounded-2xl border p-8 lg:p-10"
            style={
              {
                borderColor: `${ACCENT}33`,
                background: `linear-gradient(135deg, ${ACCENT}08 0%, transparent 60%)`,
              } as CSSProperties
            }
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-6" style={{ backgroundColor: ACCENT }} aria-hidden />
              <span
                className="text-xs font-bold uppercase tracking-[0.25em]"
                style={{ color: ACCENT }}
              >
                {isTr ? 'VİZYON' : 'VISION'}
              </span>
            </div>
            <p className="font-display text-2xl font-bold leading-snug text-foreground sm:text-3xl">
              {isTr
                ? "Türkiye'nin Önde Gelen Bütünleşik Yangın Güvenliği Şirketi"
                : "Turkey's Leading Integrated Fire Safety Company"}
            </p>
            <p className="mt-5 text-base leading-relaxed text-muted">
              {isTr
                ? "Yazılım, danışmanlık ve mühendisliği tek çatı altında birleştirerek yangın güvenliği sektöründe Türkiye'nin referans noktası olmayı, geliştirdiğimiz teknoloji ürünleriyle bölgesel ölçekte tanınan bir marka hâline gelmeyi hedefliyoruz."
                : "Our vision is to become Turkey's definitive reference point in the fire safety sector by uniting software, consulting, and engineering under one roof — and to grow into a regionally recognised brand through the technology products we develop."}
            </p>
          </div>

          {/* Misyon panel */}
          <div className="rounded-2xl border border-border bg-surface p-8 lg:p-10">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-6 bg-foreground/30" aria-hidden />
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-muted">
                {isTr ? 'MİSYON' : 'MISSION'}
              </span>
            </div>
            <p className="font-display text-2xl font-bold leading-snug text-foreground sm:text-3xl">
              {isTr
                ? 'Teknolojiyle Güçlendirilmiş, Mevzuata Uygun Yangın Güvenliği'
                : 'Technology-Driven, Regulation-Compliant Fire Safety'}
            </p>
            <p className="mt-5 text-base leading-relaxed text-muted">
              {isTr
                ? 'İnsan hayatını ve mülkü korumak amacıyla yangın güvenliği projelerini mevzuata tam uyumlu ve teknoloji odaklı bir yaklaşımla yürütmek; yazılım araçlarımızla hesaplama süreçlerini hızlandırmak, danışmanlık hizmetlerimizle projeleri başarıyla onaya taşımak ve mühendislik uygulamalarımızla çözümleri sahaya eksiksiz yansıtmak.'
                : 'To carry out fire safety projects in a manner that is fully compliant with regulations and driven by technology — protecting human life and property; accelerating calculation processes through our software tools; guiding projects to successful regulatory approval through our consulting services; and translating solutions flawlessly into the field through our engineering applications.'}
            </p>
          </div>
        </div>
      </Section>

      {/* ── Değerlerimiz / Our Values ─────────────────────────────── */}
      <Section tone="muted">
        <SectionHeading
          eyebrow={isTr ? 'Değerlerimiz' : 'Our Values'}
          title={isTr ? 'Bizi Yönlendiren İlkeler' : 'The Principles That Guide Us'}
          accent={ACCENT}
        />
        <div className="grid gap-6 sm:grid-cols-3">
          {degerler.map((deger) => (
            <FeatureCard
              key={deger.baslik}
              icon={deger.icon}
              title={deger.baslik}
              description={deger.aciklama}
              accent={ACCENT}
            />
          ))}
        </div>
      </Section>
    </>
  );
}

// ── Kalite & Belgeler Fallback ────────────────────────────────────────────────

function KaliteBelgelerFallback({ locale }: { locale: Locale }) {
  const isTr = locale === 'tr';

  const belgeler = [
    {
      kod: 'ISO 9001',
      aciklama: isTr ? 'Kalite Yönetim Sistemi' : 'Quality Management System',
    },
    {
      kod: 'TSE',
      aciklama: isTr ? 'Türk Standartları Enstitüsü Uygunluğu' : 'Turkish Standards Institute Compliance',
    },
    {
      kod: 'TS EN 12845',
      aciklama: isTr ? 'Sabit Yangın Söndürme Sistemleri Standardı' : 'Fixed Firefighting Systems Standard',
    },
    {
      kod: 'NFPA 13',
      aciklama: isTr ? 'Sprinkler Sistemleri Kurulum Standardı' : 'Standard for Installation of Sprinkler Systems',
    },
    {
      kod: 'CE',
      aciklama: isTr ? 'Avrupa Uygunluk İşareti' : 'European Conformity Mark',
    },
    {
      kod: 'TS EN 54',
      aciklama: isTr ? 'Yangın Algılama ve Alarm Sistemleri' : 'Fire Detection and Fire Alarm Systems',
    },
  ];

  const leadTr =
    'Redwall olarak kalite, sunduğumuz her hizmetin ve geliştirdiğimiz her ürünün ayrılmaz bir parçasıdır. Yangın güvenliği projeleri insan hayatını doğrudan ilgilendirdiğinden, ulusal ve uluslararası standartlara uyumluluk bizim için bir tercih değil, zorunluluktur.';

  const leadEn =
    'At Redwall, quality is an inseparable part of every service we deliver and every product we develop. Because fire safety projects directly affect human life, compliance with national and international standards is not a choice for us — it is a requirement.';

  const bodyTr = [
    'Yazılım ürünlerimizden danışmanlık süreçlerimize, mühendislik uygulamalarından müşteri iletişimine kadar her adımda kalite güvencesi ilkesiyle hareket ediyoruz. Belge ve sertifikalarımız bu taahhüdün somut kanıtı olmakla birlikte, geçerliliğini ve güncelliğini korumak için periyodik denetimlerimiz aralıksız sürmektedir.',
  ];

  const bodyEn = [
    'We apply the principle of quality assurance at every step: from our software products and consulting processes to engineering applications and client communication. Our certificates and accreditations are the tangible proof of this commitment, and we carry out periodic audits on an ongoing basis to maintain their validity and currency.',
  ];

  return (
    <>
      {/* ── Quality approach ──────────────────────────────────────── */}
      <Section>
        <IntroLead
          lead={isTr ? leadTr : leadEn}
          body={isTr ? bodyTr : bodyEn}
          accent={ACCENT}
        />
      </Section>

      {/* ── Certificate grid ──────────────────────────────────────── */}
      <Section tone="muted">
        <SectionHeading
          eyebrow={isTr ? 'Belgelendirme' : 'Certification'}
          title={isTr ? 'Sertifikalar & Standartlar' : 'Certificates & Standards'}
          description={
            isTr
              ? 'Aşağıdaki sertifikalar ve standartlar referans niteliğindedir; güncel belgeler yakında yüklenecektir.'
              : 'The certificates and standards listed below are for reference; official documents will be added shortly.'
          }
          accent={ACCENT}
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {belgeler.map((belge) => (
            <FeatureCard
              key={belge.kod}
              icon="document"
              title={belge.kod}
              description={`${belge.aciklama} — ${isTr ? 'Belge yüklenecek' : 'Document to be uploaded'}`}
              accent={ACCENT}
            />
          ))}
        </div>
      </Section>
    </>
  );
}

// ── Structured body (Sanity-driven) ───────────────────────────────────────────

function StructuredBody({ data, locale }: { data: PageData; locale: Locale }) {
  const isTr = locale === 'tr';
  const p = (f?: LocaleString) => (f ? pick(f, locale) ?? f.tr : undefined);

  const hasVizyonMisyon = !!(data.vizyonBaslik || data.misyonBaslik);
  const hasGiris = !!data.girisLead;
  const hasKartlar = !!(data.kartlar && data.kartlar.length > 0);

  return (
    <>
      {hasVizyonMisyon && (
        <Section>
          <div className="grid gap-8 lg:grid-cols-2">
            <div
              className="rounded-2xl border p-8 lg:p-10"
              style={
                {
                  borderColor: `${ACCENT}33`,
                  background: `linear-gradient(135deg, ${ACCENT}08 0%, transparent 60%)`,
                } as CSSProperties
              }
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-6" style={{ backgroundColor: ACCENT }} aria-hidden />
                <span className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: ACCENT }}>
                  {isTr ? 'VİZYON' : 'VISION'}
                </span>
              </div>
              <p className="font-display text-2xl font-bold leading-snug text-foreground sm:text-3xl">
                {p(data.vizyonBaslik)}
              </p>
              <p className="mt-5 text-base leading-relaxed text-muted">{p(data.vizyonMetin)}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-8 lg:p-10">
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-6 bg-foreground/30" aria-hidden />
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-muted">
                  {isTr ? 'MİSYON' : 'MISSION'}
                </span>
              </div>
              <p className="font-display text-2xl font-bold leading-snug text-foreground sm:text-3xl">
                {p(data.misyonBaslik)}
              </p>
              <p className="mt-5 text-base leading-relaxed text-muted">{p(data.misyonMetin)}</p>
            </div>
          </div>
        </Section>
      )}

      {hasGiris && (
        <Section>
          <IntroLead
            lead={p(data.girisLead) ?? ''}
            body={(data.girisParagraflar ?? []).map((x) => p(x) ?? '')}
            accent={ACCENT}
          />
        </Section>
      )}

      {hasKartlar && (
        <Section tone="muted">
          <SectionHeading
            eyebrow={p(data.kartlarEyebrow) ?? ''}
            title={p(data.kartlarBaslik) ?? ''}
            description={p(data.kartlarAciklama)}
            accent={ACCENT}
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.kartlar!.map((k, i) => (
              <FeatureCard
                key={i}
                icon={k.icon}
                title={p(k.baslik) ?? ''}
                description={p(k.aciklama) ?? ''}
                accent={ACCENT}
              />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default async function PageContent({
  slug,
  locale,
}: {
  slug: Slug;
  locale: Locale;
}) {
  const data = await getPage(slug) as PageData | null;

  const title =
    (data?.baslik ? pick(data.baslik, locale) : undefined) ??
    FALLBACK_TITLES[slug][locale];

  const subtitle =
    (data?.altBaslik ? pick(data.altBaslik, locale) : undefined) ??
    FALLBACK_SUBTITLES[slug][locale];

  // Sanity'de yapısal içerik var mı? Varsa CMS'ten render et, yoksa cilalı fallback.
  const hasStructured = !!(
    data &&
    (data.girisLead || data.vizyonBaslik || (data.kartlar && data.kartlar.length > 0))
  );

  const isTr = locale === 'tr';

  const ctaConfig: Record<Slug, Record<Locale, { baslik: string; aciklama: string; buton: string; href: string }>> = {
    'hakkimizda': {
      tr: {
        baslik: 'Birlikte Çalışalım',
        aciklama: 'Yangın güvenliği projelerinizde güvenilir bir ortak arıyorsanız bizimle iletişime geçin.',
        buton: 'İletişime Geç',
        href: '/iletisim',
      },
      en: {
        baslik: "Let's Work Together",
        aciklama: 'If you are looking for a reliable partner on your fire safety projects, get in touch with us.',
        buton: 'Contact Us',
        href: '/iletisim',
      },
    },
    'vizyon-misyon': {
      tr: {
        baslik: 'Bu Vizyonun Bir Parçası Olun',
        aciklama: 'Yangın güvenliği projenizi birlikte planlamak için teklif talep edin.',
        buton: 'Teklif İste',
        href: '/teklif',
      },
      en: {
        baslik: 'Be Part of This Vision',
        aciklama: 'Request a quote to plan your fire safety project together with us.',
        buton: 'Request a Quote',
        href: '/teklif',
      },
    },
    'kalite-belgeler': {
      tr: {
        baslik: 'Kalitemizi Birlikte Deneyimleyelim',
        aciklama: 'Projelerinizde standartlara uygun, belgelenmiş çözümler için bize ulaşın.',
        buton: 'İletişime Geç',
        href: '/iletisim',
      },
      en: {
        baslik: 'Experience Our Quality Together',
        aciklama: 'Contact us for standards-compliant, documented solutions on your projects.',
        buton: 'Contact Us',
        href: '/iletisim',
      },
    },
  };

  const fallbackChips: Record<Slug, string[]> = {
    'hakkimizda': ['Yazılım', 'Danışmanlık', 'Mühendislik', '20+ Yıl'],
    'vizyon-misyon': ['Vizyon', 'Misyon', 'Değerler'],
    'kalite-belgeler': ['ISO 9001', 'TS EN 12845', 'NFPA 13', 'TS EN 54'],
  };

  const chips =
    data?.chips && data.chips.length > 0
      ? data.chips.map((c) => pick(c, locale) ?? c.tr)
      : fallbackChips[slug];

  const heroGlyphs: Record<Slug, string> = {
    'hakkimizda': 'building',
    'vizyon-misyon': 'flame',
    'kalite-belgeler': 'shield-check',
  };

  const cta = ctaConfig[slug][locale];

  return (
    <>
      <PageHero
        eyebrow={isTr ? 'Kurumsal' : 'Company'}
        title={title}
        description={subtitle}
        accent={ACCENT}
        chips={chips}
        glyph={
          <ServiceIcon
            name={heroGlyphs[slug]}
            className="h-[26rem] w-[26rem]"
          />
        }
      />

      {hasStructured ? (
        <StructuredBody data={data!} locale={locale} />
      ) : (
        <>
          {slug === 'hakkimizda' && <HakkimizdaFallback locale={locale} />}
          {slug === 'vizyon-misyon' && <VizyonMisyonFallback locale={locale} />}
          {slug === 'kalite-belgeler' && <KaliteBelgelerFallback locale={locale} />}
        </>
      )}

      <Cta
        baslik={cta.baslik}
        aciklama={cta.aciklama}
        buton={{ etiket: cta.buton, href: cta.href }}
      />
    </>
  );
}
