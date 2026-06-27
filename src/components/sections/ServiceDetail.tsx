import { sanityFetch } from '@/sanity/lib/fetch';
import { SERVICE_QUERY } from '@/sanity/lib/queries';
import { pick, type Locale } from '@/lib/locales';
import { PageHeader, Section, Cta, PortableTextRenderer } from '@/components/ui';
import type { PortableTextBlock } from '@portabletext/react';

// ── Types ─────────────────────────────────────────────────────────────────────

type IsKolu = 'danismanlik' | 'muhendislik' | 'yazilim';

interface LocaleString {
  tr: string;
  en: string;
}

interface AltHizmet {
  baslik?: LocaleString;
  aciklama?: LocaleString;
}

interface ServiceData {
  isKolu: string;
  baslik?: LocaleString;
  ozet?: LocaleString;
  icerik?: PortableTextBlock[];
  altHizmetler?: AltHizmet[];
  imzaRengi?: string;
}

interface ServiceDetailProps {
  isKolu: IsKolu;
  locale: Locale;
}

// ── Fallback content ──────────────────────────────────────────────────────────

const DANISMANLIK_FALLBACK = {
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
      baslik: { tr: 'İtfaiye Onay Danışmanlığı', en: 'Fire-Department Approval Consulting' },
      aciklama: {
        tr: 'İtfaiye raporu sürecini uçtan uca yönetiyor; eksik evrakları tamamlıyor, teknik itirazları yanıtlıyor ve olumlu raporu almanızı hızlandırıyoruz.',
        en: 'We manage the fire-department report process end-to-end: completing missing documents, responding to technical objections, and accelerating your path to a positive report.',
      },
    },
    {
      baslik: { tr: 'Mevzuat Uygunluk Analizi', en: 'Regulatory Compliance Analysis' },
      aciklama: {
        tr: 'Binanızı veya projenizi geçerli yangın güvenliği yönetmeliklerine göre değerlendiriyor, uyumsuzluk noktalarını tespit ediyor ve çözüm yollarını raporluyoruz.',
        en: 'We evaluate your building or project against current fire-safety regulations, identify non-compliance points, and report the path to resolution.',
      },
    },
    {
      baslik: { tr: 'Projelendirme Hizmetleri', en: 'Project Design Services' },
      aciklama: {
        tr: 'Yangın algılama, söndürme ve tahliye sistemleri için yönetmeliğe uygun teknik projeler hazırlıyor; uygulama çizimlerini ve hesap raporlarını sunuyoruz.',
        en: 'We prepare technically compliant projects for fire detection, suppression, and evacuation systems, delivering construction drawings and calculation reports.',
      },
    },
    {
      baslik: { tr: 'Müteahhit Desteği', en: 'Contractor Support' },
      aciklama: {
        tr: 'Yapım sürecinde ortaya çıkan yangın güvenliği sorunlarını hızla çözüyor; müteahhitlerin teslim takvimine uymasına yardımcı oluyoruz.',
        en: 'We quickly resolve fire-safety issues that arise during construction, helping contractors meet their delivery schedule.',
      },
    },
    {
      baslik: { tr: 'Mal Sahibi Danışmanlığı', en: 'Property Owner Consulting' },
      aciklama: {
        tr: 'Yeni yapı veya mevcut bina sahiplerine; denetim öncesi hazırlık, eksiklik giderme ve belge yönetimi konularında kapsamlı rehberlik sağlıyoruz.',
        en: 'We provide comprehensive guidance to owners of new or existing buildings on pre-inspection preparation, deficiency remediation, and document management.',
      },
    },
    {
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
      baslik: { tr: 'Aktif Söndürme Sistemleri', en: 'Active Suppression Systems' },
      aciklama: {
        tr: 'Sprinkler, köpüklü söndürme, gazlı söndürme ve su sisi sistemlerinin proje tasarımı, temin ve sahasına kurulumunu gerçekleştiriyoruz.',
        en: 'We design, supply, and install sprinkler, foam suppression, gas suppression, and water mist systems on site.',
      },
    },
    {
      baslik: { tr: 'Pasif Önleme Sistemleri', en: 'Passive Prevention Systems' },
      aciklama: {
        tr: 'Yangın kapıları, yangın barikatları, duman yönetim sistemleri ve yangına dayanıklı sızdırmazlık uygulamalarında tasarım ve montaj hizmetleri sunuyoruz.',
        en: 'We provide design and installation services for fire doors, fire barriers, smoke management systems, and fire-rated sealing applications.',
      },
    },
    {
      baslik: { tr: 'Saha Uygulama & Taahhüt', en: 'Field Application & Contracting' },
      aciklama: {
        tr: 'Tüm yangın güvenliği sistemlerinin anahtar teslim kurulumunu üstleniyor; uygulama planlamasından kabul testine kadar projeyi taahhüt altında tamamlıyoruz.',
        en: 'We undertake turnkey installation of all fire-safety systems, completing the project under contract from application planning through acceptance testing.',
      },
    },
    {
      baslik: { tr: 'Sıhhi & Kalorifer Tesisat', en: 'Plumbing & Heating Installation' },
      aciklama: {
        tr: 'Yangın güvenliği projelerinin ayrılmaz parçası olan sıhhi tesisat ve kalorifer sistemleri tasarım, temin ve montaj hizmetlerini profesyonelce yürütüyoruz.',
        en: 'We professionally carry out design, supply, and installation of plumbing and heating systems — an integral part of fire-safety projects.',
      },
    },
    {
      baslik: { tr: 'Periyodik Bakım', en: 'Periodic Maintenance' },
      aciklama: {
        tr: 'Kurulu yangın güvenliği sistemlerinizin etkinliğini korumak için düzenli bakım, test ve raporlama hizmetleri sunuyor; yönetmelik uyumluluğunuzu sürdürüyoruz.',
        en: 'We provide regular maintenance, testing, and reporting services to keep your installed fire-safety systems effective and maintain your regulatory compliance.',
      },
    },
  ],
};

