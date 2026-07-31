/**
 * Şehir-özel yangın danışmanlığı / yangın sistemleri landing içeriği.
 *
 * AMAÇ — "[şehir] yangın danışmanlığı" ve "[şehir] yangın sistemleri" aramalarında
 * gerçek, özgün, değerli içerikli sayfalarla üst sıraları hedeflemek.
 *
 * DOORWAY-PAGE RİSKİ — Her şehir sayfasının özgün yerel içeriği (ilçeler, sanayi
 * bölgeleri, o şehre özgü yangın risk profili) VARDIR; bu sayede sayfalar
 * birbirinin kopyası değil, her biri o şehir için gerçek bilgi taşıyan
 * landing'lerdir. Ortak hizmet tanımları paylaşılır, YEREL BAĞLAM farklılaşır.
 *
 * CMS-HAZIR — Route bu içeriği "varsayılan" olarak kullanır; ileride Payload
 * "Şehir Sayfaları" koleksiyonu eklendiğinde CMS içeriği bunun üzerine biner
 * (getCityOverride). Şimdilik override yok, kod içeriği render edilir.
 */

export type CityService = 'danismanlik' | 'sistemleri';

export interface CityBase {
  /** URL slug — ör. 'sakarya' */
  slug: string;
  /** Görünen il adı — ör. 'Sakarya' */
  il: string;
  /** Merkez ilçe — ör. 'Adapazarı' */
  merkez: string;
  /** Hizmet verilen ilçeler (yerel sinyal) */
  ilceler: string[];
  /** Öne çıkan sanayi bölgeleri / üretim odakları */
  sanayi: string[];
  /** Koordinat (yaklaşık il merkezi) */
  geo: { lat: number; lng: number };
  /** Bulunma hâli eki (ünlü uyumu) — ör. Sakarya’da, Kocaeli’nde, Düzce’de, Bolu’da */
  ekDe: string;
  /** Bulunma + ki eki — ör. Sakarya’daki, Kocaeli’ndeki, Düzce’deki, Bolu’daki */
  ekDeki: string;
  /** İlgi hâli eki — ör. Sakarya’nın, Kocaeli’nin, Düzce’nin, Bolu’nun */
  ekNin: string;
  /** O şehre özgü tanıtım paragrafı (özgün) */
  yerelBaglam: string;
  /** O şehre özgü yangın risk profili (özgün) */
  riskProfili: string;
}

