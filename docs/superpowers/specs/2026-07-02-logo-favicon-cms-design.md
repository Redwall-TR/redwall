# CMS'ten Logo & Favicon — Tasarım

**Tarih:** 2026-07-02 · **Durum:** Onaylandı (kullanıcı), uygulanacak

## Amaç
Navbar logosu, footer logosu ve favicon'u `/admin`'den (Payload) yüklenebilir/
değiştirilebilir hale getirmek. Hepsi tema-duyarlı (açık/koyu) ve mevcut statik
dosyalara graceful fallback'li — CMS boşken site bugünkü haliyle çalışır.

## Onaylanan kararlar
- `siteSettings` global'ine 5 opsiyonel `upload` alanı (`relationTo: 'media'`):
  `navbarLogoAcik`, `navbarLogoKoyu`, `footerLogoAcik`, `footerLogoKoyu`, `favicon`.
- Navbar + footer logoları **tema-duyarlı** render (açık temada "açık" logo, koyu
  temada "koyu" logo — mevcut `dark:hidden` / `hidden dark:block` deseni).
- Her logo: CMS'te varsa CMS, yoksa mevcut statik SVG (fallback).
- Favicon: kök layout `metadata.icons` → CMS favicon URL'i, yoksa statik fallback.
- Alanlar yeni + opsiyonel → migration yalnızca şema (nullable FK), **veri taşıma yok**.

## Mevcut durum
- `src/globals/SiteSettings.ts` — Payload global; `getSiteSettings()` adaptörü (`src/lib/cms/queries.ts:486`).
- Header (`src/components/layout/Header.tsx`): statik `/redwall-logo-light.svg` (açık) + `/redwall-logo-dark.svg` (koyu), `dark:hidden` / `hidden dark:block` ile.
- Footer (`src/components/layout/Footer.tsx`): tek statik `/redwall-logo-footer-dark.svg`.
- Favicon: `src/app/favicon.ico` (Next statik convention).
- Header/Footer `layout.tsx`'ten prop alır (`src/app/(site)/[locale]/layout.tsx` → `<Header locale=... />`, `<Footer locale=... />`).

## Şema değişikliği

### `src/globals/SiteSettings.ts`
Yeni `group` alanı `marka` (veya alanları düz ekle) — 5 upload:
```
{ name: 'navbarLogoAcik', type: 'upload', relationTo: 'media', label: 'Navbar logosu (açık tema)' }
{ name: 'navbarLogoKoyu', type: 'upload', relationTo: 'media', label: 'Navbar logosu (koyu tema)' }
{ name: 'footerLogoAcik', type: 'upload', relationTo: 'media', label: 'Footer logosu (açık tema)' }
{ name: 'footerLogoKoyu', type: 'upload', relationTo: 'media', label: 'Footer logosu (koyu tema)' }
{ name: 'favicon', type: 'upload', relationTo: 'media', label: 'Favicon (PNG/SVG)' }
```
Hepsi opsiyonel (required yok), localize DEĞİL.

## Adaptör (`getSiteSettings`)
Dönüşe logo URL'leri eklenir (mevcut `mediaUrl` ile):
```
logolar: {
  navbarAcik: mediaUrl(navbarLogoAcik) ?? null,
  navbarKoyu: mediaUrl(navbarLogoKoyu) ?? null,
  footerAcik: mediaUrl(footerLogoAcik) ?? null,
  footerKoyu: mediaUrl(footerLogoKoyu) ?? null,
  favicon:    mediaUrl(favicon) ?? null,
}
```
`safe()` sarmalı korunur.

## Render

### Layout (`src/app/(site)/[locale]/layout.tsx`)
`getSiteSettings()` çekilir; logo URL'leri Header ve Footer'a prop olarak geçer.
(Header/Footer 'use client' — veriyi sunucu layout'undan prop ile alır.)

### Header
`navbarLogoAcik` prop varsa açık-tema `<Image>` `src`'i o, yoksa `/redwall-logo-light.svg`.
`navbarLogoKoyu` prop varsa koyu-tema `<Image>` `src`'i o, yoksa `/redwall-logo-dark.svg`.
Mevcut `dark:hidden` / `hidden dark:block` ve boyutlar korunur. (Next `<Image>` uzak
`/api/media` URL'lerini zaten kullanıyor — remotePatterns/aynı origin.)

### Footer
İki logo (`footerLogoAcik`/`footerLogoKoyu`) tema-duyarlı render edilir (Header
desenine paralel). CMS boşsa fallback: açık→(mevcut varsa uygun statik), koyu→
`/redwall-logo-footer-dark.svg`. Footer tek logo kullandığından: açık statik yoksa
koyu statik fallback kullanılır (kırık görsel olmaz).

### Favicon (kök layout)
Kök layout `metadata` (veya `generateMetadata`) `icons` alanını `siteSettings.favicon`
URL'inden üretir; yoksa statik `/favicon.ico` fallback. Mevcut `src/app/favicon.ico`
statik fallback olarak korunur (gerekirse `public/`'e taşınır ve metadata fallback'i
ona işaret eder). Kesin mekanizma planda kök layout incelenerek netleştirilir.

## Migration
`siteSettings` global tablosuna 5 nullable FK sütunu (`*_id` → media). Payload
`migrate:create` ile üretilir; **backfill yok** (alanlar opsiyonel). Migration yalnızca
şema; hızlı, ayrı-bağlantı/deadlock riski yok (raw DDL, geçmiş dersler geçerli değil).

## Fallback / hata yönetimi
- Tüm alanlar opsiyonel; CMS boşsa mevcut statik logolar/favicon aynen kullanılır.
- `getSiteSettings` `safe()` ile sarılı → DB hatasında da site statik logolarla ayakta.
- `mediaUrl` null dönerse fallback devreye girer (Header/Footer/metadata).

## Test
- **Unit:** `getSiteSettings` logo URL alanlarını döndürüyor (mediaUrl uygulanmış);
  logo-seçim yardımcısı (`cmsUrl ?? staticFallback`) saf fonksiyona çıkarılırsa test edilir.
- **Doğrulama:** build/lint/test yeşil; preview'da `/admin` → siteSettings'ten logo/
  favicon yükle → navbar/footer/favicon değişir; CMS boşken statik logolar görünür (TR+EN,
  açık+koyu tema).

## Kapsam dışı (YAGNI)
- Farklı favicon boyutları/apple-touch-icon setleri (tek upload yeterli; browser PNG/SVG kabul eder).
- Logo için ayrı bir koleksiyon (global yeterli).
- OG/paylaşım görseli (ayrı iş).
