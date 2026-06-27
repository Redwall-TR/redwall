# Redwall Kurumsal Web Sitesi — Tasarım Dokümanı

**Tarih:** 2026-06-27
**Durum:** Onay bekliyor
**Şirket:** Redwall Yangın Danışmanlık Yazılım ve Mühendislik Hizmetleri LTD Şti.

---

## 1. Amaç ve Kapsam

Redwall'un resmi kurumsal web sitesini, şirketin **üç ana iş kolunu** net biçimde
ayıran çok sayfalı (multi-page) bir yapı olarak yeniden kurmak:

1. **Yazılım** — Fikri mülkiyeti şirkete ait yazılım ürünlerini geliştiren ve pazarlayan
   Ar-Ge kolu. Ürünler: **YangınPro**, **MekanikPro**.
2. **Yangın Danışmanlığı** — Kurumlara, müteahhitlere ve mal sahiplerine itfaiyeden
   olumlu rapor almalarını sağlayan, yönetmeliğe uygunluk çözümleri üreten ve
   projelendiren kol.
3. **Mühendislik & Uygulama** — Aktif söndürme sistemleri, pasif önleme sistemleri ve
   bunların sahada uygulanması; ayrıca sıhhi ve kalorifer (mekanik) tesisat
   mühendislik hizmetleri.

Mevcut Next.js 16 + React 19 + Tailwind v4 + TypeScript altyapısı **korunur**;
bilgi mimarisi, içerik ve görsel dil baştan kurgulanır.

### Kararlar (kullanıcı onaylı)
- **Mimari:** Çok sayfalı kurumsal site.
- **İçerik:** Profesyonel metinler taslak olarak yazılacak; gerçek bilgiler
  sonradan kullanıcı tarafından güncellenecek.
- **Çoklu dil:** **Türkçe (varsayılan) + İngilizce**, **`/tr` ve `/en` ön ekli
  URL** yapısı, **next-intl** kütüphanesi ile. Hemen kapsam içinde.
- **Tema:** **Koyu + Açık tema** desteği, kullanıcı tercihiyle değiştirilebilir.
- **İletişim/kurumsal veriler:** Şimdilik placeholder; `ICERIK-TODO.md` ile listelenecek.
- **Görsel yön:** Belirgin & özgün kurumsal (şablon hissinden uzak).

---

## 2. Bilgi Mimarisi (Sayfa Haritası)

Tüm rotalar dil ön ekiyle servis edilir: `/[locale]/...` (locale = `tr` | `en`).
Kök `/` ziyareti tercih edilen dile (varsayılan `tr`) yönlendirilir. Aşağıdaki
harita locale ön eki gizlenerek gösterilmiştir (örn. `/yazilim` = `/tr/yazilim`).

```
/                              Ana sayfa
├── /yazilim                   YAZILIM (iş kolu)
│   ├── /yazilim/yanginpro      Ürün: YangınPro
│   └── /yazilim/mekanikpro     Ürün: MekanikPro
├── /danismanlik               YANGIN DANIŞMANLIĞI
├── /muhendislik               MÜHENDİSLİK & UYGULAMA
├── /projeler                  PROJELER (filtreli portfolyo)
│   └── /projeler/[slug]        Proje detay
├── /referanslar               REFERANSLAR (logo duvarı + görüşler)
├── /kurumsal
│   ├── /kurumsal/hakkimizda
│   ├── /kurumsal/vizyon-misyon
│   └── /kurumsal/kalite-belgeler
├── /sss                       SIK SORULAN SORULAR
├── /blog                      BLOG / HABERLER
│   └── /blog/[slug]            Yazı detay
├── /kariyer                   KARİYER
├── /teklif                    TEKLİF İSTE (yapılandırılmış form)
└── /iletisim                  İLETİŞİM
```

### Navigasyon (Header)
Birincil menü dönüşüm odaklı tutulur; ikincil sayfalar "Daha Fazla" altında toplanır:

> **Yazılım ▾** (YangınPro, MekanikPro) · **Danışmanlık** · **Mühendislik** ·
> **Projeler** · **Kurumsal ▾** (Hakkımızda, Vizyon & Misyon, Kalite & Belgeler) ·
> **Daha Fazla ▾** (Referanslar, SSS, Blog, Kariyer) · **[ Teklif İste ]** (vurgulu CTA)

Footer tüm sayfaları açıkça, sütunlara ayrılmış olarak listeler.

---

## 3. Teknik Mimari

- **Stack:** Next.js 16 (App Router), React 19, Tailwind v4, TypeScript.
  Eklenen kütüphaneler: **next-intl** (çoklu dil), tema için **next-themes**
  (veya eşdeğeri hafif çözüm). Bunun dışında yeni runtime bağımlılığı eklenmez.
