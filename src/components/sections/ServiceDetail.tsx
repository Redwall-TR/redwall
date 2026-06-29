import { getService } from '@/lib/cms/queries';
import { pick, type Locale } from '@/lib/locales';
import { Section, Cta } from '@/components/ui';
import { ServiceIcon } from '@/components/ui/icons';
import { PageHero } from '@/components/sections/PageHero';
import { SectionHeading, FeatureCard, ProcessTimeline, IntroLead } from '@/components/sections/page-blocks';

// ── Types ─────────────────────────────────────────────────────────────────────

type IsKolu = 'danismanlik' | 'muhendislik' | 'yazilim';

interface LocaleString {
  tr: string;
  en: string;
}

interface AltHizmet {
  baslik?: LocaleString;
  aciklama?: LocaleString;
  icon?: string;
}

interface SurecAdim {
  baslik?: LocaleString;
  aciklama?: LocaleString;
}

interface ServiceData {
  isKolu: string;
  baslik?: LocaleString;
  ozet?: LocaleString;
  chips?: LocaleString[];
  girisLead?: LocaleString;
  girisParagraflar?: LocaleString[];
  altHizmetler?: AltHizmet[];
  surec?: SurecAdim[];
}

interface ServiceDetailProps {
  isKolu: IsKolu;
  locale: Locale;
}

// ── Fallback content ──────────────────────────────────────────────────────────

