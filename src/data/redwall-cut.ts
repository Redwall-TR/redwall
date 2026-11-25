// Redwall Cut — ürün kartı ve landing sayfasının BAŞLANGIÇ içeriği (TR/EN).
// Asıl içerik CMS'tedir: /admin → Ürünler → Redwall Cut → "Tanıtım (landing) sayfası".
// Bu dosya (1) veri migration'ı ve seed ile CMS'e ilk kez yazılır, (2) CMS boşsa yedek olarak gösterilir.
// Kaynak: RedwallCut deposunun README'si. Her cümle programın bugün yaptığı bir şeyi anlatır;
// ölçümler ölçüldüğü koşulla yazılır. Fiyat, müşteri yorumu ve istatistik yoktur.

import type { Locale } from '@/lib/locales';

export const REDWALL_CUT_SLUG = 'redwall-cut';
export const REDWALL_CUT_LOGO = '/images/redwall-cut/logo.svg';

type L = Record<Locale, string>;
const l = (tr: string, en: string): L => ({ tr, en });

/** Liste kartı + CMS kaydı (migration ve seed aynı metni kullanır). */
export const REDWALL_CUT_KART = {
  slug: REDWALL_CUT_SLUG,
  ad: 'Redwall Cut',
  sira: 3,
  slogan: {
    tr: 'Ham Çekimden Teslime Hazır Klip ve Fotoğraflar',
    en: 'From Raw Footage to a Ready-to-Hand-Over Clip and Photos',
  },
  aciklama: {
    tr: 'Otel ve su sporları fotoğrafçıları için masaüstü video ve fotoğraf stüdyosu. Drone ve kamera videolarından müziğe kurgulanmış kısa bir klip ile en iyi kareleri çıkarır; görüntüler bilgisayarda işlenir, buluta gönderilmez.',
    en: 'A desktop video and photo studio for hotel and water-sports photographers. It turns drone and camera footage into a short clip cut to music plus the best frames; footage is processed on the computer and never uploaded.',
  },
} as const;

// ── Landing: CMS'teki `product.landing` alanıyla aynı biçim ───────────────────

export type BolumTuru =
  | 'adimlar' | 'sure' | 'teslim' | 'ozellikler' | 'paketler' | 'platformlar' | 'gizlilik' | 'kapanis';

/** T = L: CMS'ten `locale: 'all'` ile gelen/yazılan biçim. T = string: tek dile indirgenmiş biçim. */
export interface Landing<T = L> {
  durum?: T | null;
  baslik?: T | null;
  giris?: T | null;
  cta?: T | null;
  sureHedef?: number | null;
  sureEnAz?: number | null;
  sureEnCok?: number | null;
  bolumler?: Array<{
    id?: string | null;
    tur: BolumTuru;
    baslik?: T | null;
    giris?: T | null;
    not?: T | null;
    maddeler?: Array<{ id?: string | null; ad?: T | null; etiket?: T | null; metin?: T | null }> | null;
  }> | null;
  paketSatirlari?: Array<{ id?: string | null; ozellik?: T | null; starter?: T | null; studio?: T | null }> | null;
}

/**
 * { tr, en } yapraklarını tek dile indirir; seçilen dil boşsa Türkçeye düşer.
 * Hem sayfa (CMS verisini göstermek) hem migration (dil dil yazmak) bunu kullanır.
 */
export function yerellestir<T>(deger: T, locale: Locale): unknown {
  if (Array.isArray(deger)) return deger.map((d) => yerellestir(d, locale));
  if (deger && typeof deger === 'object') {
    const o = deger as Record<string, unknown>;
    const anahtarlar = Object.keys(o);
    if (anahtarlar.length > 0 && anahtarlar.every((k) => k === 'tr' || k === 'en')) {
      return o[locale] || o.tr || '';
    }
    return Object.fromEntries(anahtarlar.map((k) => [k, yerellestir(o[k], locale)]));
  }
  return deger;
}

