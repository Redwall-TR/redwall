# SEO: Yapısal Veri (JSON-LD) + Sitemap + OG — Tasarım

**Tarih:** 2026-07-05 · **Durum:** Kullanıcı tasarımı onayladı ("başla ve uygula")

## Amaç
Google'da rich snippet (SSS açılır kutuları, makale kartları, Organization knowledge
panel, breadcrumb) kazanmak + sosyal paylaşımlara önizleme görseli eklemek. Tümü mevcut
CMS verisinden türer — ekstra içerik yok. Bu, "bekleyen öneriler" yol haritasının 1.
alt-projesi (SEO); analytics/gözlemlenebilirlik/yedek-provası ayrı döngülerde gelecek.

## Kapsam
- **Web kodu**, infra bağımlılığı YOK. Şema/CMS değişmez, migration YOK.

## Mevcut durum (doğrulandı)
- `src/lib/metadata.ts` `buildMetadata` merkezi: title/description/canonical/hreflang/OG var
  ama **OG görseli YOK** ve blog dahil her yerde `openGraph.type: 'website'`.
- `getSiteSettings()` döndürüyor: `sirketAdi`, `iletisim`, `sosyal`, `calismaSaatleri`,
  `kunye` (mersisNo/ticaretSicilNo/kepAdresi), `marka` (logolar) — Organization/LocalBusiness için zengin.
- `getFaqs()` → `{kategori, soru, cevap}` (soru text, cevap **richText/Lexical**, locale-keyed).
- `sitemap.ts` projeler + blog'u kapsıyor ama `referanslar/[slug]` detaylarını KAPSAMIYOR.
- **Lexical→düz metin çıkarıcı YOK** (FAQ cevabını FAQPage `acceptedAnswer.text`'e çevirmek için gerekli).

## Bileşenler (her biri tek sorumlu, saf/test edilebilir)

### 1. `src/lib/lexicalToPlainText.ts` (YENİ, saf, test edilebilir)
`lexicalToPlainText(value: unknown): string` — Lexical state (veya düz string) → düz metin.
Root children'ı özyinelemeli gezer, `text` düğümlerini birleştirir, paragraf aralarına boşluk
koyar; null/boş → `''`. FAQPage cevabı ve gerekirse Article açıklaması için. (`normalizeToLexical`
mevcut; bu onun ürettiği yapıdan metin çeker.)

### 2. `src/lib/jsonLd.ts` (YENİ, saf builder'lar, test edilebilir)
JSON-LD düz objeleri döndüren fonksiyonlar (React'a bağımlı değil):
- `organizationJsonLd(settings, siteUrl)` → `@type: Organization` — `name`(sirketAdi),
  `url`, `logo`, `contactPoint`(iletişim: telefon/email), `sameAs`(sosyal linkler dizisi),
  `address`(varsa). Boş alanlar atlanır.
- `websiteJsonLd(siteUrl)` → `@type: WebSite` (name, url, inLanguage).
- `articleJsonLd({baslik, aciklama, tarih, gorselUrl, url, yazar?})` → `@type: Article`
  (headline, description, datePublished, image, mainEntityOfPage).
- `softwareAppJsonLd({ad, aciklama, url, kategori?})` → `@type: SoftwareApplication`
  (name, description, applicationCategory, operatingSystem: 'Web').
- `faqPageJsonLd(items: {soru, cevap}[])` → `@type: FAQPage`, `mainEntity: Question[]`
  (`acceptedAnswer.text` = `lexicalToPlainText(cevap)`). Boş soru/cevap atlanır.
- `breadcrumbJsonLd(items: {ad, url}[])` → `@type: BreadcrumbList`.
Hepsi `@context: 'https://schema.org'` içerir. Girdi locale'e göre önceden `pick`'lenmiş
(düz) değerlerle çağrılır (sayfa zaten `pick`/`safe` kullanıyor).

### 3. `src/components/seo/JsonLd.tsx` (YENİ)
`<JsonLd data={obj} />` → `<script type="application/ld+json" dangerouslySetInnerHTML={{__html: safeJson}} />`.
**Güvenlik:** `safeJson = JSON.stringify(data).replace(/</g, '\\u003c')` — `<` kaçışı script-breakout/XSS'i
engeller. Bu, kod tabanındaki TEK `dangerouslySetInnerHTML`; kabul edilebilir çünkü içerik sunucu-üretimi
JSON, kullanıcı girdisi değil (girdi de zaten kaçışlı). Not olarak yorumda gerekçe yazılır.

### 4. Sayfalara bağlama
- **Kök layout** (`src/app/(site)/[locale]/layout.tsx` veya uygun ortak nokta): `organizationJsonLd` +
  `websiteJsonLd` (site geneli, `getSiteSettings`'ten).
- **Blog detay** (`blog/[slug]`): `articleJsonLd` + `breadcrumbJsonLd`.
- **Ürün detay** (`yazilim/[urun]`): `softwareAppJsonLd` + `breadcrumbJsonLd`.
- **SSS** (`sss`): `faqPageJsonLd(getFaqs())`.
- **Proje detay** (`projeler/[slug]`): `breadcrumbJsonLd` (+ opsiyonel Article).
Her sayfa ilgili `<JsonLd>`'yi render eder (server component; ek istemci JS yok).

### 5. OG görseli + article type (`metadata.ts`)
- `buildMetadata`'ya opsiyonel `gorselUrl?` + `type?: 'website'|'article'` parametreleri;
  `openGraph.images` (verilmişse o, yoksa site varsayılan OG görseli — `public/og-default.*` veya marka logosu)
  ve `openGraph.type`. Blog `generateMetadata`'sı `type:'article'` + kapak görseli geçer.
- Varsayılan OG görseli `public/`'e eklenir (marka görseli; yoksa mevcut logo kullanılır).

### 6. Sitemap (`sitemap.ts`)
`getReferences()` eklenir; `referanslar/[slug]` detayları locale başına sitemap'e girer
(projeler/blog ile aynı desen).

## Test
- **Birim (TDD):** `lexicalToPlainText` (paragraf/boş/string/iç içe → doğru düz metin);
  `jsonLd` builder'ları (her tip doğru `@type` + zorunlu alanlar; boş alan atlanır; FAQ boş item elenir).
- **Build:** `npx tsc --noEmit && npm run lint && npm run build` (0 error).
- **Preview:** ilgili sayfalarda view-source → `<script type="application/ld+json">` mevcut + geçerli JSON;
  blog OG `type:article` + image.
- **Deploy sonrası:** Google Rich Results Test (manuel) ile 2-3 URL doğrulanır.

## Hata yönetimi
- Builder'lar eksik/null alanda o alanı atlar (kırık schema yerine kısmi geçerli schema).
- `getSiteSettings`/`getFaqs` `safe()` ile sarılı; null dönerse layout/sss JsonLd'yi render etmez.
- `JsonLd` `data` boşsa hiçbir şey basmaz.

## Kapsam dışı (YAGNI)
- Review/AggregateRating (gerçek yorum verisi yok), Event, VideoObject, JobPosting (kariyer sonra).
- Dinamik OG görsel üretimi (`@vercel/og`) — statik varsayılan + kapak görseli yeter.
- Arama kutusu SearchAction (site içi arama yok).
