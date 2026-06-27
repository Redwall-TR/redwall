# Redwall — Kurumsal Web Sitesi

Redwall, modern web teknolojileriyle geliştirilmiş bir kurumsal web sitesi. Türkçe ve İngilizce çok dil desteği, karanlık/açık tema, ve entegre CMS ile tam yönetim imkanı sunar.

## Teknoloji Yığını

- **Next.js 16** — React 19 ile modern SSR ve SSG
- **Tailwind CSS v4** — Responsive tasarım ve tema sistemi
- **Sanity CMS** — İçerik yönetim sistemi, embedded Studio at `/studio`
- **next-intl** — Çok dil desteği (Türkçe/İngilizce, /tr /en)
- **next-themes** — Açık/Karanlık tema desteği
- **TypeScript** — Tür güvenliği
- **Vitest** — Test çatısı

## Başlangıç

### 1. Gereksinimler
- Node.js 18+
- npm veya pnpm

### 2. Bağımlılıkları yükle
```bash
npm install --legacy-peer-deps
```
Eğer bağımlılık uyumsuzluğu hatası alırsan `--legacy-peer-deps` bayrağını kullan.

### 3. Ortam değişkenlerini ayarla
`.env.local.example` dosyasından `.env.local` oluştur ve doldur:

```bash
cp .env.local.example .env.local
```

Gerekli değişkenler:
- `NEXT_PUBLIC_SANITY_PROJECT_ID` — Sanity projesi ID'si
- `NEXT_PUBLIC_SANITY_DATASET` — `production` (varsayılan)
- `NEXT_PUBLIC_SANITY_API_VERSION` — `2024-10-01` (varsayılan)
- `NEXT_PUBLIC_SITE_URL` — Site URL'i (örn. https://redwall.com.tr)

Detaylı kurulum için bkz: [ICERIK-TODO.md](./ICERIK-TODO.md)

### 4. Geliştirme sunucusunu başlat
```bash
npm run dev
```
Tarayıcıda http://localhost:3000 adresini aç.

## Ana Özellikler

- **Sanity CMS Entegrasyonu** — `/studio` adresinde embedded editor
- **Çok Dilli Desteği** — `/tr` ve `/en` URL'leriyle Türkçe/İngilizce
- **Tema Sistemi** — Açık (light) ve karanlık (dark) modlar
- **SEO Hazır** — Sitemap, robots.txt, meta veriler
- **Responsive Tasarım** — Mobile-first yaklaşım
- **Taşınabilir Text (Portable Text)** — Rich text editörü Sanity'de

## Proje Yapısı

```
redwall/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React bileşenleri
│   ├── lib/              # Yardımcı fonksiyonlar
│   ├── sanity/           # Sanity client, queries
│   └── i18n/             # next-intl yapılandırması
├── sanity/
│   ├── schemaTypes/      # Sanity şema tanımları
│   └── seed/             # Seed verileri (redwall-seed.ndjson)
├── scripts/
│   └── seed-readme.md    # Seed import rehberi
├── .env.local.example    # Ortam değişkenleri şablonu
└── ICERIK-TODO.md        # İçerik doldurma rehberi
```

## Komutlar

```bash
# Geliştirme sunucusu
npm run dev

# Production build
npm run build

# Production sunucusu çalıştır
npm start

# Linting
npm run lint

# Testler (Vitest)
npm run test
npm run test:watch       # Watch modunda testler
```

## Sanity CMS

### İçeriği Yönet
Development modunda Sanity Studio'ya `/studio` adresinden eriş:

```bash
npm run dev
# http://localhost:3000/studio
```

### Seed Verileri İçe Aktar
```bash
npx sanity dataset import sanity/seed/redwall-seed.ndjson production
```

Detaylar için: [scripts/seed-readme.md](./scripts/seed-readme.md)

## İçerik Doldurma

Sitemi tam olarak aktifleştirmek için [ICERIK-TODO.md](./ICERIK-TODO.md) rehberine başvur:
- Sanity projesi oluşturma
- Ortam değişkenlerini ayarlama
- Seed verileri yükleme
- Gerçek içeriği doldurmak için kontrol listesi
- Form entegrasyonu ve sonraki adımlar

## Çok Dil Desteği (i18n)

Sitede Türkçe ve İngilizce desteklenir:
- `/tr/...` — Türkçe sayfalar
- `/en/...` — İngilizce sayfalar
- `/` — Varsayılan dil (Türkçe)

next-intl yapılandırması `src/i18n/` dizininde.

## Tema Sistemi

Açık ve karanlık temalar `next-themes` ile yönetilir. Kullanıcı tercihine göre otomatik geçiş yapılır.

## Build ve Deployment

Production build'i oluştur:

```bash
npm run build
npm start
```

Site statik ve dinamik sayfalara sahip olup NEXT_PUBLIC_SITE_URL ortam değişkeniyle konfigüre edilir.

**Deployment Platformları:** Vercel, Netlify, Docker, kendi sunucun vb.

## Kaynaklar

- [Next.js Dokümantasyonu](https://nextjs.org/docs)
- [Sanity CMS](https://www.sanity.io/docs)
- [next-intl](https://next-intl-docs.vercel.app/)
- [next-themes](https://github.com/pacocoursey/next-themes)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Lisans

MIT

---

**Daha Fazla Bilgi:** [ICERIK-TODO.md](./ICERIK-TODO.md) · [scripts/seed-readme.md](./scripts/seed-readme.md) · [.superpowers/sdd/](./sdd/)