/** Paket tablosu hücresi: "var"/"yok" (ya da yes/no) işarete döner, başka her şey metin kalır. */
export function paketHucresi(deger: string | null | undefined): boolean | string {
  const d = (deger ?? '').trim().toLocaleLowerCase('tr');
  if (['var', 'evet', 'yes', 'included', '✓'].includes(d)) return true;
  if (['', 'yok', 'hayır', 'no', 'not included', '-', '–'].includes(d)) return false;
  return (deger ?? '').trim();
}

export const REDWALL_CUT_LANDING: Landing = {
  durum: l(
    'Ön sürüm. Pilot aşamasına hazırlanıyor.',
    'Pre-release. Getting ready for pilots.',
  ),
  baslik: l(
    'Karttaki ham çekim, teslime hazır klip ve fotoğraflara dönüşür.',
    'Raw footage on the card becomes a clip and photos ready to hand over.',
  ),
  giris: l(
    'Redwall Cut, otellerde ve su sporları merkezlerinde misafir çekimi yapan fotoğrafçılar için bir masaüstü stüdyodur. Drone ve kamera videolarından müziğe kurgulanmış kısa bir klip ile en iyi kareleri çıkarır. Siz onaylarsınız, program teslim klasörünü hazırlar.',
    'Redwall Cut is a desktop studio for photographers who shoot guests at hotels and water-sports centres. It turns drone and camera footage into a short clip cut to music and picks the best frames. You approve, and the app prepares the delivery folder.',
  ),
  cta: l('Deneme ve tanıtım isteyin', 'Request a trial and a walkthrough'),
  sureHedef: 120,
  sureEnAz: 113,
  sureEnCok: 137,
  bolumler: [
    {
      tur: 'adimlar',
      baslik: l(
        'Dört adım, programdaki sırasıyla',
        'Four steps, in the order the app shows them',
      ),
      not: l(
        'Programın giriş ekranı. Gerçek arayüzden alınmıştır.',
        'The app\'s input screen, captured from the real interface (shown in Turkish).',
      ),
      maddeler: [
        {
          ad: l('Videoları bırakın', 'Drop the videos'),
          etiket: l('Giriş', 'Input'),
          metin: l(
            'Kamera ya da drone kartını takın; program son çekimi eklemeyi önerir. Dosyaları ya da kart klasörünü sürükleyip bırakmak da yeter. Misafir adını, temayı, süreyi ve biçimi seçin.',
            'Insert the camera or drone card and the app offers to add the latest shoot. Dragging files or the card folder works too. Pick the guest name, theme, duration and format.',
          ),
        },
        {
          ad: l('Program kurgular ve seçer', 'The app edits and selects'),
          etiket: l('İşleme', 'Processing'),
          metin: l(
            'Sahneler netlik, pozlama ve sabitliğe göre puanlanır, müziğin vuruşuna hizalanır. Fotoğraf hattı kameraya bakan, gülümseyen, gözü açık kareleri arar. Süre, 2 dakikalık hedefe karşı ekranda canlı izlenir.',
            'Scenes are scored for sharpness, exposure and steadiness, then aligned to the beat of the music. The photo pipeline looks for frames where people face the camera, smile and have their eyes open. Elapsed time is shown live against the two-minute target.',
          ),
        },
        {
          ad: l('Son söz sizde', 'You have the final say'),
          etiket: l('Onay', 'Approval'),
          metin: l(
            'Her fotoğrafın yüz boyutu, bakış, gülümseme ve göz açıklığı ölçüsü görünür. Beğenmediğinizi teslimden çıkarın; "Başka kare" aynı çekimden sıradaki en iyi kareyi, "Başka parça" başka bir müzikle yeni kurguyu getirir.',
            'Each photo shows its face size, gaze, smile and eye-openness scores. Remove what you do not like; "Another frame" brings the next best frame from the same shoot, and "Another track" re-edits the clip to different music.',
          ),
        },
        {
          ad: l('Klasör hazır', 'The folder is ready'),
          etiket: l('Teslim', 'Delivery'),
          metin: l(
            'Program misafirin adına teslim klasörünü hazırlar. USB belleğe kopyalayın ya da Studio paketinde QR koduyla doğrudan misafirin telefonuna verin.',
            'The app prepares a delivery folder under the guest\'s name. Copy it to a USB stick or, on the Studio plan, hand it straight to the guest\'s phone with a QR code.',
          ),
        },
      ],
    },
    {
      tur: 'sure',
      baslik: l('Hedef: iki dakikada teslim', 'Target: delivery in two minutes'),
      giris: l(
        'Bu bir hedeftir; bugüne kadar yalnızca tek bir koşulda ölçüldü. Kasım 2026\'da on adet 4K drone videosu (kurgulanmış klipler, 2,5 ile 5 dakika arası kaynak) Apple M1 Pro işlemcili bir Mac\'te baştan sona işlendi.',
        'This is a target, measured so far under a single condition. In November 2026, ten 4K drone videos (edited clips, 2.5 to 5 minutes of source each) were processed end to end on a Mac with an Apple M1 Pro chip.',
      ),
      maddeler: [
        {
          metin: l(
            'Ölçülen süre: 113 ile 137 saniye arası. On videonun dokuzu iki dakikanın altında bitti.',
            'Measured time: 113 to 137 seconds. Nine of the ten videos finished in under two minutes.',
          ),
        },
        {
          metin: l(
            'Her videodan 60 saniyelik yatay ve dikey klip, 10 fotoğraf ve boomerang üretildi.',
            'Each video produced a 60-second horizontal and vertical clip, 10 photos and a boomerang.',
          ),
        },
        {
          metin: l(
            'Ham (kurgulanmamış) çekimde ve Windows ile Linux bilgisayarlarda süre henüz ölçülmedi.',
            'Timing has not yet been measured on raw (unedited) footage or on Windows and Linux computers.',
          ),
        },
      ],
    },
    {
      tur: 'teslim',
      baslik: l('Teslim klasöründe neler var', 'What is in the delivery folder'),
      giris: l(
        'Her misafirin kendi klasörü olur. İçine yalnızca onayladığınız dosyalar girer; ek ürünler Ayarlar\'dan açılıp kapatılır.',
        'Every guest gets their own folder. Only the files you approved go in; the extras are switched on and off in Settings.',
      ),
      maddeler: [
        {
          ad: l('Klip', 'Clip'),
          etiket: l('klip.mp4', 'klip.mp4'),
          metin: l(
            'Müziğin vuruşuna kurgulanmış klip; kaynak 4K ise 4K. Otel logolu intro kartıyla başlar, kapanış kartıyla biter.',
            'A clip cut to the beat of the music; 4K when the source is 4K. Opens with an intro card carrying the hotel logo and ends with an outro card.',
          ),
        },
        {
          ad: l('Dikey klip', 'Vertical clip'),
          etiket: l('9:16', '9:16'),
          metin: l(
            'Aynı kurgunun Reels ve TikTok için dikey sürümü; kırpma misafirlerin yüzünü izler. Studio paketinde.',
            'The same edit in vertical for Reels and TikTok; the crop follows the guests\' faces. Studio plan.',
          ),
        },
        {
          ad: l('WhatsApp kopyası', 'WhatsApp copy'),
          etiket: l('klip_whatsapp.mp4', 'klip_whatsapp.mp4'),
          metin: l(
            'Klibin 16 MB sınırının altında kalan küçük kopyası.',
            'A small copy of the clip that stays under the 16 MB limit.',
          ),
        },
        {
          ad: l('Fotoğraflar', 'Photos'),
          etiket: l('4K', '4K'),
          metin: l(
            'Yalnızca onayladığınız kareler, 4K genişlikte. Arka plandaki yüzler isteğe göre bulanıklaştırılmış olarak.',
            'Only the frames you approved, 4K wide, with background faces blurred if you choose.',
          ),
        },
        {
          ad: l('Kolaj', 'Collage'),
          etiket: l('kolaj.jpg', 'kolaj.jpg'),
          metin: l(
            'En iyi dört fotoğraf; altında otel logosu, misafir adı ve alt yazı.',
            'The best four photos with the hotel logo, guest name and caption underneath.',
          ),
        },
        {
          ad: l('Dijital albüm', 'Digital album'),
          etiket: l('album.pdf', 'album.pdf'),
          metin: l(
            'Bir kapak ve sayfa başına bir fotoğraf, A4 yatay.',
            'A cover and one photo per page, A4 landscape.',
          ),
        },
        {
          ad: l('Boomerang', 'Boomerang'),
          etiket: l('boomerang.mp4 · .gif', 'boomerang.mp4 · .gif'),
          metin: l(
            'En yüksek puanlı karenin anından ileri geri oynayan sessiz döngü.',
            'A silent back-and-forth loop taken from the moment of the top-scoring frame.',
          ),
        },
        {
          ad: l('Baskı kopyaları', 'Print copies'),
          etiket: l('baski/', 'baski/'),
          metin: l(
            'İsteğe bağlı 15×21 ve 20×30 cm, 300 DPI. Kırpma yüzleri kadrajda tutar.',
            'Optional 15×21 and 20×30 cm at 300 DPI. The crop keeps faces in frame.',
          ),
        },
      ],
    },
    {
      tur: 'ozellikler',
      baslik: l('Sahada işinizi kısaltan ayrıntılar', 'Details that save time on site'),
      maddeler: [
        {
          ad: l('Kart algılama', 'Card detection'),
          metin: l(
            'Kart takılınca "Son çekimi ekle" tek tıkla en yeni çekimi listeye alır. Hiçbir video kendiliğinden eklenmez; ham videolar iş sürerken bilgisayara kopyalanır, kopya bitince kartı çıkarabilirsiniz.',
            'When a card is inserted, "Add latest shoot" adds the newest shoot in one click. Nothing is added on its own; raw videos are copied to the computer while the job runs, and you can eject the card once the copy is done.',
          ),
        },
        {
          ad: l('Kendi müziğiniz, vuruşa hizalı kurgu', 'Your own music, cut on the beat'),
          metin: l(
            'Lisanslı parçalarınızı bir kez eklersiniz. Program tempoyu ve vuruşları bulur, her klip için en uzun süredir kullanılmayan parçayı seçer ve klibi şarkının kendi finaliyle bitirir. Program müzik içermez.',
            'You add your licensed tracks once. The app finds tempo and beats, picks the track that has gone unused the longest for each clip and ends the clip on the song\'s own ending. The app ships with no music.',
          ),
        },
        {
          ad: l('Yüzlere bakan fotoğraf seçimi', 'Photo selection that looks at faces'),
          metin: l(
            'Yüzler, drone çekimindeki küçük yüzleri de görebilen bir modelle bulunur; kameraya bakış, gülümseme, göz açıklığı ve netlik puanlanır. Çok uzak planda yüz ölçülemez; bu yüzden seçimi her zaman siz onaylarsınız.',
            'Faces are found with a model that can see the small faces in drone footage; gaze, smile, eye openness and sharpness are scored. Faces in very wide shots cannot be measured, which is why you always approve the selection.',
          ),
        },
        {
          ad: l('Sıradaki misafir beklemez', 'The next guest does not wait'),
          metin: l(
            'Bir çekim işlenirken sıradaki misafirin videolarını eklersiniz. Birinin onayını yaparken diğerinin çekimi arkada işlenir.',
            'Add the next guest\'s videos while a shoot is processing. One shoot is processed in the background while you approve another.',
          ),
        },
        {
          ad: l('Altı tema', 'Six themes'),
          metin: l(
            'Genel, Balayı, Aile, Doğum günü, Evlilik teklifi ve Arkadaşlar. Tema; sahne temposunu, geçişi, müzik enerjisini ve kartların vurgu rengini birlikte belirler.',
            'General, Honeymoon, Family, Birthday, Proposal and Friends. A theme sets scene tempo, transition, music energy and the accent colour of the cards together.',
          ),
        },
        {
          ad: l('Yarım kalan iş kaybolmaz', 'Unfinished work is not lost'),
          metin: l(
            'Kararlarınız her değişiklikte diske yazılır. Program kapanıp açıldığında ya da elektrik kesildiğinde onay bekleyen işler kararlarıyla geri gelir.',
            'Your decisions are written to disk on every change. After a restart or a power cut, jobs awaiting approval come back with their decisions.',
          ),
        },
        {
          ad: l('İnternetsiz QR ile teslim', 'QR delivery without internet'),
          metin: l(
            'Studio paketinde teslim klasörü yerel ağda küçük bir galeri olarak sunulur; misafir QR kodunu okutup klibi ve fotoğrafları indirir. Bulut gerekmez, bağlantı 60 dakika sonra kapanır.',
            'On the Studio plan the delivery folder is served as a small gallery on the local network; the guest scans the QR code and downloads the clip and photos. No cloud is involved and the link closes after 60 minutes.',
          ),
        },
        {
          ad: l('Dört dil', 'Four languages'),
          metin: l(
            'Arayüz ve misafirin gördüğü QR sayfası Türkçe, İngilizce, Almanca ve Rusça açılır. Arayüz dilini seçmek Studio paketindedir.',
            'The interface and the QR page the guest sees open in Turkish, English, German and Russian. Choosing the interface language is part of the Studio plan.',
          ),
        },
      ],
    },
    {
      tur: 'paketler',
      baslik: l('Starter ve Studio', 'Starter and Studio'),
      giris: l(
        'İki paket aynı işlem hattını kullanır. Studio, dikey video ve misafirin telefonuna teslim gibi satışı kolaylaştıran parçaları ekler.',
        'Both plans run the same pipeline. Studio adds the pieces that help selling: vertical video and delivery to the guest\'s phone.',
      ),
      maddeler: [
        {
          ad: l('14 gün deneme', '14-day trial'),
          metin: l(
            'Lisanssız ilk 14 gün bütün özellikler açıktır ve çekim sınırı yoktur. Deneme süresince çıktılar filigranlıdır.',
            'For the first 14 days without a licence every feature is on and there is no limit on shoots. Output is watermarked during the trial.',
          ),
        },
        {
          ad: l('Fiyat', 'Pricing'),
          metin: l(
            'Ürün henüz genel satışta değil. Paket ve lisans koşulları için teklif isteyin.',
            'The product is not on general sale yet. Ask us for a quote on plans and licence terms.',
          ),
        },
      ],
    },
    {
      tur: 'platformlar',
      baslik: l('Hangi bilgisayarlarda çalışır', 'Where it runs'),
      not: l(
        'Kurulum dosyası ihtiyaç duyduğu her şeyi içinde getirir. Program kendini güncellemez: yeni sürüm çıktığında haber verir, yeni kurulum dosyası eskisinin üzerine kurulur.',
        'The installer brings everything it needs. The app does not update itself: it tells you when a new version is out, and the new installer is installed over the old one.',
      ),
      maddeler: [
        {
          ad: l('Windows', 'Windows'),
          metin: l(
            'Tek kurulum dosyası (.exe). Başlat menüsü ve masaüstü simgesini kurar.',
            'A single installer (.exe). Adds Start menu and desktop shortcuts.',
          ),
        },
        {
          ad: l('macOS', 'macOS'),
          metin: l(
            'Apple Silicon işlemcili Mac\'ler için .dmg. Intel Mac desteklenmez.',
            'A .dmg for Macs with Apple Silicon. Intel Macs are not supported.',
          ),
        },
        {
          ad: l('Linux', 'Linux'),
          metin: l(
            '.deb, .rpm, Arch paketi ve .tar.gz. glibc 2.35 ve sonrası: Ubuntu 22.04+, Debian 12+, Fedora 36+.',
            '.deb, .rpm, an Arch package and a .tar.gz. glibc 2.35 or later: Ubuntu 22.04+, Debian 12+, Fedora 36+.',
          ),
        },
      ],
    },
    {
      tur: 'gizlilik',
      baslik: l('Görüntüler bilgisayarınızdan çıkmaz', 'Footage never leaves your computer'),
      giris: l(
        'Misafir görüntüsü kişisel veridir. Redwall Cut bu yüzden baştan yerelde çalışacak biçimde tasarlandı; KVKK ile ilgili seçenekler Ayarlar\'dadır ve hassas olanlar varsayılan olarak kapalıdır.',
        'Guest footage is personal data, so Redwall Cut was designed to run locally from the start. The options related to KVKK (Turkey\'s data protection law) live in Settings, and the sensitive ones are off by default.',
      ),
      maddeler: [
        {
          ad: l('Yerelde işleme', 'Local processing'),
          metin: l(
            'Video ve fotoğraflar bilgisayarda işlenir, buluta gönderilmez. Lisans sunucusuna yalnızca anahtar, sürüm, bilgisayar adı ve bilgisayar kimliğinin özeti gider; çekimlere ait hiçbir şey gitmez.',
            'Videos and photos are processed on the computer and are not uploaded. The licence server only receives the key, the version, the computer name and a hash of the computer ID; nothing about the shoots.',
          ),
        },
        {
          ad: l('Saklama süresi', 'Retention period'),
          metin: l(
            'Teslimden sonra belirlediğiniz süre (varsayılan 30 gün) dolunca program uyarır ve süresi dolan işleri listeler. Siz seçmeden silmez; isterseniz otomatik silmeyi açabilirsiniz.',
            'When the period you set (30 days by default) has passed after delivery, the app warns you and lists the expired jobs. It does not delete without your choice; automatic deletion can be switched on if you want it.',
          ),
        },
        {
          ad: l('Arka plandaki yüzler', 'Faces in the background'),
          metin: l(
            'Fotoğraflarda arka planda kalan yüzler bulanıklaştırılır; tek tıkla geri alınır. Klipte gizleme isteğe bağlıdır. Karar yalnızca yüzün boyutuna bakar, kimlik tanıma yapılmaz.',
            'Background faces in photos are blurred, and one click undoes it. Hiding faces in the clip is optional. The decision looks only at face size; there is no identity recognition.',
          ),
        },
        {
          ad: l(
            'Yüz eşleştirme, yalnızca açık rızayla',
            'Face matching, only with explicit consent',
          ),
          metin: l(
            'Bir misafirin önceki çekimlerini bulan bu özellik varsayılan olarak kapalıdır. Her aramadan önce misafirin açık rızasının alındığı sorulur; yüz izleri yalnızca arama sırasında bellekte tutulur, diske yazılmaz. Rızayı almak ve belgelemek işletmenin sorumluluğundadır.',
            'This feature, which finds a guest\'s earlier shoots, is off by default. Before every search the app asks whether the guest\'s explicit consent was obtained; face signatures are kept in memory only during the search and never written to disk. Obtaining and documenting consent is the business\'s responsibility.',
          ),
        },
      ],
    },
    {
      tur: 'kapanis',
      baslik: l('Kendi çekiminizle deneyin', 'Try it with your own footage'),
      giris: l(
        'Redwall Cut pilot aşamasına hazırlanıyor. Deneme sürümü ve tanıtım için formu doldurun; ekibimiz sizinle iletişime geçsin.',
        'Redwall Cut is getting ready for pilots. Fill in the form for a trial build and a walkthrough, and our team will get in touch.',
      ),
    },
  ],
  paketSatirlari: [
    {
      ozellik: l(
        'Yatay klip, fotoğraflar, kolaj, albüm, boomerang',
        'Horizontal clip, photos, collage, album, boomerang',
      ),
      starter: l('var', 'yes'),
      studio: l('var', 'yes'),
    },
    {
      ozellik: l('Müzik kütüphanesi ve iş kuyruğu', 'Music library and job queue'),
      starter: l('var', 'yes'),
      studio: l('var', 'yes'),
    },
    {
      ozellik: l('USB belleğe teslim', 'Delivery to a USB stick'),
      starter: l('var', 'yes'),
      studio: l('var', 'yes'),
    },
    {
      ozellik: l(
        'Saklama süresi ve yüz gizleme seçenekleri',
        'Retention period and face-hiding options',
      ),
      starter: l('var', 'yes'),
      studio: l('var', 'yes'),
    },
    {
      ozellik: l('Hazır temalar', 'Built-in themes'),
      starter: l('İlk beş tema', 'First five themes'),
      studio: l('Altı temanın hepsi', 'All six themes'),
    },
    {
      ozellik: l('Otele özel temalar', 'Hotel-specific themes'),
      starter: l('yok', 'no'),
      studio: l('var', 'yes'),
    },
    {
      ozellik: l('Dikey klip (9:16)', 'Vertical clip (9:16)'),
      starter: l('yok', 'no'),
      studio: l('var', 'yes'),
    },
    {
      ozellik: l('QR ile teslim', 'QR delivery'),
      starter: l('yok', 'no'),
      studio: l('var', 'yes'),
    },
    {
      ozellik: l('AirDrop ile teslim (yalnızca macOS)', 'AirDrop delivery (macOS only)'),
      starter: l('yok', 'no'),
      studio: l('var', 'yes'),
    },
    {
      ozellik: l('Arayüz dili seçimi', 'Interface language choice'),
      starter: l('yok', 'no'),
      studio: l('var', 'yes'),
    },
  ],
};

