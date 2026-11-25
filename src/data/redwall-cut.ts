// Redwall Cut — ürün kartı ve landing sayfası içeriği (TR/EN).
// Kaynak: RedwallCut deposunun README'si. Buradaki her cümle programın bugün yaptığı bir şeyi
// anlatır; ölçümler ölçüldüğü koşulla yazılır. Fiyat, müşteri yorumu ve istatistik yoktur.

export const REDWALL_CUT_SLUG = 'redwall-cut';
export const REDWALL_CUT_LOGO = '/images/redwall-cut/logo.svg';
export const REDWALL_CUT_SURUM = 'v0.1.1-beta.14';

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

/** Paket tablosundaki hücre: true = var, false = yok, metin = koşullu. */
type Hucre = boolean | string;

const tr = {
  meta: {
    baslik: 'Redwall Cut: Otomatik Video ve Fotoğraf Stüdyosu',
    aciklama:
      'Otel ve su sporları fotoğrafçıları için masaüstü program: karttaki drone ve kamera videolarından müziğe kurgulanmış klip ve en iyi fotoğrafları çıkarır. Görüntüler bilgisayarda işlenir.',
  },
  kirinti: { anaSayfa: 'Ana Sayfa', yazilim: 'Yazılım' },
  hero: {
    durum: `Ön sürüm ${REDWALL_CUT_SURUM}. Pilot aşamasına hazırlanıyor.`,
    baslik: 'Karttaki ham çekim, teslime hazır klip ve fotoğraflara dönüşür.',
    giris:
      'Redwall Cut, otellerde ve su sporları merkezlerinde misafir çekimi yapan fotoğrafçılar için bir masaüstü stüdyodur. Drone ve kamera videolarından müziğe kurgulanmış kısa bir klip ile en iyi kareleri çıkarır. Siz onaylarsınız, program teslim klasörünü hazırlar.',
    cta: 'Deneme ve tanıtım isteyin',
    ikincil: 'Nasıl çalıştığını görün',
  },
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
  adimlar: {
    baslik: 'Dört adım, programdaki sırasıyla',
    liste: [
      {
        ad: 'Giriş',
        baslik: 'Videoları bırakın',
        metin:
          'Kamera ya da drone kartını takın; program son çekimi eklemeyi önerir. Dosyaları ya da kart klasörünü sürükleyip bırakmak da yeter. Misafir adını, temayı, süreyi ve biçimi seçin.',
      },
      {
        ad: 'İşleme',
        baslik: 'Program kurgular ve seçer',
        metin:
          'Sahneler netlik, pozlama ve sabitliğe göre puanlanır, müziğin vuruşuna hizalanır. Fotoğraf hattı kameraya bakan, gülümseyen, gözü açık kareleri arar. Süre, 2 dakikalık hedefe karşı ekranda canlı izlenir.',
      },
      {
        ad: 'Onay',
        baslik: 'Son söz sizde',
        metin:
          'Her fotoğrafın yüz boyutu, bakış, gülümseme ve göz açıklığı ölçüsü görünür. Beğenmediğinizi teslimden çıkarın; "Başka kare" aynı çekimden sıradaki en iyi kareyi, "Başka parça" başka bir müzikle yeni kurguyu getirir.',
      },
      {
        ad: 'Teslim',
        baslik: 'Klasör hazır',
        metin:
          'Program misafirin adına teslim klasörünü hazırlar. USB belleğe kopyalayın ya da Studio paketinde QR koduyla doğrudan misafirin telefonuna verin.',
      },
    ],
    gorselAlt: 'Redwall Cut giriş ekranı: video bırakma alanı ve klip ayarları',
    gorselNot: 'Programın giriş ekranı. Gerçek arayüzden alınmıştır.',
  },
  sure: {
    baslik: 'Hedef: iki dakikada teslim',
    metin:
      'Bu bir hedeftir; bugüne kadar yalnızca tek bir koşulda ölçüldü. Kasım 2026\'da on adet 4K drone videosu (kurgulanmış klipler, 2,5 ile 5 dakika arası kaynak) Apple M1 Pro işlemcili bir Mac\'te baştan sona işlendi.',
    olcum: 'Ölçülen süre: 113 ile 137 saniye arası. On videonun dokuzu iki dakikanın altında bitti.',
    cikti: 'Her videodan 60 saniyelik yatay ve dikey klip, 10 fotoğraf ve boomerang üretildi.',
    sinir: 'Ham (kurgulanmamış) çekimde ve Windows ile Linux bilgisayarlarda süre henüz ölçülmedi.',
    eksen: { hedef: 'hedef 120 sn', olculen: 'ölçülen 113–137 sn', birim: 'sn' },
  },
  teslim: {
    baslik: 'Teslim klasöründe neler var',
    giris:
      'Her misafirin kendi klasörü olur. İçine yalnızca onayladığınız dosyalar girer; ek ürünler Ayarlar\'dan açılıp kapatılır.',
    liste: [
      { ad: 'Klip', dosya: 'klip.mp4', metin: 'Müziğin vuruşuna kurgulanmış klip; kaynak 4K ise 4K. Otel logolu intro kartıyla başlar, kapanış kartıyla biter.' },
      { ad: 'Dikey klip', dosya: '9:16', metin: 'Aynı kurgunun Reels ve TikTok için dikey sürümü; kırpma misafirlerin yüzünü izler. Studio paketinde.' },
      { ad: 'WhatsApp kopyası', dosya: 'klip_whatsapp.mp4', metin: 'Klibin 16 MB sınırının altında kalan küçük kopyası.' },
      { ad: 'Fotoğraflar', dosya: '4K', metin: 'Yalnızca onayladığınız kareler, 4K genişlikte. Arka plandaki yüzler isteğe göre bulanıklaştırılmış olarak.' },
      { ad: 'Kolaj', dosya: 'kolaj.jpg', metin: 'En iyi dört fotoğraf; altında otel logosu, misafir adı ve alt yazı.' },
      { ad: 'Dijital albüm', dosya: 'album.pdf', metin: 'Bir kapak ve sayfa başına bir fotoğraf, A4 yatay.' },
      { ad: 'Boomerang', dosya: 'boomerang.mp4 · .gif', metin: 'En yüksek puanlı karenin anından ileri geri oynayan sessiz döngü.' },
      { ad: 'Baskı kopyaları', dosya: 'baski/', metin: 'İsteğe bağlı 15×21 ve 20×30 cm, 300 DPI. Kırpma yüzleri kadrajda tutar.' },
    ],
  },
  ozellikler: {
    baslik: 'Sahada işinizi kısaltan ayrıntılar',
    liste: [
      { ad: 'Kart algılama', metin: 'Kart takılınca "Son çekimi ekle" tek tıkla en yeni çekimi listeye alır. Hiçbir video kendiliğinden eklenmez; ham videolar iş sürerken bilgisayara kopyalanır, kopya bitince kartı çıkarabilirsiniz.' },
      { ad: 'Kendi müziğiniz, vuruşa hizalı kurgu', metin: 'Lisanslı parçalarınızı bir kez eklersiniz. Program tempoyu ve vuruşları bulur, her klip için en uzun süredir kullanılmayan parçayı seçer ve klibi şarkının kendi finaliyle bitirir. Program müzik içermez.' },
      { ad: 'Yüzlere bakan fotoğraf seçimi', metin: 'Yüzler, drone çekimindeki küçük yüzleri de görebilen bir modelle bulunur; kameraya bakış, gülümseme, göz açıklığı ve netlik puanlanır. Çok uzak planda yüz ölçülemez; bu yüzden seçimi her zaman siz onaylarsınız.' },
      { ad: 'Sıradaki misafir beklemez', metin: 'Bir çekim işlenirken sıradaki misafirin videolarını eklersiniz. Birinin onayını yaparken diğerinin çekimi arkada işlenir.' },
      { ad: 'Altı tema', metin: 'Genel, Balayı, Aile, Doğum günü, Evlilik teklifi ve Arkadaşlar. Tema; sahne temposunu, geçişi, müzik enerjisini ve kartların vurgu rengini birlikte belirler.' },
      { ad: 'Yarım kalan iş kaybolmaz', metin: 'Kararlarınız her değişiklikte diske yazılır. Program kapanıp açıldığında ya da elektrik kesildiğinde onay bekleyen işler kararlarıyla geri gelir.' },
      { ad: 'İnternetsiz QR ile teslim', metin: 'Studio paketinde teslim klasörü yerel ağda küçük bir galeri olarak sunulur; misafir QR kodunu okutup klibi ve fotoğrafları indirir. Bulut gerekmez, bağlantı 60 dakika sonra kapanır.' },
      { ad: 'Dört dil', metin: 'Arayüz ve misafirin gördüğü QR sayfası Türkçe, İngilizce, Almanca ve Rusça açılır. Arayüz dilini seçmek Studio paketindedir.' },
    ],
  },
  paketler: {
    baslik: 'Starter ve Studio',
    giris: 'İki paket aynı işlem hattını kullanır. Studio, dikey video ve misafirin telefonuna teslim gibi satışı kolaylaştıran parçaları ekler.',
    ozellikSutunu: 'Özellik',
    satirlar: [
      { ad: 'Yatay klip, fotoğraflar, kolaj, albüm, boomerang', starter: true, studio: true },
      { ad: 'Müzik kütüphanesi ve iş kuyruğu', starter: true, studio: true },
      { ad: 'USB belleğe teslim', starter: true, studio: true },
      { ad: 'Saklama süresi ve yüz gizleme seçenekleri', starter: true, studio: true },
      { ad: 'Hazır temalar', starter: 'İlk beş tema', studio: 'Altı temanın hepsi' },
      { ad: 'Otele özel temalar', starter: false, studio: true },
      { ad: 'Dikey klip (9:16)', starter: false, studio: true },
      { ad: 'QR ile teslim', starter: false, studio: true },
      { ad: 'AirDrop ile teslim (yalnızca macOS)', starter: false, studio: true },
      { ad: 'Arayüz dili seçimi', starter: false, studio: true },
    ] as { ad: string; starter: Hucre; studio: Hucre }[],
    var: 'Var',
    yok: 'Yok',
    deneme: {
      baslik: '14 gün deneme',
      metin: 'Lisanssız ilk 14 gün bütün özellikler açıktır ve çekim sınırı yoktur. Deneme süresince çıktılar filigranlıdır.',
    },
    fiyat: {
      baslik: 'Fiyat',
      metin: 'Ürün henüz genel satışta değil. Paket ve lisans koşulları için teklif isteyin.',
    },
  },
  platformlar: {
    baslik: 'Hangi bilgisayarlarda çalışır',
    liste: [
      { ad: 'Windows', metin: 'Tek kurulum dosyası (.exe). Başlat menüsü ve masaüstü simgesini kurar.' },
      { ad: 'macOS', metin: 'Apple Silicon işlemcili Mac\'ler için .dmg. Intel Mac desteklenmez.' },
      { ad: 'Linux', metin: '.deb, .rpm, Arch paketi ve .tar.gz. glibc 2.35 ve sonrası: Ubuntu 22.04+, Debian 12+, Fedora 36+.' },
    ],
    not: 'Kurulum dosyası ihtiyaç duyduğu her şeyi içinde getirir. Program kendini güncellemez: yeni sürüm çıktığında haber verir, yeni kurulum dosyası eskisinin üzerine kurulur.',
  },
  gizlilik: {
    baslik: 'Görüntüler bilgisayarınızdan çıkmaz',
    giris:
      'Misafir görüntüsü kişisel veridir. Redwall Cut bu yüzden baştan yerelde çalışacak biçimde tasarlandı; KVKK ile ilgili seçenekler Ayarlar\'dadır ve hassas olanlar varsayılan olarak kapalıdır.',
    liste: [
      { ad: 'Yerelde işleme', metin: 'Video ve fotoğraflar bilgisayarda işlenir, buluta gönderilmez. Lisans sunucusuna yalnızca anahtar, sürüm, bilgisayar adı ve bilgisayar kimliğinin özeti gider; çekimlere ait hiçbir şey gitmez.' },
      { ad: 'Saklama süresi', metin: 'Teslimden sonra belirlediğiniz süre (varsayılan 30 gün) dolunca program uyarır ve süresi dolan işleri listeler. Siz seçmeden silmez; isterseniz otomatik silmeyi açabilirsiniz.' },
      { ad: 'Arka plandaki yüzler', metin: 'Fotoğraflarda arka planda kalan yüzler bulanıklaştırılır; tek tıkla geri alınır. Klipte gizleme isteğe bağlıdır. Karar yalnızca yüzün boyutuna bakar, kimlik tanıma yapılmaz.' },
      { ad: 'Yüz eşleştirme, yalnızca açık rızayla', metin: 'Bir misafirin önceki çekimlerini bulan bu özellik varsayılan olarak kapalıdır. Her aramadan önce misafirin açık rızasının alındığı sorulur; yüz izleri yalnızca arama sırasında bellekte tutulur, diske yazılmaz. Rızayı almak ve belgelemek işletmenin sorumluluğundadır.' },
    ],
  },
  kapanis: {
    baslik: 'Kendi çekiminizle deneyin',
    metin: 'Redwall Cut pilot aşamasına hazırlanıyor. Deneme sürümü ve tanıtım için formu doldurun; ekibimiz sizinle iletişime geçsin.',
    cta: 'Deneme ve tanıtım isteyin',
    ikincil: 'İletişim bilgileri',
  },
};