export const CITIES: Record<string, CityBase> = {
  sakarya: {
    slug: 'sakarya',
    il: 'Sakarya',
    merkez: 'Adapazarı',
    ilceler: [
      'Adapazarı', 'Serdivan', 'Erenler', 'Arifiye', 'Hendek', 'Akyazı',
      'Karasu', 'Ferizli', 'Geyve', 'Pamukova', 'Sapanca', 'Söğütlü', 'Karapürçek',
    ],
    sanayi: [
      '1. Organize Sanayi Bölgesi (Arifiye)', 'Sakarya 2. OSB',
      'otomotiv ana ve yan sanayi', 'makine ve metal imalatı', 'gıda sanayi',
    ],
    geo: { lat: 40.7808, lng: 30.4033 },
    ekDe: '’da', ekDeki: '’daki', ekNin: '’nın',
    yerelBaglam:
      'Sakarya, otomotiv ana ve yan sanayinin yoğunlaştığı, organize sanayi bölgelerinde binlerce çalışanın istihdam edildiği bir üretim şehridir. Adapazarı, Serdivan ve Arifiye hattındaki büyük ölçekli tesisler, lojistik depolar ve Sapanca çevresindeki konaklama işletmeleri farklı yangın yükleri barındırır.',
    riskProfili:
      '1999 Marmara depreminde Adapazarı’nın ağır hasar görmesi, bölgede yapı ve tesis güvenliği bilincini yükseltmiştir. Otomotiv yan sanayindeki boyahaneler, kimyasal depolama alanları ve büyük üretim hatları; doğru risk analizi, aktif söndürme ve tahliye planlaması gerektirir.',
  },
  kocaeli: {
    slug: 'kocaeli',
    il: 'Kocaeli',
    merkez: 'İzmit',
    ilceler: [
      'İzmit', 'Gebze', 'Darıca', 'Çayırova', 'Körfez', 'Derince', 'Gölcük',
      'Başiskele', 'Kartepe', 'Karamürsel', 'Dilovası', 'Kandıra',
    ],
    sanayi: [
      'Gebze Organize Sanayi Bölgesi (GOSB)', 'Dilovası OSB (kimya/petrokimya)',
      'rafineri ve petrokimya tesisleri', 'otomotiv fabrikaları', 'liman ve lojistik depoları',
    ],
    geo: { lat: 40.7654, lng: 29.9408 },
    ekDe: '’nde', ekDeki: '’ndeki', ekNin: '’nin',
    yerelBaglam:
      'Kocaeli, rafineri, petrokimya ve otomotiv devlerinin bulunduğu Türkiye’nin sanayi kalbidir. Gebze’den Dilovası’na uzanan hatta yüksek tehlike sınıfı tesisler, kimyasal depolama alanları ve liman lojistiği yoğunlaşır.',
    riskProfili:
      'Petrokimya, rafineri ve kimya tesisleri yüksek yangın ve patlama riski taşır; bu tesisler SEVESO direktifi ve sıkı ulusal mevzuat kapsamındadır. Büyük hacimli depolar, tank çiftlikleri ve proses üniteleri; köpüklü söndürme, gaz algılama ve ileri düzey yangın senaryolarının profesyonelce tasarlanmasını zorunlu kılar.',
  },
  duzce: {
    slug: 'duzce',
    il: 'Düzce',
    merkez: 'Düzce Merkez',
    ilceler: [
      'Merkez', 'Akçakoca', 'Kaynaşlı', 'Gölyaka', 'Çilimli', 'Cumayeri',
      'Gümüşova', 'Yığılca',
    ],
    sanayi: [
      'Düzce Organize Sanayi Bölgesi', 'orman ürünleri ve mobilya sanayi',
      'cam ve tekstil üretimi', 'otomotiv yan sanayi',
    ],
    geo: { lat: 40.8438, lng: 31.1565 },
    ekDe: '’de', ekDeki: '’deki', ekNin: '’nin',
    yerelBaglam:
      'Düzce, orman ürünleri, mobilya ve imalat sanayisiyle öne çıkan bir üretim şehridir. Akçakoca’nın konaklama tesisleri ile OSB’deki ahşap işleme ve üretim tesisleri, birbirinden farklı yangın güvenliği ihtiyaçları doğurur.',
    riskProfili:
      '1999 Düzce depreminin merkez üssüne yakınlık, yapı güvenliği hassasiyetini artırmıştır. Ahşap işleme ve mobilya tesislerindeki yüksek yanıcı yük; toz patlaması riski, uygun ayırma, algılama ve söndürme sistemleriyle yönetilmesi gereken kritik bir alandır.',
  },
  bolu: {
    slug: 'bolu',
    il: 'Bolu',
    merkez: 'Bolu Merkez',
    ilceler: [
      'Merkez', 'Gerede', 'Mengen', 'Mudurnu', 'Göynük', 'Seben', 'Yeniçağa',
      'Dörtdivan', 'Kıbrıscık',
    ],
    sanayi: [
      'Kartalkaya ve Abant konaklama tesisleri', 'Gerede sanayi ve lojistik',
      'gıda ve entegre tesisler', 'tavukçuluk entegre işletmeleri',
    ],
    geo: { lat: 40.7397, lng: 31.6069 },
    ekDe: '’da', ekDeki: '’daki', ekNin: '’nun',
    yerelBaglam:
      'Bolu, Kartalkaya ve Abant’ın konaklama tesisleriyle önemli bir turizm merkezi; aynı zamanda Gerede sanayisi ve gıda entegre tesisleriyle çeşitli üretim faaliyetlerine ev sahipliği yapar. Bolu Dağı geçişi ve yüksek yolcu trafiği de bölgeyi stratejik kılar.',
    riskProfili:
      'Otel ve konaklama tesislerinde yangın güvenliği hayati önemdedir; tahliye planı, otomatik algılama-alarm ve söndürme sistemleri ile düzenli denetim, misafir ve personel güvenliğinin temelidir. Gıda entegre tesisleri ve soğuk hava depoları ise ayrı yangın senaryoları gerektirir.',
  },
};