- **Çoklu dil (next-intl):**
  - Rotalar `src/app/[locale]/...` altında; `locale` = `tr` | `en`, varsayılan `tr`.
  - Çeviriler `src/messages/tr.json` ve `src/messages/en.json` (UI metinleri, sayfa
    kopyaları). `middleware.ts` locale algılama/yönlendirme yapar.
  - `next-intl` navigasyon yardımcıları (`Link`, `useRouter`) ile dil-farkında linkler.
  - **Dil değiştirici** Header'da; aktif locale'i koruyarak karşılık gelen sayfaya geçer.
- **Tema (koyu/açık):** `next-themes` ile `class` tabanlı; Tailwind v4 `dark:`
  varyantları. Kök layout'ta `ThemeProvider` + Header'da tema değiştirici (sistem
  tercihini de saygılar). Renk token'ları açık/koyu için `globals.css`'te tanımlı.
- **İçerik = veri:** Yapısal listeler `src/data/` altında tipli TS dosyalarında;
  iki dilli alanlar `{ tr: string; en: string }` (veya `Record<Locale, string>`)
  biçiminde tutulur. Saf UI metinleri `messages/*.json`'da, yapısal kayıtlar
  `data/`'da yaşar:
  - `company.ts` — şirket bilgisi, iletişim, sosyal, istatistikler (placeholder).
  - `services.ts` — üç iş kolu ve alt hizmetler (iki dilli).
  - `products.ts` — YangınPro, MekanikPro (özellik listeleri, slug, iki dilli).
  - `projects.ts` — projeler (başlık, müşteri, iş kolu, durum, yıl, il, kapsam, görsel).
  - `references.ts` — referans kurumlar (logo placeholder) + görüşler.
  - `faqs.ts`, `posts.ts`, `jobs.ts` — SSS, blog, kariyer kayıtları (boş-durum hazır).
  - `nav.ts` — navigasyon ve footer link yapısı (tek kaynak).
- **Tipler:** `src/types/` veya ilgili veri dosyası içinde `type`/`interface` tanımları.
- **Yeniden kullanılabilir UI** (`src/components/ui/`): `Button`, `Section`,
  `PageHeader`, `Card`, `ServiceCard`, `ProductFeature`, `Stat`, `Badge`,
  `Breadcrumb`, `Cta`, `LogoWall`, `Accordion` (SSS).
- **İş bileşenleri** (`src/components/`): `Header`, `Footer`, `Hero` ve sayfaya özel
  bölümler. Mevcut Header/Footer/Hero genişletilerek dönüştürülür.
- **Layout:** Kök `layout.tsx` Header + Footer + font/tema sağlar. Her route kendi
  `page.tsx`'iyle gelir; uzun sayfalar bölümlere ayrılmış bileşenlerden kurulur.
- **Formlar:** `ContactForm` ve `QuoteForm` client-side validasyonlu. Gönderim
  aksiyonu şimdilik TODO (sahte başarı durumu + konsol); backend/e-posta
  entegrasyonu kapsam dışı (sonraya bırakıldı — bkz. Bölüm 10).
- **SEO:** Her sayfada `generateMetadata` ile dile göre başlık/açıklama;
  `<html lang={locale}>`; Open Graph; **hreflang** alternatif dil bağlantıları;
  `sitemap.ts` (her dil için girdiler) ve `robots.ts`. Dinamik rotalar
  (`projeler/[slug]`, `blog/[slug]`) `generateStaticParams` ile her locale için
  statik üretilir.

### Dizin Yapısı (hedef)
Not: Rota dosyaları İngilizce slug yerine **Türkçe slug**'ları korur (örn.
`yazilim`, `danismanlik`); `/en` ön ekiyle bu slug'lar aynı kalır, sayfa içeriği
locale'e göre çevrilir. (Slug'ların da çevrilmesi — örn. `/en/software` —
plan aşamasında değerlendirilebilir; varsayılan: ortak slug.)

```
src/
├── middleware.ts                  (next-intl locale yönlendirme)
├── i18n/                          (next-intl config: routing, request)
├── messages/
│   ├── tr.json
│   └── en.json
├── app/
│   ├── layout.tsx                 (kök: ThemeProvider, fontlar)
│   ├── globals.css, sitemap.ts, robots.ts
│   └── [locale]/
│       ├── layout.tsx             (NextIntlClientProvider, Header, Footer)
│       ├── page.tsx               (Ana sayfa)
│       ├── not-found.tsx
│       ├── yazilim/page.tsx
│       ├── yazilim/yanginpro/page.tsx
│       ├── yazilim/mekanikpro/page.tsx
│       ├── danismanlik/page.tsx
│       ├── muhendislik/page.tsx
│       ├── projeler/page.tsx
│       ├── projeler/[slug]/page.tsx
│       ├── referanslar/page.tsx
│       ├── kurumsal/hakkimizda/page.tsx
│       ├── kurumsal/vizyon-misyon/page.tsx
│       ├── kurumsal/kalite-belgeler/page.tsx
│       ├── sss/page.tsx
│       ├── blog/page.tsx, blog/[slug]/page.tsx
│       ├── kariyer/page.tsx
│       ├── teklif/page.tsx
│       └── iletisim/page.tsx
├── components/
│   ├── ui/        (yeniden kullanılabilir temel bileşenler)
│   ├── layout/    (Header, Footer, ThemeToggle, LocaleSwitcher)
│   └── sections/  (sayfaya özel bölümler)
├── data/
└── types/
```

