# Redwall — İçerik Doldurma Rehberi

Redwall kurumsal web sitesini tam olarak yayınlamak ve gerçek içerikle doldurabilmek için bu adım adım rehberi takip edin.

---

## 1. Sanity Projesi Oluşturma

### 1.1 Yeni bir Sanity projesi aç
- **sanity.io** adresine git ve hesap oluştur (Google veya e-posta ile)
- Yeni bir ücretsiz proje oluştur
- Proje adı: `Redwall` (veya benzeri)
- Dataset tipi: `Production` (varsayılan)

### 1.2 Gerekli kimlik bilgilerini al
Sanity projesi oluşturduktan sonra, proje ayarlarından:
- **Project ID** (proje kimliği) — not et
- **API Version** — zaten `2024-10-01` olmalı
- Dataset name — varsayılan olarak `production`

### 1.3 Sanity CLI ile oturum aç
```bash
npx sanity login
```
Tarayıcıda Sanity hesabınızla oturum açın.

---

## 2. Ortam Değişkenlerini Ayarla

### 2.1 `.env.local` dosyası oluştur
Proje kökünde `.env.local.example` dosyasını baz alarak `.env.local` oluştur:

```bash
cp .env.local.example .env.local
```

### 2.2 Değişkenleri doldur
`.env.local` dosyasını düzenle:

```env
# Sanity projesi kimlik bilgileri
NEXT_PUBLIC_SANITY_PROJECT_ID=YOUR_PROJECT_ID_HERE
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-10-01

# Site URL'i (gerçek domain adı ile değiştir)
NEXT_PUBLIC_SITE_URL=https://redwall.com.tr
```

**Değiştirmen gerekenler:**
- `YOUR_PROJECT_ID_HERE` → Sanity projesiyle alınan Project ID
- `https://redwall.com.tr` → Gerçek kurumsal domain adın

### 2.3 `.env.local` dosyasını git'e ekleme
`.env.local` dosyası `.gitignore`'da olmalı (eklemi olmaz). Lokal geliştirmede sadece senin makınında kalır.

---

## 3. Seed İçeriğini İçe Aktar

### 3.1 Sanity dataset import komutunu çalıştır
Proje kökünden (redwall dizininden):

```bash
npx sanity dataset import sanity/seed/redwall-seed.ndjson production
```

Bu komut, `sanity/seed/redwall-seed.ndjson` dosyasındaki taslak içeriği (sayfalar, hizmetler, ürünler, projeler, referanslar, SSS, blog yazıları, kariyer ilanları) Sanity'e yükler.

### 3.2 Detaylı bilgi
- Yüklü içerik özeti için bkz: **scripts/seed-readme.md**
- Seed dosyasında `_id`'ye sahip mevcut dökümanlar otomatik olarak güncellenir
- Görseller seed dosyasında yer almaz — bir sonraki adımda Studio'dan yükle

### 3.3 İçeriği doğrula
Geliştirme sunucusunu başlat:

```bash
npm run dev
```

Tarayıcıda `/studio` adresine git ve içeriklerin yüklendiğini doğrula:
- http://localhost:3000/studio (veya `/tr/studio`)

---

## 4. Doldurulacak Gerçek Bilgiler Kontrol Listesi

Seed dosyasındaki taslak verileri, kurumsal gerçek bilgilerle değiştir. Studio (/studio) arayüzünden düzenle:

### İletişim ve Kurum Bilgileri
- [ ] **Kurumsal E-mail** — `info@redwall.com.tr` yerine gerçek e-mail adresi
- [ ] **Telefon Numarası** — `+90 (XXX)...` yerine gerçek telefon
- [ ] **Ofis Adresi** — gerçek şirket adresi
- [ ] **Sosyal Medya Linkleri** — LinkedIn, Instagram, Twitter vb.

