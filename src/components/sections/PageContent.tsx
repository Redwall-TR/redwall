import type { PortableTextBlock } from '@portabletext/react';
import { sanityFetch } from '@/sanity/lib/fetch';
import { PAGE_QUERY } from '@/sanity/lib/queries';
import { pick, type Locale } from '@/lib/locales';
import { PageHeader, Section, Cta, PortableTextRenderer } from '@/components/ui';

// ── Types ─────────────────────────────────────────────────────────────────────

type Slug = 'hakkimizda' | 'vizyon-misyon' | 'kalite-belgeler';

interface PageData {
  baslik?: { tr: string; en: string };
  icerik?: { tr: PortableTextBlock[]; en: PortableTextBlock[] };
}

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
        { baslik: 'Yazılım', aciklama: 'YangınPro ve MekanikPro ile hesaplama süreçlerini dijitalleştiriyoruz.' },
        { baslik: 'Danışmanlık', aciklama: 'İtfaiye mevzuatına tam uyum için proje başından onaya kadar yanınızdayız.' },
        { baslik: 'Mühendislik', aciklama: 'Aktif söndürme, pasif yangın koruması ve mekanik tesisat alanlarında saha çözümleri sunuyoruz.' },
      ]
    : [
        { baslik: 'Software', aciklama: 'We digitise calculation workflows with YangınPro and MekanikPro.' },
        { baslik: 'Consulting', aciklama: 'We stay by your side from project inception through fire-authority approval.' },
        { baslik: 'Engineering', aciklama: 'We deliver field solutions in active suppression, passive fire protection, and mechanical installation.' },
      ];

  return (
    <>
      {/* ── Company story ─────────────────────────────────────────── */}
      <Section>
        <div className="prose-redwall max-w-3xl">
          {isTr ? (
            <>
              <p>
                Redwall Yangın Danışmanlık Yazılım ve Mühendislik Hizmetleri LTD Şti., yangın güvenliği alanında
                üç kritik disiplini —{' '}
                <strong>yazılım geliştirme</strong>,{' '}
                <strong>mevzuat danışmanlığı</strong> ve{' '}
                <strong>mühendislik uygulamaları</strong>{' '}
                — tek bir çatı altında buluşturmak amacıyla kurulmuştur. Bu bütünleşik yapı, bir projenin
                dijital hesaplama aşamasından itfaiye onayına, oradan da sahaya kadar kesintisiz bir süreç yönetimi
                sağlar.
              </p>
              <p>
                Sektörde on yılı aşkın birikimiyle Redwall; oteller, alışveriş merkezleri, endüstriyel tesisler ve
                kamu yapıları başta olmak üzere Türkiye genelinde 500&apos;den fazla projede yangın güvenliği çözümleri
                sunmuştur. Yazılım kolu YangınPro ve MekanikPro ürünleriyle mühendislerin hesaplama ve raporlama
                süreçlerini hızlandırırken, danışmanlık ve mühendislik kolları projelerin ilk tasarımdan nihai
                uygulamaya kadar her evresinde güvenilir bir ortak olarak rol üstlenir.
              </p>
              <p>
                Redwall&apos;un temel farkı, bu üç disiplinin ayrı ekipler yerine ortak bir bilgi havuzu ve süreç
                mimarisinden beslenmesidir. Böylece yazılımda üretilen veriler danışmanlık sürecini besler,
                danışmanlıkta elde edilen saha deneyimi yazılımın gelişimine geri döner ve mühendislik uygulamaları
                gerçek proje gereksinimlerine göre sürekli güncellenir.
              </p>
            </>
          ) : (
            <>
              <p>
                Redwall Yangın Danışmanlık Yazılım ve Mühendislik Hizmetleri LTD Şti. (Redwall Fire Safety) was
                founded with a clear purpose: to bring together three critical disciplines —{' '}
                <strong>software development</strong>,{' '}
                <strong>regulatory consulting</strong>, and{' '}
                <strong>engineering applications</strong>{' '}
                — under a single roof. This integrated structure enables seamless project management from the digital
                calculation phase through fire-authority approval and all the way to field implementation.
              </p>
              <p>
                With over a decade of industry experience, Redwall has delivered fire safety solutions across more
                than 500 projects throughout Turkey, including hotels, shopping centres, industrial facilities, and
                public buildings. Our software arm accelerates engineers&apos; calculation and reporting workflows through
                YangınPro and MekanikPro, while our consulting and engineering arms serve as a trusted partner at
                every stage of a project — from initial design to final execution.
              </p>
              <p>
                Redwall&apos;s key differentiator is that all three disciplines draw from a shared knowledge base and
                process architecture rather than operating as separate silos. Data generated by software enriches the
                consulting process; field experience gathered during consulting cycles back into product development;
                and engineering applications are continuously refined to reflect real project requirements.
              </p>
            </>
          )}
        </div>
      </Section>

      {/* ── Neden Redwall / Why Redwall ───────────────────────────── */}
      <Section tone="muted">
        <h2 className="font-display text-2xl font-bold mb-10 text-foreground">
          {isTr ? 'Neden Redwall?' : 'Why Redwall?'}
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.baslik}
              className="rounded-xl border border-border bg-background p-6 shadow-sm"
            >
              <h3 className="font-display text-lg font-bold text-primary mb-2">{item.baslik}</h3>
              <p className="text-sm text-muted leading-relaxed">{item.aciklama}</p>
            </div>
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
          baslik: 'Güvenlik',
          aciklama: 'İnsan hayatını ve mülkü korumak her kararımızın merkezindedir.',
        },
        {
          baslik: 'Uyumluluk',
          aciklama: 'Türk yapı mevzuatı ve uluslararası standartlara eksiksiz uyum sağlarız.',
        },
        {
          baslik: 'Yenilikçilik',
          aciklama: 'Teknolojiyi ve veriyi kullanarak yangın güvenliği süreçlerini sürekli geliştiririz.',
        },
      ]
    : [
        {
          baslik: 'Safety',
          aciklama: 'Protecting human life and property is at the centre of every decision we make.',
        },
        {
          baslik: 'Compliance',
          aciklama: 'We ensure full adherence to Turkish building regulations and international standards.',
        },
        {
          baslik: 'Innovation',
          aciklama: 'We continuously improve fire safety processes by harnessing technology and data.',
        },
      ];

  return (
    <>
      {/* ── Vizyon / Vision ───────────────────────────────────────── */}
      <Section>
        <div className="max-w-3xl">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            {isTr ? 'Vizyonumuz' : 'Our Vision'}
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground">
            {isTr
              ? "Türkiye'nin Önde Gelen Bütünleşik Yangın Güvenliği Şirketi"
              : "Turkey's Leading Integrated Fire Safety Company"}
          </h2>
          <p className="mt-4 text-muted leading-relaxed">
            {isTr
              ? "Yazılım, danışmanlık ve mühendisliği tek çatı altında birleştirerek yangın güvenliği sektöründe Türkiye'nin referans noktası olmayı, geliştirdiğimiz teknoloji ürünleriyle bölgesel ölçekte tanınan bir marka hâline gelmeyi hedefliyoruz."
              : "Our vision is to become Turkey's definitive reference point in the fire safety sector by uniting software, consulting, and engineering under one roof — and to grow into a regionally recognised brand through the technology products we develop."}
          </p>
        </div>
      </Section>

      {/* ── Misyon / Mission ──────────────────────────────────────── */}
      <Section tone="muted">
        <div className="max-w-3xl">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            {isTr ? 'Misyonumuz' : 'Our Mission'}
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground">
            {isTr
              ? 'Teknolojiyle Güçlendirilmiş, Mevzuata Uygun Yangın Güvenliği'
              : 'Technology-Driven, Regulation-Compliant Fire Safety'}
          </h2>
          <p className="mt-4 text-muted leading-relaxed">
            {isTr
              ? 'İnsan hayatını ve mülkü korumak amacıyla yangın güvenliği projelerini mevzuata tam uyumlu ve teknoloji odaklı bir yaklaşımla yürütmek; yazılım araçlarımızla hesaplama süreçlerini hızlandırmak, danışmanlık hizmetlerimizle projeleri başarıyla onaya taşımak ve mühendislik uygulamalarımızla çözümleri sahaya eksiksiz yansıtmak.'
              : 'To carry out fire safety projects in a manner that is fully compliant with regulations and driven by technology — protecting human life and property; accelerating calculation processes through our software tools; guiding projects to successful regulatory approval through our consulting services; and translating solutions flawlessly into the field through our engineering applications.'}
          </p>
        </div>
      </Section>

      {/* ── Değerlerimiz / Our Values ─────────────────────────────── */}
      <Section>
        <h2 className="font-display text-2xl font-bold mb-10 text-foreground">
          {isTr ? 'Değerlerimiz' : 'Our Values'}
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {degerler.map((deger) => (
            <div
              key={deger.baslik}
              className="rounded-xl border border-border bg-background p-6 shadow-sm"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <span className="text-primary font-bold text-lg">
                  {deger.baslik.charAt(0)}
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">{deger.baslik}</h3>
              <p className="text-sm text-muted leading-relaxed">{deger.aciklama}</p>
            </div>
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

  return (
    <>
      {/* ── Quality approach ──────────────────────────────────────── */}
      <Section>
        <div className="prose-redwall max-w-3xl">
          {isTr ? (
            <>
              <p>
                Redwall olarak kalite, sunduğumuz her hizmetin ve geliştirdiğimiz her ürünün ayrılmaz bir
                parçasıdır. Yangın güvenliği projeleri insan hayatını doğrudan ilgilendirdiğinden, ulusal
                ve uluslararası standartlara uyumluluk bizim için bir tercih değil, zorunluluktur.
              </p>
              <p>
                Yazılım ürünlerimizden danışmanlık süreçlerimize, mühendislik uygulamalarından
                müşteri iletişimine kadar her adımda kalite güvencesi ilkesiyle hareket ediyoruz.
                Belge ve sertifikalarımız bu taahhüdün somut kanıtı olmakla birlikte, geçerliliğini
                ve güncelliğini korumak için periyodik denetimlerimiz aralıksız sürmektedir.
              </p>
            </>
          ) : (
            <>
              <p>
                At Redwall, quality is an inseparable part of every service we deliver and every product
                we develop. Because fire safety projects directly affect human life, compliance with national
                and international standards is not a choice for us — it is a requirement.
              </p>
              <p>
                We apply the principle of quality assurance at every step: from our software products and
                consulting processes to engineering applications and client communication. Our certificates
                and accreditations are the tangible proof of this commitment, and we carry out periodic
                audits on an ongoing basis to maintain their validity and currency.
              </p>
            </>
          )}
        </div>
      </Section>

      {/* ── Certificate grid ──────────────────────────────────────── */}
      <Section tone="muted">
        <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
          {isTr ? 'Sertifikalar & Standartlar' : 'Certificates & Standards'}
        </h2>
        <p className="mb-10 text-sm text-muted">
          {isTr
            ? 'Aşağıdaki sertifikalar ve standartlar referans niteliğindedir; güncel belgeler yakında yüklenecektir.'
            : 'The certificates and standards listed below are for reference; official documents will be added shortly.'}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {belgeler.map((belge) => (
            <div
              key={belge.kod}
              className="flex items-start gap-4 rounded-xl border border-border bg-background p-5 shadow-sm"
            >
              <div className="flex-shrink-0 rounded-lg bg-primary/10 px-3 py-2">
                <span className="font-mono text-sm font-bold text-primary">{belge.kod}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{belge.aciklama}</p>
                <p className="mt-1 text-xs text-muted">
                  {isTr ? 'Belge yüklenecek' : 'Document to be uploaded'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>
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
  const data = await sanityFetch<PageData | null>(PAGE_QUERY, { slug }, null);

  const title =
    (data?.baslik ? pick(data.baslik, locale) : undefined) ??
    FALLBACK_TITLES[slug][locale];

  const subtitle = FALLBACK_SUBTITLES[slug][locale];

  const hasContent =
    data?.icerik &&
    (pick(data.icerik, locale)?.length ?? 0) > 0;

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

  const cta = ctaConfig[slug][locale];

  return (
    <>
      <PageHeader
        ust={isTr ? 'Kurumsal' : 'Corporate'}
        baslik={title}
        aciklama={subtitle}
      />

      {hasContent ? (
        <Section>
          <PortableTextRenderer value={pick(data!.icerik!, locale)} />
        </Section>
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