export type RedwallCutIcerik = typeof tr;

const en: RedwallCutIcerik = {
  meta: {
    baslik: 'Redwall Cut: Automatic Video and Photo Studio',
    aciklama:
      'A desktop app for hotel and water-sports photographers: it turns drone and camera footage from the card into a clip cut to music and the best photos. Footage is processed on the computer.',
  },
  kirinti: { anaSayfa: 'Home', yazilim: 'Software' },
  hero: {
    durum: `Pre-release ${REDWALL_CUT_SURUM}. Getting ready for pilots.`,
    baslik: 'Raw footage on the card becomes a clip and photos ready to hand over.',
    giris:
      'Redwall Cut is a desktop studio for photographers who shoot guests at hotels and water-sports centres. It turns drone and camera footage into a short clip cut to music and picks the best frames. You approve, and the app prepares the delivery folder.',
    cta: 'Request a trial and a walkthrough',
    ikincil: 'See how it works',
  },
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
  adimlar: {
    baslik: 'Four steps, in the order the app shows them',
    liste: [
      {
        ad: 'Input',
        baslik: 'Drop the videos',
        metin:
          'Insert the camera or drone card and the app offers to add the latest shoot. Dragging files or the card folder works too. Pick the guest name, theme, duration and format.',
      },
      {
        ad: 'Processing',
        baslik: 'The app edits and selects',
        metin:
          'Scenes are scored for sharpness, exposure and steadiness, then aligned to the beat of the music. The photo pipeline looks for frames where people face the camera, smile and have their eyes open. Elapsed time is shown live against the two-minute target.',
      },
      {
        ad: 'Approval',
        baslik: 'You have the final say',
        metin:
          'Each photo shows its face size, gaze, smile and eye-openness scores. Remove what you do not like; "Another frame" brings the next best frame from the same shoot, and "Another track" re-edits the clip to different music.',
      },
      {
        ad: 'Delivery',
        baslik: 'The folder is ready',
        metin:
          'The app prepares a delivery folder under the guest\'s name. Copy it to a USB stick or, on the Studio plan, hand it straight to the guest\'s phone with a QR code.',
      },
    ],
    gorselAlt: 'Redwall Cut input screen: video drop area and clip settings',
    gorselNot: 'The app\'s input screen, captured from the real interface (shown in Turkish).',
  },
  sure: {
    baslik: 'Target: delivery in two minutes',
    metin:
      'This is a target, measured so far under a single condition. In November 2026, ten 4K drone videos (edited clips, 2.5 to 5 minutes of source each) were processed end to end on a Mac with an Apple M1 Pro chip.',
    olcum: 'Measured time: 113 to 137 seconds. Nine of the ten videos finished in under two minutes.',
    cikti: 'Each video produced a 60-second horizontal and vertical clip, 10 photos and a boomerang.',
    sinir: 'Timing has not yet been measured on raw (unedited) footage or on Windows and Linux computers.',
    eksen: { hedef: 'target 120 s', olculen: 'measured 113–137 s', birim: 's' },
  },
  teslim: {
    baslik: 'What is in the delivery folder',
    giris:
      'Every guest gets their own folder. Only the files you approved go in; the extras are switched on and off in Settings.',
    liste: [
      { ad: 'Clip', dosya: 'klip.mp4', metin: 'A clip cut to the beat of the music; 4K when the source is 4K. Opens with an intro card carrying the hotel logo and ends with an outro card.' },
      { ad: 'Vertical clip', dosya: '9:16', metin: 'The same edit in vertical for Reels and TikTok; the crop follows the guests\' faces. Studio plan.' },
      { ad: 'WhatsApp copy', dosya: 'klip_whatsapp.mp4', metin: 'A small copy of the clip that stays under the 16 MB limit.' },
      { ad: 'Photos', dosya: '4K', metin: 'Only the frames you approved, 4K wide, with background faces blurred if you choose.' },
      { ad: 'Collage', dosya: 'kolaj.jpg', metin: 'The best four photos with the hotel logo, guest name and caption underneath.' },
      { ad: 'Digital album', dosya: 'album.pdf', metin: 'A cover and one photo per page, A4 landscape.' },
      { ad: 'Boomerang', dosya: 'boomerang.mp4 · .gif', metin: 'A silent back-and-forth loop taken from the moment of the top-scoring frame.' },
      { ad: 'Print copies', dosya: 'baski/', metin: 'Optional 15×21 and 20×30 cm at 300 DPI. The crop keeps faces in frame.' },
    ],
  },
  ozellikler: {
    baslik: 'Details that save time on site',
    liste: [
      { ad: 'Card detection', metin: 'When a card is inserted, "Add latest shoot" adds the newest shoot in one click. Nothing is added on its own; raw videos are copied to the computer while the job runs, and you can eject the card once the copy is done.' },
      { ad: 'Your own music, cut on the beat', metin: 'You add your licensed tracks once. The app finds tempo and beats, picks the track that has gone unused the longest for each clip and ends the clip on the song\'s own ending. The app ships with no music.' },
      { ad: 'Photo selection that looks at faces', metin: 'Faces are found with a model that can see the small faces in drone footage; gaze, smile, eye openness and sharpness are scored. Faces in very wide shots cannot be measured, which is why you always approve the selection.' },
      { ad: 'The next guest does not wait', metin: 'Add the next guest\'s videos while a shoot is processing. One shoot is processed in the background while you approve another.' },
      { ad: 'Six themes', metin: 'General, Honeymoon, Family, Birthday, Proposal and Friends. A theme sets scene tempo, transition, music energy and the accent colour of the cards together.' },
      { ad: 'Unfinished work is not lost', metin: 'Your decisions are written to disk on every change. After a restart or a power cut, jobs awaiting approval come back with their decisions.' },
      { ad: 'QR delivery without internet', metin: 'On the Studio plan the delivery folder is served as a small gallery on the local network; the guest scans the QR code and downloads the clip and photos. No cloud is involved and the link closes after 60 minutes.' },
      { ad: 'Four languages', metin: 'The interface and the QR page the guest sees open in Turkish, English, German and Russian. Choosing the interface language is part of the Studio plan.' },
    ],
  },
  paketler: {
    baslik: 'Starter and Studio',
    giris: 'Both plans run the same pipeline. Studio adds the pieces that help selling: vertical video and delivery to the guest\'s phone.',
    ozellikSutunu: 'Feature',
    satirlar: [
      { ad: 'Horizontal clip, photos, collage, album, boomerang', starter: true, studio: true },
      { ad: 'Music library and job queue', starter: true, studio: true },
      { ad: 'Delivery to a USB stick', starter: true, studio: true },
      { ad: 'Retention period and face-hiding options', starter: true, studio: true },
      { ad: 'Built-in themes', starter: 'First five themes', studio: 'All six themes' },
      { ad: 'Hotel-specific themes', starter: false, studio: true },
      { ad: 'Vertical clip (9:16)', starter: false, studio: true },
      { ad: 'QR delivery', starter: false, studio: true },
      { ad: 'AirDrop delivery (macOS only)', starter: false, studio: true },
      { ad: 'Interface language choice', starter: false, studio: true },
    ],
    var: 'Included',
    yok: 'Not included',
    deneme: {
      baslik: '14-day trial',
      metin: 'For the first 14 days without a licence every feature is on and there is no limit on shoots. Output is watermarked during the trial.',
    },
    fiyat: {
      baslik: 'Pricing',
      metin: 'The product is not on general sale yet. Ask us for a quote on plans and licence terms.',
    },
  },
  platformlar: {
    baslik: 'Where it runs',
    liste: [
      { ad: 'Windows', metin: 'A single installer (.exe). Adds Start menu and desktop shortcuts.' },
      { ad: 'macOS', metin: 'A .dmg for Macs with Apple Silicon. Intel Macs are not supported.' },
      { ad: 'Linux', metin: '.deb, .rpm, an Arch package and a .tar.gz. glibc 2.35 or later: Ubuntu 22.04+, Debian 12+, Fedora 36+.' },
    ],
    not: 'The installer brings everything it needs. The app does not update itself: it tells you when a new version is out, and the new installer is installed over the old one.',
  },
  gizlilik: {
    baslik: 'Footage never leaves your computer',
    giris:
      'Guest footage is personal data, so Redwall Cut was designed to run locally from the start. The options related to KVKK (Turkey\'s data protection law) live in Settings, and the sensitive ones are off by default.',
    liste: [
      { ad: 'Local processing', metin: 'Videos and photos are processed on the computer and are not uploaded. The licence server only receives the key, the version, the computer name and a hash of the computer ID; nothing about the shoots.' },
      { ad: 'Retention period', metin: 'When the period you set (30 days by default) has passed after delivery, the app warns you and lists the expired jobs. It does not delete without your choice; automatic deletion can be switched on if you want it.' },
      { ad: 'Faces in the background', metin: 'Background faces in photos are blurred, and one click undoes it. Hiding faces in the clip is optional. The decision looks only at face size; there is no identity recognition.' },
      { ad: 'Face matching, only with explicit consent', metin: 'This feature, which finds a guest\'s earlier shoots, is off by default. Before every search the app asks whether the guest\'s explicit consent was obtained; face signatures are kept in memory only during the search and never written to disk. Obtaining and documenting consent is the business\'s responsibility.' },
    ],
  },
  kapanis: {
    baslik: 'Try it with your own footage',
    metin: 'Redwall Cut is getting ready for pilots. Fill in the form for a trial build and a walkthrough, and our team will get in touch.',
    cta: 'Request a trial and a walkthrough',
    ikincil: 'Contact details',
  },
};

export const REDWALL_CUT_ICERIK: Record<'tr' | 'en', RedwallCutIcerik> = { tr, en };