### Yasal ve Ticari Bilgiler
- [ ] **Vergi Numarası** — gerçek vergi kimlik numarası
- [ ] **Ticaret Sicil Numarası** — şirket ticaret sicil numarası
- [ ] **Hakkımızda Sayfası** — `kurumsal/hakkimizda` — gerçek kurumsal tarih ve bilgiler
- [ ] **Vizyon Misyon Sayfası** — `kurumsal/vizyon-misyon` — gerçek vizyon ve misyon
- [ ] **Kalite Belgeler Sayfası** — `kurumsal/kalite-belgeler` — TSE, ISO vb. sertifikalar

### Görseller (Studio'dan Yükle)

Aşağıdaki görseller seed'de yer almaz. Her biri için Studio'da ilgili dökümanı açıp "Yükle" butonuyla ekle:

| Doküman Tipi  | Alan                      | Açıklama                                   |
|---------------|---------------------------|--------------------------------------------|
| `siteSettings`| `logo`                    | Kurumsal logo (PNG/SVG, 200x200 px)       |
| `reference`   | `logo` (her referans için) | Referans şirket logoları                   |
| `product`     | `ekranGorselleri`         | YangınPro ve MekanikPro arayüz ekran görüntüleri |
| `project`     | `gorseller` (galeri)      | Proje saha fotoğrafları, render görselleri |
| `post`        | `kapak`                   | Blog yazıları için kapak görselleri       |

### Referans Şirketler
- [ ] **Logo Yükleme** — Her referansta logo ekle
- [ ] **Şirket Adı ve Açıklaması** — Gerçek referans kurumlar
- [ ] **Görüş/Testimonial** — Müşteri memnuniyet yorumları (varsa)

### Ürünler
- [ ] **YangınPro** — Ürün açıklaması, fiyatlandırma, ekran görüntüleri
- [ ] **MekanikPro** — Ürün açıklaması, fiyatlandırma, ekran görüntüleri

### Projeler
- [ ] **Proje Başlıkları ve Açıklamaları** — Tamamlanan projeler
- [ ] **Proje Görselleri** — Saha fotoğrafları, sonuç görselleri
- [ ] **Teknolojiler ve Özellikleri** — Kullanılan teknolojiler, proje detayları

### Blog Yazıları
- [ ] **Blog Başlıkları** — Teknik makaleler, haber, bilgilendirici yazılar
- [ ] **İçerik** — Yazı metni (Portable Text formatında)
- [ ] **Kapak Görseli** — Her yazı için kapak resmi
- [ ] **Yayınlama Tarihi** — Makalenin yayınlandığı tarih

### Kariyer / İş İlanları
- [ ] **Pozisyon Başlıkları** — Yazılım Geliştirici, Yangın Mühendisi vb.
- [ ] **İş Açıklaması** — Görev, sorumluluklar, gereksinimler
- [ ] **Başvuru Yöntemi** — İnsan Kaynakları e-mail veya form
- [ ] **Çalışma Türü** — Tam zamanlı, proje bazlı vb.

### Sık Sorulan Sorular (SSS)
- [ ] **Kategorize edilmiş SSS** — Genel, yazılım, danışmanlık, mühendislik
- [ ] **Sorular ve Cevapları** — Gerçek müşteri sorularına dayalı

---

## 5. Formlar — Bilinen Sınırlamalar

Kontakt formu ve teklif formu UI olarak web sitesinde mevcut ama:

- **Arka uç (backend) henüz kurulu değil** — formlar şu an **konsola yazılıyor**, e-posta göndermiyor
- **Bir sonraki aşamada** bir e-posta servisi (Resend, SendGrid, AWS SES vb.) veya Server Actions bağlanacak
- **Geçici çözüm:** İletişim formundan gelen veriler Sanity CMS üzerinden veya başka bir sistem aracılığıyla takip edilebilir

---

## 6. Geliştirme Ortamında Test

### 6.1 Development sunucusunu başlat
```bash
npm install --legacy-peer-deps
npm run dev
```

