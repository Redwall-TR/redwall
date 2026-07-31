/**
 * Türkiye'nin 81 ili.
 *
 * NOT — Bu liste görünür arayüzde ŞEHİR ADI basmak için DEĞİL; yalnızca
 * makine-okur katmanlarda (LocalBusiness JSON-LD `areaServed`, hizmet kapsam
 * sinyali) kullanılır. Böylece arama motorları ve AI ajanları "[il] yangın
 * danışmanlığı / yangın sistemleri" sorgularında Redwall'ı ilişkilendirir,
 * sayfada 81 şehir adı görünmeden.
 *
 * Plaka sırasına göre (1–81).
 */
export const TR_PROVINCES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya',
  'Artvin', 'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu',
  'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır',
  'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep',
  'Giresun', 'Gümüşhane', 'Hakkâri', 'Hatay', 'Isparta', 'Mersin', 'İstanbul',
  'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir', 'Kocaeli',
  'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla',
  'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt',
  'Sinop', 'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa',
  'Uşak', 'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman',
  'Kırıkkale', 'Batman', 'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova',
  'Karabük', 'Kilis', 'Osmaniye', 'Düzce',
] as const;

export type TrProvince = (typeof TR_PROVINCES)[number];

/**
 * Aktif hizmet bölgesi (şimdilik) — Sakarya ve yakın çevre (Marmara/Batı Karadeniz sınırı).
 * Makine-okur `areaServed` sinyali bu illere odaklanır; abartılı 81-il iddiası yerine
 * gerçekten hizmet verilen bölge → Google için otantik, güvenilir sinyal.
 * İleride genişletmek için TR_PROVINCES hazır.
 */
export const SERVICE_PROVINCES = ['Sakarya', 'Kocaeli', 'Düzce', 'Bolu'] as const;