export const CITY_SLUGS = Object.keys(CITIES);

// ── Hizmet tanımları (şehirler arası paylaşılır; yerel bağlam farklılaşır) ──────

export interface ServiceCopy {
  /** Sayfa başlığı eki — "{İl} Yangın Danışmanlığı" */
  adKisa: string;
  /** SEO/H1 için hizmet etiketi */
  hizmetEtiketi: string;
  /** Hizmet kapsamı maddeleri */
  kapsam: { baslik: string; metin: string }[];
  /** İç link hedefi (ana hizmet sayfası) */
  anaHizmetHref: string;
}

export const SERVICES: Record<CityService, ServiceCopy> = {
  danismanlik: {
    adKisa: 'Yangın Danışmanlığı',
    hizmetEtiketi: 'yangın danışmanlığı',
    anaHizmetHref: '/danismanlik',
    kapsam: [
      {
        baslik: 'İtfaiye Uygunluk Raporu',
        metin:
          'Binaların Yangından Korunması Hakkında Yönetmelik kapsamında projelerin hazırlanması ve itfaiyeden olumlu uygunluk raporu alınması sürecinin uçtan uca yönetimi.',
      },
      {
        baslik: 'Yangın Risk Analizi',
        metin:
          'Tesise özgü yangın yükü, tehlike sınıfı ve senaryo analizi; eksikliklerin raporlanması ve önceliklendirilmiş iyileştirme yol haritası.',
      },
      {
        baslik: 'Mevzuat & Denetime Hazırlık',
        metin:
          'Yürürlükteki yangın mevzuatına tam uyum, resmi denetimlere hazırlık ve eksik giderme danışmanlığı.',
      },
      {
        baslik: 'Tahliye ve Acil Durum Planı',
        metin:
          'Bina tahliye planları, yönlendirme, acil durum organizasyonu ve personel bilinçlendirme desteği.',
      },
    ],
  },
  sistemleri: {
    adKisa: 'Yangın Sistemleri',
    hizmetEtiketi: 'yangın sistemleri',
    anaHizmetHref: '/muhendislik',
    kapsam: [
      {
        baslik: 'Yangın Algılama & Alarm',
        metin:
          'Adresli/konvansiyonel yangın algılama, duman ve ısı dedektörleri, alarm ve seslendirme sistemlerinin projelendirilmesi ve kurulumu.',
      },
      {
        baslik: 'Söndürme Sistemleri',
        metin:
          'Sprinkler, yangın dolabı, hidrant, köpüklü ve gazlı (temiz gaz) söndürme sistemleri ile pompa istasyonlarının uygulaması.',
      },
      {
        baslik: 'Pasif Yangın Önlemleri',
        metin:
          'Yangın kapıları, yangın durdurucu (firestop) uygulamalar, duman perdeleri ve kompartıman ayrımı çözümleri.',
      },
      {
        baslik: 'Periyodik Bakım & Test',
        metin:
          'Kurulu sistemlerin mevzuata uygun periyodik bakımı, testi ve raporlanması; sürekli işler durumda tutulması.',
      },
    ],
  },
};

export function getCity(slug: string): CityBase | null {
  return CITIES[slug] ?? null;
}