const DANISMANLIK_FALLBACK = {
  accent: '#38bdf8',
  eyebrow: { tr: 'Danışmanlık', en: 'Consulting' },
  chips: {
    tr: ['Kamu kurumları', 'Bina yönetimleri & mal sahipleri', 'Müteahhitler', 'Anahtar teslim süreç'],
    en: ['Public institutions', 'Building managements & owners', 'Contractors', 'Turnkey process'],
  },
  baslik: {
    tr: 'Yangın Güvenliği Danışmanlığı',
    en: 'Fire Safety Consulting',
  },
  ozet: {
    tr: 'Kamu kurumlarından bina yönetimlerine, mal sahiplerinden müteahhitlere; mevzuata uygunluk, olumsuz itfaiye raporlarının olumluya çevrilmesi, doğru projelendirme ve uçtan uca süreç yönetiminde uzman desteği sunuyoruz.',
    en: 'From public institutions to building managements, property owners to contractors — expert support on regulatory compliance, turning negative fire-department reports positive, sound project design, and end-to-end process management.',
  },
  intro: {
    tr: [
      'Her kurumun ve yapının yangın güvenliği gereksinimi farklıdır; çoğu zaman asıl ihtiyaç, mevzuata tam uyum ile hukuki güvenceyi birlikte sağlamaktır.',
      'Yangın güvenliği mevzuatına hâkim uzman ekibimizle kurumunuzun, binanızın veya projenizin koşullarına özel danışmanlık sunarız. Tek seferlik bir uygunluk denetiminden olumsuz bir itfaiye raporunun olumluya çevrilmesine, sıfırdan olumlu rapora kadar tüm sürecin yönetimine değin; işi sizin adınıza, yazılı ve denetlenebilir çıktılarla yürütürüz.',
    ],
    en: [
      'Every institution and building has different fire-safety needs; the real requirement is often achieving full regulatory compliance and legal assurance together.',
      "With our team's command of fire-safety legislation, we offer consulting tailored to the circumstances of your institution, building, or project. From a one-time compliance audit, to turning a negative fire-department report positive, to managing the entire process from zero to a positive report — we carry out the work on your behalf, with written and auditable outputs.",
    ],
  },
  altHizmetler: [
    {
      icon: 'building',
      baslik: { tr: 'Kamu Kurumları Danışmanlığı', en: 'Public Institution Consulting' },
      aciklama: {
        tr: "İşyeri Açma ve Çalışma Ruhsatları Yönetmeliği'nin 5/h maddesi kapsamında itfaiye tarafından rapor düzenlenmesi gerekmeyen; ancak Binaların Yangından Korunması Hakkında Yönetmelik uyarınca gerekli tedbirlerin alınması zorunlu olan binalarda, kurum adına yerinde denetim gerçekleştiririz. Talep doğrultusunda düzenlediğimiz uygunluk raporuyla, kurumun ilgili mevzuat karşısındaki hukuki sorumluluk riskini asgariye indiririz.",
        en: 'For buildings that do not require a fire-department report under Article 5/h of the Workplace Opening and Operating Licenses Regulation, yet must implement measures under the Regulation on Fire Protection of Buildings, we conduct on-site inspections on the institution\'s behalf. With the compliance report we issue on request, we minimize the institution\'s legal-liability risk against the relevant legislation.',
      },
    },
    {
      icon: 'shield-check',
      baslik: { tr: 'İtfaiye Raporu Düzeltme (Olumsuz → Olumlu)', en: 'Fire-Department Report Remediation (Negative → Positive)' },
      aciklama: {
        tr: 'Hakkında olumsuz itfaiye raporu düzenlenmiş binalarda, bina yönetimleri ve/veya mal sahipleri adına süreci yürütürüz. Raporda belirtilen eksiklikler doğrultusunda binayı detaylı biçimde analiz eder, yönetmeliğe uygun çözümleri önceliklendirir ve raporun olumluya çevrilmesi için izlenecek yol haritasını netleştiririz.',
        en: 'For buildings with a negative fire-department report, we manage the process on behalf of building managements and/or owners. In line with the deficiencies cited in the report, we analyze the building in detail, prioritize regulation-compliant solutions, and clarify the roadmap to turn the report positive.',
      },
    },
    {
      icon: 'ruler',
      baslik: { tr: 'Müteahhit & Proje Danışmanlığı', en: 'Contractor & Project Consulting' },
      aciklama: {
        tr: 'İnşaat firmaları ve müteahhitler için proje aşamasında devreye gireriz. Yangın güvenliği sistemlerini yönetmeliğe tam uyumlu, maliyeti optimize eden ve kaynakları verimli kullanan bir yaklaşımla projelendirir; ileride doğabilecek revizyon ve maliyetleri önceden önleriz.',
        en: 'For construction firms and contractors, we engage at the design stage. We design fire-safety systems in full regulatory compliance with an approach that optimizes cost and uses resources efficiently, preventing future revisions and expenses in advance.',
      },
    },
    {
      icon: 'clipboard',
      baslik: { tr: 'Uçtan Uca Süreç Yönetimi (Anahtar Teslim)', en: 'End-to-End Process Management (Turnkey)' },
      aciklama: {
        tr: 'Talebiniz hâlinde tüm süreci uçtan uca yönetiriz. Sıfırdan başlayıp olumlu rapor alınıncaya kadar gereken tüm iş ve işlemleri — keşif, projelendirme, başvuru ve kurum/itfaiye takibi dâhil — kurumunuz adına yürütür, tek muhatap olarak süreci sonuca taşırız.',
        en: 'On request, we manage the entire process end-to-end. From zero until a positive report is obtained, we carry out all required work and procedures — including survey, design, application, and institution/fire-department follow-up — on your behalf, taking the process to conclusion as your single point of contact.',
      },
    },
  ],
  surec: [
    {
      adim: 1,
      baslik: { tr: 'Keşif & Etüt', en: 'Survey & Assessment' },
      aciklama: {
        tr: 'Yapıyı veya projeyi yerinde inceler; mevcut durumu ve mevzuat gereksinimlerini eksiksiz tespit ederiz.',
        en: 'We inspect the building or project on site, fully identifying the current status and regulatory requirements.',
      },
    },
    {
      adim: 2,
      baslik: { tr: 'Uygunluk & Çözüm Raporu', en: 'Compliance & Solution Report' },
      aciklama: {
        tr: 'Tespit edilen eksiklik ve riskleri raporlar, yönetmeliğe uygun çözümleri önceliklendiririz.',
        en: 'We report identified deficiencies and risks, prioritizing regulation-compliant solutions.',
      },
    },
    {
      adim: 3,
      baslik: { tr: 'Projelendirme', en: 'Engineering Design' },
      aciklama: {
        tr: 'Gerekli yangın güvenliği sistemlerini mevzuata uygun ve maliyet-etkin biçimde projelendiririz.',
        en: 'We design the required fire-safety systems in a compliant and cost-effective manner.',
      },
    },
    {
      adim: 4,
      baslik: { tr: 'Kurum/İtfaiye Başvurusu & Takip', en: 'Institution & Fire-Department Submission & Follow-up' },
      aciklama: {
        tr: 'Başvuru dosyasını hazırlar; kurum ve itfaiye nezdindeki süreçleri sizin adınıza titizlikle takip ederiz.',
        en: 'We prepare the application file and meticulously follow up the processes before the institution and fire department on your behalf.',
      },
    },
    {
      adim: 5,
      baslik: { tr: 'Olumlu Rapor & Teslim', en: 'Positive Report & Handover' },
      aciklama: {
        tr: 'Süreci olumlu rapor/uygunluk belgesiyle sonuçlandırır, tüm çıktıları teslim ederiz.',
        en: 'We conclude the process with a positive report/compliance document and deliver all outputs.',
      },
    },
  ],
};

