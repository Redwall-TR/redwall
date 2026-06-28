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
    tr: ['İtfaiye Onayı', 'Mevzuat Uygunluğu', 'Projelendirme', 'Denetim Desteği'],
    en: ['Fire-Dept Approval', 'Compliance', 'Project Design', 'Inspection Support'],
  },
  baslik: {
    tr: 'Yangın Danışmanlığı',
    en: 'Fire Consulting',
  },
  ozet: {
    tr: 'Kurumlar, müteahhitler ve mal sahipleri için itfaiye onay süreci, mevzuat uygunluğu ve projelendirme danışmanlığı.',
    en: 'Fire-department approval process, regulatory compliance, and project design consulting for institutions, contractors, and property owners.',
  },
  intro: {
    tr: [
      'Redwall Danışmanlık; inşaat süreçlerinde ve mevcut yapılarda yangın güvenliği mevzuatına uyumu sağlamak, itfaiyeden olumlu rapor almak ve projelendirme süreçlerini doğru yönetmek isteyen her paydaş için profesyonel destek sunmaktadır.',
      'Yönetmelik gerekliliklerini tam anlamıyla karşılayan projeler tasarlıyor, eksik evrak ve teknik yetersizliklerden kaynaklanan gecikmeleri ortadan kaldırıyor, itfaiye denetimlerinde başarıyla çıkmanızı sağlıyoruz.',
    ],
    en: [
      'Redwall Consulting provides professional support for all stakeholders who need to achieve regulatory compliance in construction processes and existing structures, obtain a positive fire-department report, and manage project design correctly.',
      'We design projects that fully meet regulatory requirements, eliminate delays caused by missing documents and technical deficiencies, and ensure you pass fire-department inspections successfully.',
    ],
  },
  altHizmetler: [
    {
      icon: 'shield-check',
      baslik: { tr: 'İtfaiye Onay Danışmanlığı', en: 'Fire-Department Approval Consulting' },
      aciklama: {
        tr: 'İtfaiye raporu sürecini uçtan uca yönetiyor; eksik evrakları tamamlıyor, teknik itirazları yanıtlıyor ve olumlu raporu almanızı hızlandırıyoruz.',
        en: 'We manage the fire-department report process end-to-end: completing missing documents, responding to technical objections, and accelerating your path to a positive report.',
      },
    },
    {
      icon: 'clipboard',
      baslik: { tr: 'Mevzuat Uygunluk Analizi', en: 'Regulatory Compliance Analysis' },
      aciklama: {
        tr: 'Binanızı veya projenizi geçerli yangın güvenliği yönetmeliklerine göre değerlendiriyor, uyumsuzluk noktalarını tespit ediyor ve çözüm yollarını raporluyoruz.',
        en: 'We evaluate your building or project against current fire-safety regulations, identify non-compliance points, and report the path to resolution.',
      },
    },
    {
      icon: 'ruler',
      baslik: { tr: 'Projelendirme Hizmetleri', en: 'Project Design Services' },
      aciklama: {
        tr: 'Yangın algılama, söndürme ve tahliye sistemleri için yönetmeliğe uygun teknik projeler hazırlıyor; uygulama çizimlerini ve hesap raporlarını sunuyoruz.',
        en: 'We prepare technically compliant projects for fire detection, suppression, and evacuation systems, delivering construction drawings and calculation reports.',
      },
    },
    {
      icon: 'hard-hat',
      baslik: { tr: 'Müteahhit Desteği', en: 'Contractor Support' },
      aciklama: {
        tr: 'Yapım sürecinde ortaya çıkan yangın güvenliği sorunlarını hızla çözüyor; müteahhitlerin teslim takvimine uymasına yardımcı oluyoruz.',
        en: 'We quickly resolve fire-safety issues that arise during construction, helping contractors meet their delivery schedule.',
      },
    },
    {
      icon: 'key',
      baslik: { tr: 'Mal Sahibi Danışmanlığı', en: 'Property Owner Consulting' },
      aciklama: {
        tr: 'Yeni yapı veya mevcut bina sahiplerine; denetim öncesi hazırlık, eksiklik giderme ve belge yönetimi konularında kapsamlı rehberlik sağlıyoruz.',
        en: 'We provide comprehensive guidance to owners of new or existing buildings on pre-inspection preparation, deficiency remediation, and document management.',
      },
    },
    {
      icon: 'building',
      baslik: { tr: 'Kurum Danışmanlığı', en: 'Institutional Consulting' },
      aciklama: {
        tr: 'Hastane, okul, AVM ve sanayi tesisleri gibi büyük kurumlara; mevzuat takibi, periyodik denetim desteği ve acil müdahale planlaması konularında uzman danışmanlık sunuyoruz.',
        en: 'We offer expert consulting to large institutions such as hospitals, schools, shopping centers, and industrial facilities on regulation monitoring, periodic inspection support, and emergency response planning.',
      },
    },
  ],
  surec: [
    {
      adim: 1,
      baslik: { tr: 'Başvuru & Ön Değerlendirme', en: 'Application & Pre-Assessment' },
      aciklama: {
        tr: 'Proje belgelerinizi ve mevcut durumunuzu inceliyoruz; gereksinimleri ve kritik eksiklikleri belirliyoruz.',
        en: 'We review your project documents and current status, identifying requirements and critical deficiencies.',
      },
    },
    {
      adim: 2,
      baslik: { tr: 'Uygunluk Raporu', en: 'Compliance Report' },
      aciklama: {
        tr: 'Yapıyı yönetmelikle karşılaştırarak ayrıntılı bir uygunluk raporu hazırlıyoruz.',
        en: 'We prepare a detailed compliance report, comparing the structure against current regulations.',
      },
    },
    {
      adim: 3,
      baslik: { tr: 'Proje Tasarımı', en: 'Project Design' },
      aciklama: {
        tr: 'Tespit edilen eksiklikleri gidermek için teknik projeleri ve hesap raporlarını hazırlıyoruz.',
        en: 'We prepare technical projects and calculation reports to address identified deficiencies.',
      },
    },
    {
      adim: 4,
      baslik: { tr: 'İtfaiye Başvurusu', en: 'Fire-Department Submission' },
      aciklama: {
        tr: 'Tüm belgelerle birlikte itfaiye başvurusunu yapıyor ve süreci takip ediyoruz.',
        en: 'We submit the application to the fire department with all documents and follow up throughout the process.',
      },
    },
    {
      adim: 5,
      baslik: { tr: 'Olumlu Rapor & Teslim', en: 'Positive Report & Handover' },
      aciklama: {
        tr: 'İtfaiye onayını alıyor ve belge setini eksiksiz şekilde teslim ediyoruz.',
        en: 'We obtain fire-department approval and deliver the complete documentation set.',
      },
    },
  ],
};

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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* Süreç */}
        <Section>
          <SectionHeading
            eyebrow={locale === 'tr' ? 'Nasıl Çalışıyoruz' : 'How We Work'}
            title={surecBaslik}
            description={surecAciklama}
            accent={accent}
          />
          <ProcessTimeline steps={surecSteps} accent={accent} />
        </Section>

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