---

## 4. Görsel Tasarım Dili

**Yön:** Belirgin & özgün kurumsal — şablon hissinden uzak, karakterli.

- **Renk paleti (tasarım token'ları, `globals.css` `@theme`):**
  - Marka kırmızısı `#c41e3a` (primary) + ton türevleri (`-light`, `-dark`).
  - Kömür/grafit koyu `#141416` — dramatik koyu bölümler için.
  - Kor-amber vurgu `#F59E0B` — sıcak ikincil aksan (yangın teması).
  - Lacivert/güven `#1E2A3A` — danışmanlık imza tonu.
  - Açık zemin `#FAFAFA`, metin `#1A1A1A`, kül grileri.
  - **Koyu tema:** zemin grafit (`#141416`/`#0E0E10`), metin açık kül; marka
    kırmızısı ve amber koyu zeminde okunur kalacak şekilde tonlanır. Tüm renkler
    `globals.css`'te açık/koyu için CSS değişkeni olarak tanımlanır; Tailwind
    `dark:` varyantı `class` stratejisiyle çalışır.
- **Tipografi:** Başlıklar için güçlü display font (örn. **Space Grotesk** veya
  **Sora**, `next/font/google`), gövde için temiz sans (Geist/Inter). Büyük,
  kendinden emin başlık ölçeği.
- **Motif:** İnce teknik/blueprint çizgi dokusu (mühendislik kimliği); bölümlerde
  koyu/açık ritim. Her iş kolunun imza aksanı: Yazılım = kırmızı-dijital,
  Danışmanlık = lacivert-güven, Mühendislik = grafit-amber.
- **Bileşen estetiği:** Net kenarlı/az yuvarlatılmış kartlar, belirgin durum
  rozetleri, hover'da ölçülü hareket. Aşırı gradyan/gölge yerine kontrast ve düzen.
- **Erişilebilirlik & performans:** Semantik HTML, WCAG AA kontrast, klavye
  erişilebilir menü/akordeon, mobil öncelikli responsive, görseller SVG/optimize.

---

## 5. Sayfa Bazlı İçerik İskeleti

### Ana sayfa (`/`)
Hero (kurumsal vaat + birincil CTA'lar) → üç iş kolu kartı (her biri kendi sayfasına) →
güven bandı (istatistik placeholder) → öne çıkan ürün (YangınPro) → öne çıkan 3 proje +
referans logo şeridi → kısa "yaklaşımımız/süreç" → kapanış CTA (Teklif İste).

### Yazılım (`/yazilim`)
İş kolu tanıtımı (fikri mülkiyet, Ar-Ge, pazarlama) → ürün ailesi gridi
(YangınPro, MekanikPro) → ortak değer önerisi → CTA.

### Ürün sayfaları (`/yazilim/yanginpro`, `/yazilim/mekanikpro`)
Ürün hero + arayüz mockup → özellik gridi → "kimler için" → (varsa) modül/akış →
demo/CTA. İçerik `products.ts`'ten gelir; iki sayfa aynı şablonu paylaşır.

### Danışmanlık (`/danismanlik`)
İtfaiye onay süreci, yönetmeliğe uygunluk, projelendirme → kimlere hitap eder
(müteahhit / mal sahibi / kurum) → adım adım süreç → ilgili SSS özetleri → CTA.

### Mühendislik & Uygulama (`/muhendislik`)
Alt başlıklar: aktif söndürme sistemleri, pasif önleme sistemleri, saha uygulama &
taahhüt, sıhhi & kalorifer (mekanik) tesisat, periyodik bakım → süreç → CTA.

### Projeler (`/projeler`) ve detay (`/projeler/[slug]`)
Liste: iş koluna ve duruma (Devam Eden / Tamamlandı) göre **filtrelenebilir** kart
gridi. Detay: proje künyesi (müşteri, iş kolu, durum, yıl, il, kapsam), açıklama,
görsel galeri (placeholder), ilgili hizmete bağlantı.

### Referanslar (`/referanslar`)
Referans kurum logo duvarı (placeholder) + müşteri görüşleri (testimonial).

### Kurumsal
- **Hakkımızda:** şirket hikayesi, üç ayağın bütünlüğü, ekip/değer vurgusu.
- **Vizyon & Misyon:** vizyon, misyon ve temel değerler.
- **Kalite & Belgeler:** TSE vb. belgeler ve kalite yaklaşımı (placeholder).

### SSS (`/sss`)
Kategorize akordeon (danışmanlık, yazılım, mühendislik). `faqs.ts`'ten beslenir.

### Blog / Haberler (`/blog`, `/blog/[slug]`)
Yazı listesi + detay. `posts.ts` boş-durum hazır (yazı yoksa zarif boş durum).

### Kariyer (`/kariyer`)
Açık pozisyonlar listesi + genel başvuru çağrısı. `jobs.ts` boş-durum hazır.

### Teklif İste (`/teklif`)
Yapılandırılmış form: iş kolu seçimi, proje/hizmet tipi, bina/proje bilgisi (m², il),
ad-soyad, kurum, telefon, e-posta, mesaj, (opsiyonel) dosya alanı placeholder.
Client-side validasyon; gönderim TODO.

### İletişim (`/iletisim`)
Genel iletişim formu + placeholder iletişim bilgileri + harita placeholder +
çalışma saatleri.

---

## 6. Veri Modelleri (özet)

```ts
type IsKolu = 'yazilim' | 'danismanlik' | 'muhendislik';
type ProjeDurumu = 'devam-eden' | 'tamamlandi';

interface Proje {
  slug: string; baslik: string; musteri: string; isKolu: IsKolu;
  durum: ProjeDurumu; yil: number; il: string; kapsam: string;
  ozet: string; aciklama: string; gorseller: string[]; oneCikan?: boolean;
}

interface Urun {
  slug: 'yanginpro' | 'mekanikpro'; ad: string; sloganTr: string;
  aciklama: string; ozellikler: { baslik: string; aciklama: string }[];
  hedefKitle: string[];
}

interface Hizmet { baslik: string; aciklama: string; altHizmetler?: string[]; }
interface Referans { ad: string; logo: string; gorus?: { metin: string; kisi: string } }
interface SSS { kategori: IsKolu | 'genel'; soru: string; cevap: string; }
interface Yazi { slug: string; baslik: string; tarih: string; ozet: string; icerik: string; }
interface Pozisyon { baslik: string; lokasyon: string; tip: string; aciklama: string; }
```

Placeholder veriler gerçekçi ama açıkça örnek olacak; `ICERIK-TODO.md` neyin
güncelleneceğini listeler.

---

## 7. Hata Yönetimi ve Kenar Durumlar

- **404:** Özel `not-found.tsx` (marka uyumlu).
- **Boş durumlar:** Blog/Kariyer/Projeler veri yokken zarif boş durum mesajı.
- **Form validasyonu:** Zorunlu alanlar, e-posta/telefon format kontrolü, hata
  mesajları; gönderimde sahte başarı durumu (backend TODO).
- **Geçersiz dinamik slug:** `projeler/[slug]` ve `blog/[slug]` bilinmeyen slug'da
  `notFound()`.

---

## 8. Doğrulama / Test Yaklaşımı

- `npm run build` ve `npm run lint` temiz geçmeli (TypeScript tip kontrolü dahil).
- Tüm rotalar derlenmeli; dinamik rotalar `generateStaticParams` ile üretilmeli.
- Manuel kontrol: navigasyon linkleri, mobil menü, form validasyonu, responsive
  kırılımlar, 404.
- (Opsiyonel, plan aşamasında karar) Form mantığı için birim testleri.

---

## 9. Teslimatlar

- Çalışan, derlenebilir çok sayfalı site (yukarıdaki tüm rotalar).
- Tipli içerik veri katmanı (`src/data/`).
- Yeniden kullanılabilir UI bileşen kütüphanesi.
- Kök dizinde `ICERIK-TODO.md` — doldurulacak gerçek bilgiler listesi
  (iletişim, vergi/ticaret bilgileri, gerçek referanslar/logolar, proje görselleri,
  ürün ekran görüntüleri, kalite belgeleri).

---

## 10. Kapsam Dışı (Sonraya Bırakılan)

- **Backend / form e-posta gönderimi** — sonraki adımda Server Action / Resend.
  Formlar şimdilik client-side validasyonlu, gönderim TODO.
- **CMS entegrasyonu** — içerik şimdilik kod içi veri (`data/` + `messages/`).

## 11. Kapsam Dışı (Kalıcı — Gerekmiyor)

- Online ödeme.
- Müşteri paneli / portal.
- Kimlik doğrulama / üyelik / giriş.

Bu üç madde projede **hiç** ele alınmayacak.