// Danışmanlık — her teklifin AYRI süreci (koda gömülü; CMS'te tek surec dizisi
// 4 farklı süreci taşıyamadığından danışmanlığa özel burada tutulur).
type SurecBlok = {
  baslik: { tr: string; en: string };
  steps: { baslik: { tr: string; en: string }; aciklama: { tr: string; en: string } }[];
};

const DANISMANLIK_SURECLER: SurecBlok[] = [
  {
    baslik: { tr: 'Kamu Kurumları — Süreç', en: 'Public Institutions — Process' },
    steps: [
      { baslik: { tr: 'Keşif & Yerinde Denetim', en: 'Survey & On-Site Inspection' }, aciklama: { tr: 'Kurumun yapısını yerinde inceler, mevcut durumu yürürlükteki mevzuatla karşılaştırırız.', en: "We inspect the institution's building on site and compare the current status against applicable legislation." } },
      { baslik: { tr: 'Mevzuat Uygunluk Değerlendirmesi', en: 'Regulatory Compliance Assessment' }, aciklama: { tr: 'Binaların Yangından Korunması Hakkında Yönetmelik kapsamında alınması gereken tedbirleri belirleriz.', en: 'We determine the measures required under the Regulation on Fire Protection of Buildings.' } },
      { baslik: { tr: 'Uygunluk Raporu', en: 'Compliance Report' }, aciklama: { tr: 'Talep doğrultusunda; tespitleri ve önerilen tedbirleri yazılı, denetlenebilir bir raporla sunarız.', en: 'On request, we present findings and recommended measures in a written, auditable report.' } },
      { baslik: { tr: 'Hukuki Güvence & Takip', en: 'Legal Assurance & Follow-up' }, aciklama: { tr: 'Kurumun mevzuat karşısındaki sorumluluk riskini asgariye indirir, gereken iyileştirmeleri takip ederiz.', en: "We minimize the institution's liability risk and follow up on the necessary improvements." } },
    ],
  },
  {
    baslik: { tr: 'İtfaiye Raporu Düzeltme — Süreç', en: 'Report Remediation — Process' },
    steps: [
      { baslik: { tr: 'Olumsuz Raporun İncelenmesi', en: 'Review of the Negative Report' }, aciklama: { tr: 'Raporda belirtilen tüm eksiklik ve gerekçeleri ayrıntılı biçimde analiz ederiz.', en: 'We analyze all deficiencies and grounds cited in the report in detail.' } },
      { baslik: { tr: 'Bina Analizi & Çözüm Planı', en: 'Building Analysis & Solution Plan' }, aciklama: { tr: 'Sahada inceler, yönetmeliğe uygun çözümleri önceliklendirir ve bir yol haritası oluştururuz.', en: 'We inspect on site, prioritize regulation-compliant solutions, and build a roadmap.' } },
      { baslik: { tr: 'Projelendirme & İyileştirme', en: 'Design & Remediation' }, aciklama: { tr: 'Gerekli sistem ve düzenlemeleri projelendirir, uygulamayı yönlendiririz.', en: 'We design the required systems and arrangements and guide the implementation.' } },
      { baslik: { tr: 'Yeniden Başvuru & Takip', en: 'Re-application & Follow-up' }, aciklama: { tr: 'İtfaiye nezdinde yeniden değerlendirme sürecini sizin adınıza yürütürüz.', en: 'We carry out the re-assessment process before the fire department on your behalf.' } },
      { baslik: { tr: 'Olumlu Rapor', en: 'Positive Report' }, aciklama: { tr: 'Eksiklikler giderildiğinde raporun olumluya çevrilmesini sağlarız.', en: 'Once deficiencies are resolved, we ensure the report is turned positive.' } },
    ],
  },
  {
    baslik: { tr: 'Müteahhit & Proje — Süreç', en: 'Contractor & Project — Process' },
    steps: [
      { baslik: { tr: 'Proje İncelemesi', en: 'Project Review' }, aciklama: { tr: 'Mevcut mimari ve mekanik projeleri yangın güvenliği açısından değerlendiririz.', en: 'We evaluate existing architectural and mechanical projects from a fire-safety perspective.' } },
      { baslik: { tr: 'Mevzuata Uygun Tasarım', en: 'Compliant Design' }, aciklama: { tr: 'Yangın güvenliği sistemlerini yönetmeliğe tam uyumlu biçimde planlarız.', en: 'We plan fire-safety systems in full regulatory compliance.' } },
      { baslik: { tr: 'Maliyet Optimizasyonu', en: 'Cost Optimization' }, aciklama: { tr: 'Kaynakları verimli kullanan, gereksiz maliyeti azaltan çözümler öneririz.', en: 'We propose solutions that use resources efficiently and reduce unnecessary cost.' } },
      { baslik: { tr: 'Projelendirme & Teslim', en: 'Engineering & Handover' }, aciklama: { tr: 'Uygulama projelerini ve hesap raporlarını hazırlar, eksiksiz teslim ederiz.', en: 'We prepare construction projects and calculation reports and deliver them in full.' } },
    ],
  },
  {
    baslik: { tr: 'Uçtan Uca Süreç Yönetimi — Süreç', en: 'End-to-End Management — Process' },
    steps: [
      { baslik: { tr: 'Keşif & Etüt', en: 'Survey & Assessment' }, aciklama: { tr: 'Yapıyı veya projeyi yerinde inceler, gereksinimleri ve eksiklikleri tespit ederiz.', en: 'We inspect the building or project on site and identify requirements and deficiencies.' } },
      { baslik: { tr: 'Uygunluk & Çözüm Raporu', en: 'Compliance & Solution Report' }, aciklama: { tr: 'Mevcut durumu raporlar, yönetmeliğe uygun çözümleri önceliklendiririz.', en: 'We report the current status and prioritize regulation-compliant solutions.' } },
      { baslik: { tr: 'Projelendirme', en: 'Engineering Design' }, aciklama: { tr: 'Gerekli tüm sistemleri mevzuata uygun biçimde projelendiririz.', en: 'We design all required systems in compliance with regulations.' } },
      { baslik: { tr: 'Başvuru & Kurum/İtfaiye Takibi', en: 'Application & Institution/Fire-Dept Follow-up' }, aciklama: { tr: 'Başvuru dosyasını hazırlar, kurum ve itfaiye süreçlerini sizin adınıza yürütürüz.', en: 'We prepare the application file and run the institution and fire-department processes on your behalf.' } },
      { baslik: { tr: 'Olumlu Rapor & Teslim', en: 'Positive Report & Handover' }, aciklama: { tr: 'Süreci olumlu rapor/uygunluk ile sonuçlandırır, tüm çıktıları teslim ederiz.', en: 'We conclude the process with a positive report/compliance and deliver all outputs.' } },
    ],
  },
];

