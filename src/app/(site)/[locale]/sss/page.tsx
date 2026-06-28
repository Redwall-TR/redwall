import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { sanityFetch } from '@/sanity/lib/fetch';
import { FAQS_QUERY } from '@/sanity/lib/queries';
import { isLocale, pick, type Locale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { Section, Cta } from '@/components/ui';
import { Accordion } from '@/components/ui/Accordion';
import { PageHero } from '@/components/sections/PageHero';
import { SectionHeading } from '@/components/sections/page-blocks';
import { ServiceIcon } from '@/components/ui/icons';

// ── Types ─────────────────────────────────────────────────────────────────────

type FaqKategori = 'genel' | 'yazilim' | 'danismanlik' | 'muhendislik';

interface FaqItem {
  kategori: FaqKategori;
  soru: { tr: string; en: string };
  cevap: { tr: string; en: string };
}

// ── Fallback FAQs ─────────────────────────────────────────────────────────────

const FALLBACK_FAQS: FaqItem[] = [
  {
    kategori: 'genel',
    soru: {
      tr: 'Redwall hangi hizmetleri sunar?',
      en: 'What services does Redwall offer?',
    },
    cevap: {
      tr: 'Redwall; yangın güvenliği danışmanlığı, söndürme sistemi tasarım ve uygulaması, mekanik tesisat mühendisliği ve YangınPro / MekanikPro yazılım ürünleri olmak üzere dört ana alanda hizmet vermektedir.',
      en: 'Redwall provides services in four main areas: fire-safety consulting, fire suppression system design and installation, mechanical plumbing engineering, and proprietary software products YangınPro and MekanikPro.',
    },
  },
  {
    kategori: 'genel',
    soru: {
      tr: 'Türkiye genelinde hizmet veriyor musunuz?',
      en: 'Do you provide services across Turkey?',
    },
    cevap: {
      tr: 'Evet. Merkezi İstanbul olmak üzere tüm Türkiye\'de proje kabul ediyoruz. Büyük ölçekli ya da uzak lokasyonlu projeler için saha ekibimiz mobildir.',
      en: 'Yes. We accept projects throughout Turkey with our base in Istanbul. For large-scale or remote-location projects our field team is fully mobile.',
    },
  },
  {
    kategori: 'yazilim',
    soru: {
      tr: 'YangınPro ve MekanikPro neler yapar?',
      en: 'What do YangınPro and MekanikPro do?',
    },
    cevap: {
      tr: 'YangınPro, yangın algılama ve söndürme sistemlerinin hesaplama, proje çizimi ve mevzuat uyum kontrolünü otomatize eder. MekanikPro ise sıhhi tesisat, ısıtma ve iklimlendirme hesaplarını ve raporlarını dijitalleştirir.',
      en: 'YangınPro automates calculations, project drawing, and regulatory compliance checks for fire detection and suppression systems. MekanikPro digitises calculations and reports for plumbing, heating, and HVAC installations.',
    },
  },
  {
    kategori: 'yazilim',
    soru: {
      tr: 'Yazılımlar bulut tabanlı mı?',
      en: 'Are the software products cloud-based?',
    },
    cevap: {
      tr: 'Her iki ürün de SaaS modelinde sunulmaktadır; internet bağlantısı olan her cihazdan erişebilir, ek donanım yatırımı gerekmez.',
      en: 'Both products are offered as SaaS; they are accessible from any internet-connected device with no additional hardware investment required.',
    },
  },
  {
    kategori: 'danismanlik',
    soru: {
      tr: 'İtfaiyeden olumlu rapor almak için ne gerekir?',
      en: 'What is required to obtain a positive report from the fire brigade?',
    },
    cevap: {
      tr: 'Binanın Binaların Yangından Korunması Hakkında Yönetmelik\'e (BYK) ve ilgili TS EN standartlarına uygun proje, hesap raporu ve uygulama belgelerinin hazırlanması gerekir. Redwall, bu belgelerin eksiksiz hazırlanmasını ve itfaiye müdürlüğüne sunulmasını yönetir.',
      en: 'The building must have project drawings, calculation reports, and installation documents compliant with the Turkish Fire Protection Regulation (BYK) and applicable TS EN standards. Redwall manages the preparation of these documents and their submission to the fire brigade.',
    },
  },
  {
    kategori: 'danismanlik',
    soru: {
      tr: 'Mevcut binam için uygunluk denetimi yapıyor musunuz?',
      en: 'Do you conduct compliance audits for existing buildings?',
    },
    cevap: {
      tr: 'Evet. Mevcut binalarda tespit, boşluk analizi ve iyileştirme planı hazırlıyoruz. Denetim raporumuz; hangi sistemlerin eksik olduğunu, mevzuat boşluklarını ve öncelik sırasına göre müdahale planını içerir.',
      en: 'Yes. For existing buildings we carry out inspections, gap analyses, and remediation plans. Our audit report covers which systems are missing, regulatory gaps, and an intervention plan ordered by priority.',
    },
  },
  {
    kategori: 'muhendislik',
    soru: {
      tr: 'Hangi söndürme sistemlerini uyguluyorsunuz?',
      en: 'Which fire suppression systems do you install?',
    },
    cevap: {
      tr: 'Yağmurlama (sprinkler), gaz söndürme (CO₂, FM-200, Novec 1230), köpüklü söndürme, kuru kimyevi tozlu ve su sisi sistemlerini tasarlayıp uyguluyoruz. Sistem seçimi riski ve mekan özelliklerine göre yapılır.',
      en: 'We design and install sprinkler, gaseous suppression (CO₂, FM-200, Novec 1230), foam, dry chemical powder, and water mist systems. System selection is based on risk level and space characteristics.',
    },
  },
  {
    kategori: 'muhendislik',
    soru: {
      tr: 'Sıhhi ve kalorifer tesisatı da yapıyor musunuz?',
      en: 'Do you also handle plumbing and heating installations?',
    },
    cevap: {
      tr: 'Evet. Mekanik tesisat iş kolumuz kapsamında sıhhi tesisat, kalorifer, doğalgaz, havalandırma ve klima (HVAC) sistemlerinin projelendirilmesi ve uygulaması yapılmaktadır.',
      en: 'Yes. Under our mechanical engineering branch we handle the design and installation of plumbing, heating, natural gas, ventilation, and air-conditioning (HVAC) systems.',
    },
  },
  {
    kategori: 'muhendislik',
    soru: {
      tr: 'Periyodik bakım hizmeti veriyor musunuz?',
      en: 'Do you provide periodic maintenance services?',
    },
    cevap: {
      tr: 'Evet. Yangın algılama ve söndürme sistemleri için yıllık ve dönemsel bakım sözleşmeleri sunuyoruz. Bakım kapsamı; sistem testi, bileşen kontrolü, raporlama ve gerekli yedek parça değişimini içerir.',
      en: 'Yes. We offer annual and periodic maintenance contracts for fire detection and suppression systems, covering system tests, component inspections, reporting, and necessary spare-part replacements.',
    },
  },
];

// ── Category config ────────────────────────────────────────────────────────────

const KATEGORI_LABELS: Record<FaqKategori, { tr: string; en: string }> = {
  genel: { tr: 'Genel', en: 'General' },
  yazilim: { tr: 'Yazılım', en: 'Software' },
  danismanlik: { tr: 'Danışmanlık', en: 'Consulting' },
  muhendislik: { tr: 'Mühendislik', en: 'Engineering' },
};

const KATEGORI_ORDER: FaqKategori[] = ['genel', 'yazilim', 'danismanlik', 'muhendislik'];

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = !isLocale(locale) || locale === 'tr';
  const loc = isTr ? ('tr' as const) : ('en' as const);

  const baslik = isTr ? 'S.S.S. | Redwall' : 'FAQ | Redwall';
  const aciklama = isTr
    ? 'Redwall hizmetleri hakkında sık sorulan sorular ve yanıtları.'
    : 'Frequently asked questions and answers about Redwall services.';

  return buildMetadata({ baslik, aciklama, locale: loc, path: '/sss' });
}

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return [{ locale: 'tr' }, { locale: 'en' }];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SssPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const loc: Locale = locale;

  const sanityFaqs = await sanityFetch<FaqItem[]>(FAQS_QUERY, {}, []);
  const faqs: FaqItem[] = sanityFaqs.length > 0 ? sanityFaqs : FALLBACK_FAQS;

  const isTr = loc === 'tr';

  const pageBaslik = isTr ? 'Sık Sorulan Sorular' : 'Frequently Asked Questions';
  const pageAciklama = isTr
    ? 'Hizmetlerimiz, yazılımlarımız ve çalışma süreçlerimiz hakkında merak ettikleriniz.'
    : 'Everything you may want to know about our services, software products, and working processes.';

  // Group FAQs by category
  const grouped = KATEGORI_ORDER.reduce<Record<FaqKategori, FaqItem[]>>(
    (acc, kat) => {
      acc[kat] = faqs.filter((f) => f.kategori === kat);
      return acc;
    },
    { genel: [], yazilim: [], danismanlik: [], muhendislik: [] },
  );

  const ctaBaslik = isTr ? 'Sorunuz mu var?' : 'Have a question?';
  const ctaAciklama = isTr
    ? 'Aklınızdaki soruya burada cevap bulamadıysanız ekibimizle doğrudan iletişime geçin.'
    : "If you couldn't find the answer here, reach out to our team directly.";
  const ctaButon = isTr ? 'Bize Ulaşın' : 'Contact Us';

  const chips = isTr
    ? ['Genel', 'Yazılım', 'Danışmanlık', 'Mühendislik']
    : ['General', 'Software', 'Consulting', 'Engineering'];

  return (
    <>
      <PageHero
        eyebrow={isTr ? 'Yardım' : 'Help'}
        title={pageBaslik}
        description={pageAciklama}
        accent="#e63950"
        chips={chips}
        glyph={<ServiceIcon name="document" className="h-[26rem] w-[26rem]" />}
      />

      <Section>
        <div className="space-y-14">
          {KATEGORI_ORDER.map((kat) => {
            const items = grouped[kat];
            if (items.length === 0) return null;
            const label = KATEGORI_LABELS[kat][loc];
            const accordionItems = items.map((f) => ({
              soru: pick(f.soru, loc) ?? '',
              cevap: pick(f.cevap, loc) ?? '',
            }));
            return (
              <div key={kat}>
                <SectionHeading title={label} accent="#e63950" />
                <Accordion items={accordionItems} />
              </div>
            );
          })}
        </div>
      </Section>

      <Cta
        baslik={ctaBaslik}
        aciklama={ctaAciklama}
        buton={{ etiket: ctaButon, href: '/iletisim' }}
      />
    </>
  );
}