// ── Sub-components ────────────────────────────────────────────────────────────

function AltHizmetCard({ baslik, aciklama }: { baslik: string; aciklama: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 flex flex-col gap-3">
      <h3 className="font-display text-base font-bold text-foreground">{baslik}</h3>
      <p className="text-sm leading-relaxed text-muted flex-1">{aciklama}</p>
    </div>
  );
}

function SurecAdim({ adim, baslik, aciklama }: { adim: number; baslik: string; aciklama: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-amber/10 text-amber font-bold text-sm ring-1 ring-amber/30">
        {adim}
      </div>
      <div className="flex flex-col gap-1">
        <h4 className="font-display text-sm font-bold text-foreground">{baslik}</h4>
        <p className="text-sm leading-relaxed text-muted">{aciklama}</p>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default async function ServiceDetail({ isKolu, locale }: ServiceDetailProps) {
  const data = await sanityFetch<ServiceData | null>(SERVICE_QUERY, { isKolu }, null);

  // ── Danışmanlık ────────────────────────────────────────────────────────────
  if (isKolu === 'danismanlik') {
    const fb = DANISMANLIK_FALLBACK;
    const baslik =
      (data?.baslik ? pick(data.baslik, locale) : undefined) ??
      fb.baslik[locale];
    const ozet =
      (data?.ozet ? pick(data.ozet, locale) : undefined) ??
      fb.ozet[locale];

    const altHizmetler: AltHizmet[] =
      data?.altHizmetler && data.altHizmetler.length > 0
        ? data.altHizmetler
        : fb.altHizmetler;

    return (
      <>
        <PageHeader
          ust={locale === 'tr' ? 'Danışmanlık' : 'Consulting'}
          baslik={baslik}
          aciklama={ozet}
        />

        {/* Intro / icerik */}
        <Section>
          {data?.icerik && data.icerik.length > 0 ? (
            <PortableTextRenderer value={data.icerik} />
          ) : (
            <div className="mx-auto max-w-3xl space-y-4 text-base leading-relaxed text-muted">
              {fb.intro[locale].map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
        </Section>

        {/* Alt hizmetler grid */}
        <Section tone="muted">
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              {locale === 'tr' ? 'Danışmanlık Hizmetlerimiz' : 'Our Consulting Services'}
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {altHizmetler.map((h, i) => (
              <AltHizmetCard
                key={i}
                baslik={
                  (h.baslik ? pick(h.baslik, locale) : undefined) ??
                  h.baslik?.tr ??
                  ''
                }
                aciklama={
                  (h.aciklama ? pick(h.aciklama, locale) : undefined) ??
                  h.aciklama?.tr ??
                  ''
                }
              />
            ))}
          </div>
        </Section>

        {/* Süreç adımları */}
        <Section>
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              {locale === 'tr' ? 'Danışmanlık Sürecimiz' : 'Our Consulting Process'}
            </h2>
            <p className="mt-3 text-muted max-w-xl mx-auto text-sm">
              {locale === 'tr'
                ? 'İtfaiye onayına giden yolu adım adım birlikte yürüyoruz.'
                : 'We walk the path to fire-department approval together, step by step.'}
            </p>
          </div>
          <div className="mx-auto max-w-2xl flex flex-col gap-8">
            {fb.surec.map((s) => (
              <SurecAdim
                key={s.adim}
                adim={s.adim}
                baslik={pick(s.baslik, locale) ?? s.baslik.tr}
                aciklama={pick(s.aciklama, locale) ?? s.aciklama.tr}
              />
            ))}
          </div>
        </Section>

        {/* CTA */}
        <Cta
          baslik={
            locale === 'tr'
              ? 'Olumlu itfaiye raporu için bizimle çalışın'
              : 'Work with us for a positive fire-department report'
          }
          aciklama={
            locale === 'tr'
              ? 'Projenizin ihtiyaçlarını değerlendiriyor ve size en hızlı çözüm yolunu sunuyoruz.'
              : 'We assess your project needs and present you with the fastest route to approval.'
          }
          buton={{
            etiket: locale === 'tr' ? 'Teklif İste' : 'Request a Quote',
            href: '/teklif',
          }}
        />
      </>
    );
  }

  // ── Mühendislik ────────────────────────────────────────────────────────────
  if (isKolu === 'muhendislik') {
    const fb = MUHENDISLIK_FALLBACK;
    const baslik =
      (data?.baslik ? pick(data.baslik, locale) : undefined) ??
      fb.baslik[locale];
    const ozet =
      (data?.ozet ? pick(data.ozet, locale) : undefined) ??
      fb.ozet[locale];

    const altHizmetler: AltHizmet[] =
      data?.altHizmetler && data.altHizmetler.length > 0
        ? data.altHizmetler
        : fb.altHizmetler;

    return (
      <>
        <PageHeader
          ust={locale === 'tr' ? 'Mühendislik & Uygulama' : 'Engineering & Application'}
          baslik={baslik}
          aciklama={ozet}
        />

        {/* Intro / icerik */}
        <Section>
          {data?.icerik && data.icerik.length > 0 ? (
            <PortableTextRenderer value={data.icerik} />
          ) : (
            <div className="mx-auto max-w-3xl space-y-4 text-base leading-relaxed text-muted">
              {fb.intro[locale].map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
        </Section>

        {/* Alt hizmetler */}
        <Section tone="muted">
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              {locale === 'tr' ? 'Uygulama Alanlarımız' : 'Our Service Areas'}
            </h2>
            <p className="mt-3 text-muted max-w-xl mx-auto text-sm">
              {locale === 'tr'
                ? 'Beş ana alanda uçtan uca mühendislik ve taahhüt hizmetleri sunuyoruz.'
                : 'We provide end-to-end engineering and contracting services across five core areas.'}
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {altHizmetler.map((h, i) => (
              <AltHizmetCard
                key={i}
                baslik={
                  (h.baslik ? pick(h.baslik, locale) : undefined) ??
                  h.baslik?.tr ??
                  ''
                }
                aciklama={
                  (h.aciklama ? pick(h.aciklama, locale) : undefined) ??
                  h.aciklama?.tr ??
                  ''
                }
              />
            ))}
          </div>
        </Section>

        {/* CTA */}
        <Cta
          baslik={
            locale === 'tr'
              ? 'Yangın güvenliği sistemleri için teklif alın'
              : 'Get a quote for fire-safety systems'
          }
          aciklama={
            locale === 'tr'
              ? 'Projenizin kapsamına göre anahtar teslim çözümler sunuyoruz. Ekibimizle hemen iletişime geçin.'
              : 'We deliver turnkey solutions tailored to your project scope. Contact our team today.'
          }
          buton={{
            etiket: locale === 'tr' ? 'Teklif İste' : 'Request a Quote',
            href: '/teklif',
          }}
        />
      </>
    );
  }

  // ── Yazılım veya bilinmeyen ────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        baslik={
          (data?.baslik ? pick(data.baslik, locale) : undefined) ??
          (locale === 'tr' ? 'Hizmetlerimiz' : 'Our Services')
        }
        aciklama={
          (data?.ozet ? pick(data.ozet, locale) : undefined) ?? undefined
        }
      />
      {data?.icerik && data.icerik.length > 0 && (
        <Section>
          <PortableTextRenderer value={data.icerik} />
        </Section>
      )}
    </>
  );
}