const MUHENDISLIK_FALLBACK = {
  accent: '#f59e0b',
  eyebrow: { tr: 'Mühendislik & Uygulama', en: 'Engineering & Application' },
  chips: {
    tr: ['Aktif Söndürme', 'Pasif Önleme', 'Mekanik Tesisat', 'Periyodik Bakım'],
    en: ['Active Suppression', 'Passive Prevention', 'Mechanical', 'Maintenance'],
  },
  baslik: {
    tr: 'Mühendislik & Uygulama',
    en: 'Engineering & Application',
  },
  ozet: {
    tr: 'Aktif söndürme, pasif önleme, saha uygulaması ve mekanik tesisat alanlarında uçtan uca mühendislik ve taahhüt hizmetleri.',
    en: 'End-to-end engineering and contracting services in active suppression, passive prevention, field application, and mechanical installation.',
  },
  intro: {
    tr: [
      'Redwall Mühendislik & Uygulama; yangın güvenliği sistemlerinin tasarımından sahaya kurulumuna, mekanik tesisat uygulamalarından periyodik bakıma kadar tam kapsamlı mühendislik ve taahhüt çözümleri sunmaktadır.',
      'Deneyimli mühendis kadromuz ve saha ekiplerimizle projenizin her aşamasında yanınızdayız: teknik hesaplamalardan malzeme seçimine, çizim üretiminden taahhüt tamamlamaya kadar tek elden hizmet veriyoruz.',
    ],
    en: [
      'Redwall Engineering & Application delivers full-scope engineering and contracting solutions covering the design of fire-safety systems through field installation, mechanical installation applications, and periodic maintenance.',
      'Our experienced engineering team and field crews are with you at every stage of your project — from technical calculations and material selection to drawing production and contract completion, all from a single source.',
    ],
  },
  altHizmetler: [
    {
      icon: 'droplet',
      baslik: { tr: 'Aktif Söndürme Sistemleri', en: 'Active Suppression Systems' },
      aciklama: {
        tr: 'Sprinkler, köpüklü söndürme, gazlı söndürme ve su sisi sistemlerinin proje tasarımı, temin ve sahasına kurulumunu gerçekleştiriyoruz.',
        en: 'We design, supply, and install sprinkler, foam suppression, gas suppression, and water mist systems on site.',
      },
    },
    {
      icon: 'wall',
      baslik: { tr: 'Pasif Önleme Sistemleri', en: 'Passive Prevention Systems' },
      aciklama: {
        tr: 'Yangın kapıları, yangın barikatları, duman yönetim sistemleri ve yangına dayanıklı sızdırmazlık uygulamalarında tasarım ve montaj hizmetleri sunuyoruz.',
        en: 'We provide design and installation services for fire doors, fire barriers, smoke management systems, and fire-rated sealing applications.',
      },
    },
    {
      icon: 'hard-hat',
      baslik: { tr: 'Saha Uygulama & Taahhüt', en: 'Field Application & Contracting' },
      aciklama: {
        tr: 'Tüm yangın güvenliği sistemlerinin anahtar teslim kurulumunu üstleniyor; uygulama planlamasından kabul testine kadar projeyi taahhüt altında tamamlıyoruz.',
        en: 'We undertake turnkey installation of all fire-safety systems, completing the project under contract from application planning through acceptance testing.',
      },
    },
    {
      icon: 'wrench',
      baslik: { tr: 'Sıhhi & Kalorifer Tesisat', en: 'Plumbing & Heating Installation' },
      aciklama: {
        tr: 'Yangın güvenliği projelerinin ayrılmaz parçası olan sıhhi tesisat ve kalorifer sistemleri tasarım, temin ve montaj hizmetlerini profesyonelce yürütüyoruz.',
        en: 'We professionally carry out design, supply, and installation of plumbing and heating systems — an integral part of fire-safety projects.',
      },
    },
    {
      icon: 'refresh',
      baslik: { tr: 'Periyodik Bakım', en: 'Periodic Maintenance' },
      aciklama: {
        tr: 'Kurulu yangın güvenliği sistemlerinizin etkinliğini korumak için düzenli bakım, test ve raporlama hizmetleri sunuyor; yönetmelik uyumluluğunuzu sürdürüyoruz.',
        en: 'We provide regular maintenance, testing, and reporting services to keep your installed fire-safety systems effective and maintain your regulatory compliance.',
      },
    },
  ],
  surec: [
    {
      adim: 1,
      baslik: { tr: 'Keşif & Etüt', en: 'Survey & Assessment' },
      aciklama: {
        tr: 'Sahayı yerinde inceliyor, mevcut sistemleri ve yapısal koşulları değerlendiriyor; projenin teknik gereksinimlerini belirliyoruz.',
        en: 'We inspect the site in person, assess existing systems and structural conditions, and define the technical requirements of your project.',
      },
    },
    {
      adim: 2,
      baslik: { tr: 'Projelendirme', en: 'Engineering Design' },
      aciklama: {
        tr: 'Yönetmeliğe uygun mühendislik hesapları, teknik çizimler ve malzeme listeleri hazırlıyoruz; onay süreçleri için gereken tüm teknik belgeleri teslim ediyoruz.',
        en: 'We prepare code-compliant engineering calculations, technical drawings, and material lists, delivering all technical documents required for approval processes.',
      },
    },
    {
      adim: 3,
      baslik: { tr: 'Malzeme Temini', en: 'Material Procurement' },
      aciklama: {
        tr: 'Projeye özgü teknik şartnamelere göre malzeme ve ekipmanı temin ediyor; kalite kontrol süreçleriyle uygunluğunu doğruluyoruz.',
        en: 'We procure materials and equipment to project-specific technical specifications, verifying conformity through quality-control processes.',
      },
    },
    {
      adim: 4,
      baslik: { tr: 'Saha Uygulaması', en: 'Field Application' },
      aciklama: {
        tr: 'Deneyimli saha ekiplerimizle kurulum çalışmalarını plana ve teknik çizimlere uygun şekilde gerçekleştiriyor; uygulama sürecini sürekli denetliyoruz.',
        en: 'Our experienced field crews carry out installation work in accordance with the plan and technical drawings, with continuous supervision throughout the application process.',
      },
    },
    {
      adim: 5,
      baslik: { tr: 'Test, Devreye Alma & Bakım', en: 'Testing, Commissioning & Maintenance' },
      aciklama: {
        tr: 'Sistemleri kapsamlı testlerle devreye alıyor, kabul belgelerini hazırlıyor ve uzun vadeli işlerliği güvence altına almak için periyodik bakım planı sunuyoruz.',
        en: 'We commission systems through comprehensive testing, prepare acceptance documents, and provide a periodic maintenance plan to ensure long-term operability.',
      },
    },
  ],
};