`--legacy-peer-deps` bayrağı gerekli olabilir, çünkü bağımlılık ağacında uyuşmazlıklar var.

### 6.2 Siteyi incele
- http://localhost:3000 — Türkçe sayfalar (varsayılan)
- http://localhost:3000/en — İngilizce sayfalar
- http://localhost:3000/tr/studio — Sanity Studio (editör)

### 6.3 İçeriği Studio'da düzenle
- `/tr/studio` adresinde Sanity Studio'yu aç
- Her dokümanı editör arayüzüyle düzenle
- Görselleri yükle, metinleri güncelle
- **Yayınla** butonuyla değişiklikleri Sanity'e kaydet

---

## 7. Sitemap ve SEO Hazırlığı

### 7.1 Sitemap Üretimi
- Sitemap otomatik olarak `/sitemap.xml` adresinde üretilir
- Robots.txt da `/robots.txt` adresinde bulunur
- `NEXT_PUBLIC_SITE_URL` ortam değişkeniyle konfigüre edilir

### 7.2 Meta Veriler
- Her sayfada başlık (title), açıklama (description) ve Open Graph metaları vardır
- Çok dilli (i18n) desteğiyle her dil için farklı URL'ler üretilir

---

## 8. Build ve Deployment Hazırlığı

### 8.1 Build test et
```bash
npm run build
```

Derleme başarısız olursa konsolu kontrol et.

### 8.2 Linting kontrol et
```bash
npm run lint
```

### 8.3 Test et (varsa)
```bash
npm run test
```

---

## 9. Yayınlama Ortamında Deployment

Sitemi bir hosting platformuna deploy et (Vercel, Netlify, kendi sunucun, vb.):

1. **Git deposu bağla** — GitHub/GitLab repo'unu hosting platformu ile
2. **Ortam değişkenlerini ayarla** — Production ortamında `.env` değişkenlerini gir
3. **Build ve yayınla** — Hosting platformu otomatik olarak derler ve yayınlar
4. **Domain bağla** — Gerçek domain adını ayarla
5. **SSL/TLS etkinleştir** — HTTPS zorunlu

---

## 10. Sonraki Adımlar

### İyileştirmeler ve Eklemeler
- [ ] E-posta formu entegrasyonu (Resend, SendGrid, vb.)
- [ ] Analitik kurulumu (Google Analytics, Plausible vb.)
- [ ] İçerik yönetimi otomasyonu (CDN, caching stratejisi)
- [ ] Performans optimizasyonu (image optimization, lazy loading)
- [ ] SEO optimizasyonu (structured data, rich snippets)

### Destek Kaynakları
- **Sanity Docs**: https://www.sanity.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **next-intl Docs**: https://next-intl-docs.vercel.app/
- **next-themes**: https://github.com/pacocoursey/next-themes

---

## Sorun Giderme

### "Not authorized" hatası (Sanity giriş)
```bash
npx sanity logout
npx sanity login
```

### "Dataset not found" hatası
```bash
npx sanity dataset list
```

Mevcut veri setlerini görüntüle ve doğru adı kullan.

### Bağımlılık sorunları
```bash
npm install --legacy-peer-deps
```

### Studio açılmıyor
- `/tr/studio` veya `/en/studio` deneyin
- Development sunucusunun çalıştığından emin ol (`npm run dev`)
- Sanity projesi kimlik bilgilerini doğrula

---

## Notlar

- Tüm metin alanları **Türkçe ve İngilizce** için çeviriler yapılmalı
- Görseller **en az 1200x630 px** boyutunda olmalı (sosyal medya paylaşımı için)
- Tüm güvenlik bilgileri (vergi numarası, sicil numarası vb.) dikkatli bir şekilde gir
- Geliştirme sırasında önemli dökümanları **backup** al

---

**Sorular veya sorunlar?** Teknik destek için proje dokumentasyonuna ve Sanity/Next.js resmi kaynaklarına başvur.