/** CMS'ten yönetilmeyen kısa arayüz yazıları (şema etiketleri, erişilebilirlik metinleri). */
export const REDWALL_CUT_ARAYUZ = {
  tr: {
    anaSayfa: 'Ana Sayfa',
    yazilim: 'Yazılım',
    nasilCalisir: 'Nasıl çalıştığını görün',
    iletisim: 'İletişim bilgileri',
    ozellik: 'Özellik',
    var: 'Var',
    yok: 'Yok',
    hedef: (sn: number) => `hedef ${sn} sn`,
    olculen: (a: number, b: number) => `ölçülen ${a}–${b} sn`,
    gorselAlt: 'Redwall Cut giriş ekranı: video bırakma alanı ve klip ayarları',
    serit: {
      aciklama:
        'Şema: program ham çekimin en iyi sahnelerini seçer, müziğin vuruşuna dizer ve yanına en iyi kareleri koyar.',
      ham: { ad: 'Ham çekim', not: 'karttaki 4K videolar' },
      vurus: { ad: 'Müzik', not: 'sahneler vuruşa hizalanır' },
      klip: { ad: 'Klip', not: '15, 30 ya da 60 saniye' },
      foto: { ad: 'Fotoğraflar', not: 'en iyi kareler, siz onaylarsınız' },
      intro: 'intro',
      kapanis: 'kapanış',
    },
  },
  en: {
    anaSayfa: 'Home',
    yazilim: 'Software',
    nasilCalisir: 'See how it works',
    iletisim: 'Contact details',
    ozellik: 'Feature',
    var: 'Included',
    yok: 'Not included',
    hedef: (sn: number) => `target ${sn} s`,
    olculen: (a: number, b: number) => `measured ${a}–${b} s`,
    gorselAlt: 'Redwall Cut input screen: video drop area and clip settings',
    serit: {
      aciklama:
        'Diagram: the app picks the best scenes of the raw footage, lays them on the beat of the music and adds the best frames.',
      ham: { ad: 'Raw footage', not: '4K videos on the card' },
      vurus: { ad: 'Music', not: 'scenes snap to the beat' },
      klip: { ad: 'Clip', not: '15, 30 or 60 seconds' },
      foto: { ad: 'Photos', not: 'best frames, approved by you' },
      intro: 'intro',
      kapanis: 'outro',
    },
  },
};
export type RedwallCutArayuz = (typeof REDWALL_CUT_ARAYUZ)['tr'];