// ── Component ─────────────────────────────────────────────────────────────────

export default async function ServiceDetail({ isKolu, locale }: ServiceDetailProps) {
  const data = await getService(isKolu) as ServiceData | null;

  if (isKolu === 'danismanlik' || isKolu === 'muhendislik') {
    const fb = isKolu === 'danismanlik' ? DANISMANLIK_FALLBACK : MUHENDISLIK_FALLBACK;
    const accent = fb.accent; // design: code-derived per iş kolu

    const baslik = (data?.baslik ? pick(data.baslik, locale) : undefined) ?? fb.baslik[locale];
    const ozet = (data?.ozet ? pick(data.ozet, locale) : undefined) ?? fb.ozet[locale];

    // chips — Sanity varsa onu kullan, yoksa fallback
    const chips =
      data?.chips && data.chips.length > 0
        ? data.chips.map((c) => pick(c, locale) ?? c.tr)
        : fb.chips[locale];

    // intro (lead + paragraflar)
    const introLead =
      (data?.girisLead ? pick(data.girisLead, locale) : undefined) ?? fb.intro[locale][0];
    const introBody =
      data?.girisParagraflar && data.girisParagraflar.length > 0
        ? data.girisParagraflar.map((p) => pick(p, locale) ?? p.tr)
        : fb.intro[locale].slice(1);

    const altHizmetler: AltHizmet[] =
      data?.altHizmetler && data.altHizmetler.length > 0 ? data.altHizmetler : fb.altHizmetler;

    // süreç adımları — Sanity'de 'adim' yok, sıra index'ten gelir
    const surecSteps =
      data?.surec && data.surec.length > 0
        ? data.surec.map((s, i) => ({
            num: i + 1,
            title: (s.baslik ? pick(s.baslik, locale) : undefined) ?? s.baslik?.tr ?? '',
            description: (s.aciklama ? pick(s.aciklama, locale) : undefined) ?? s.aciklama?.tr ?? '',
          }))
        : fb.surec.map((s) => ({
            num: s.adim,
            title: pick(s.baslik, locale) ?? s.baslik.tr,
            description: pick(s.aciklama, locale) ?? s.aciklama.tr,
          }));

    const hizmetlerBaslik =
      isKolu === 'danismanlik'
        ? locale === 'tr'
          ? 'Danışmanlık Hizmetlerimiz'
          : 'Our Consulting Services'
        : locale === 'tr'
          ? 'Uygulama Alanlarımız'
          : 'Our Service Areas';

    const surecBaslik =
      isKolu === 'danismanlik'
        ? locale === 'tr'
          ? 'Danışmanlık Sürecimiz'
          : 'Our Consulting Process'
        : locale === 'tr'
          ? 'Uygulama Sürecimiz'
          : 'Our Application Process';

    const surecAciklama =
      isKolu === 'danismanlik'
        ? locale === 'tr'
          ? 'İtfaiye onayına giden yolu adım adım birlikte yürüyoruz.'
          : 'We walk the path to fire-department approval together, step by step.'
        : locale === 'tr'
          ? 'Keşiften devreye almaya kadar her adımda yanınızdayız.'
          : 'We are with you at every step, from survey to commissioning.';

    return (
      <>
        <PageHero
          eyebrow={fb.eyebrow[locale]}
          title={baslik}
          description={ozet}
          accent={accent}
          chips={chips}
          glyph={<ServiceIcon name={isKolu === 'danismanlik' ? 'shield-check' : 'wrench'} className="h-[26rem] w-[26rem]" />}
        />

        {/* Intro */}
        <Section>
          <IntroLead lead={introLead} body={introBody} accent={accent} />
        </Section>

        {/* Hizmetler grid */}
        <Section tone="muted">
          <SectionHeading
            eyebrow={locale === 'tr' ? 'Ne Yapıyoruz' : 'What We Do'}
            title={hizmetlerBaslik}
            accent={accent}
          />
          <div className={`grid gap-6 sm:grid-cols-2 ${altHizmetler.length === 4 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
            {altHizmetler.map((h, i) => (
              <FeatureCard
                key={i}
                icon={h.icon}
                accent={accent}
                title={(h.baslik ? pick(h.baslik, locale) : undefined) ?? h.baslik?.tr ?? ''}
                description={(h.aciklama ? pick(h.aciklama, locale) : undefined) ?? h.aciklama?.tr ?? ''}
              />
            ))}
          </div>
        </Section>

        {/* Süreç — danışmanlıkta her teklif için ayrı timeline; mühendislikte tek */}
        {isKolu === 'danismanlik' ? (
          DANISMANLIK_SURECLER.map((sb, bi) => (
            <Section key={bi} tone={bi % 2 === 1 ? 'muted' : undefined}>
              <SectionHeading
                eyebrow={bi === 0 ? (locale === 'tr' ? 'Süreçlerimiz' : 'Our Processes') : undefined}
                title={sb.baslik[locale]}
                accent={accent}
              />
              <ProcessTimeline
                steps={sb.steps.map((s, si) => ({
                  num: si + 1,
                  title: s.baslik[locale],
                  description: s.aciklama[locale],
                }))}
                accent={accent}
              />
            </Section>
          ))
        ) : (
          <Section>
            <SectionHeading
              eyebrow={locale === 'tr' ? 'Nasıl Çalışıyoruz' : 'How We Work'}
              title={surecBaslik}
              description={surecAciklama}
              accent={accent}
            />
            <ProcessTimeline steps={surecSteps} accent={accent} />
          </Section>
        )}

        <Cta
          baslik={
            isKolu === 'danismanlik'
              ? locale === 'tr'
                ? 'Olumlu itfaiye raporu için bizimle çalışın'
                : 'Work with us for a positive fire-department report'
              : locale === 'tr'
                ? 'Yangın güvenliği sistemleri için teklif alın'
                : 'Get a quote for fire-safety systems'
          }
          aciklama={
            isKolu === 'danismanlik'
              ? locale === 'tr'
                ? 'Projenizin ihtiyaçlarını değerlendiriyor ve size en hızlı çözüm yolunu sunuyoruz.'
                : 'We assess your project needs and present you with the fastest route to approval.'
              : locale === 'tr'
                ? 'Projenizin kapsamına göre anahtar teslim çözümler sunuyoruz. Ekibimizle hemen iletişime geçin.'
                : 'We deliver turnkey solutions tailored to your project scope. Contact our team today.'
          }
          buton={{ etiket: locale === 'tr' ? 'Teklif İste' : 'Request a Quote', href: '/teklif' }}
        />
      </>
    );
  }

  // ── Yazılım veya bilinmeyen (ServiceDetail yalnızca danışmanlık/mühendislik için kullanılır) ──
  return (
    <PageHero
      eyebrow={data?.baslik ? undefined : locale === 'tr' ? 'Hizmet' : 'Service'}
      title={
        (data?.baslik ? pick(data.baslik, locale) : undefined) ??
        (locale === 'tr' ? 'Hizmetlerimiz' : 'Our Services')
      }
      description={(data?.ozet ? pick(data.ozet, locale) : undefined) ?? undefined}
      glyph={<ServiceIcon name="flame" className="h-[26rem] w-[26rem]" />}
    />
  );
}
