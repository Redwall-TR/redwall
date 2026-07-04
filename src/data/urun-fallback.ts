import type { Feature } from '@/components/sections/ProductFeatures';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LocaleString {
  tr: string;
  en: string;
}

// ── Known product slugs (always prerender) ────────────────────────────────────

export const KNOWN_SLUGS = ['yanginpro', 'mekanikpro'] as const;
export type KnownSlug = (typeof KNOWN_SLUGS)[number];

// ── Feature icon mapping (index-based per product) ───────────────────────────

export const FEATURE_ICONS: Record<KnownSlug, string[]> = {
  yanginpro: ['shield-check', 'building', 'ruler', 'document', 'key', 'gauge'],
  mekanikpro: ['gauge', 'ruler', 'droplet', 'wrench', 'document', 'refresh'],
};

// ── Fallback content ──────────────────────────────────────────────────────────

export const FALLBACK: Record<KnownSlug, { ad: string; slogan: LocaleString; aciklama: LocaleString; ozellikler: Feature[]; hedefKitle: LocaleString[] }> = {
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
