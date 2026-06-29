# Faz A — Yasal Uyum Sayfaları (Uygulama Planı)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Adımlar checkbox (`- [ ]`). Bu, eksik-sayfalar spec'inin (`../specs/2026-06-29-redwall-eksik-kurumsal-sayfalar-design.md`) **Faz A**'sıdır. Sonra Faz C, Faz D gelir; deploy hepsi bitince.

**Goal:** Yasal uyum sayfalarını (KVKK Aydınlatma, Gizlilik, Çerez Politikası, Kullanım Koşulları + KVKK Başvuru Formu), künyeyi ve çerez onay bandını Payload-backed olarak kurmak.

**Architecture:** Yeni `richPage` Payload koleksiyonu (genel prose) + adaptör; yasal sayfalar `/(site)/[locale]/yasal/[slug]` (force-dynamic, Lexical render). siteSettings künye alanlarıyla genişletilir. Çerez bandı client component. Footer'a yasal linkler.

**Tech Stack:** Payload 3.85, Next 16.2.9, `@payloadcms/richtext-lexical/react` (RichText), cms adaptör katmanı (`src/lib/cms`), dev Postgres 5433 + MinIO.

## Global Constraints
- **Hepsi Payload** (admin'den düzenlenebilir). Yeni içerik rotaları `export const dynamic = 'force-dynamic'` (Payload Local API headers() okur → statik üretim DYNAMIC_SERVER_USAGE verir).
- i18n: adaptör `locale:'all'` → `{tr,en}`; bileşenler `pick()` kullanır. Boş-dayanıklı `safe()`.
- Lexical render: `import { RichText } from '@payloadcms/richtext-lexical/react'`, `<RichText data={pick(icerik, locale)} />` (blog/[slug] deseni).
- Yasal metinler **taslaktır** → her sayfada üstte uyarı bandı + içerikte `[DOLDURULACAK: ...]` placeholder.
- Form e-posta gönderimi YOK (Resend ayrı iş) — mevcut form deseni (client validasyon + başarı durumu).
- Migration dosyaları (`npx payload migrate:create`), dev DB'ye uygulanır.
- Görseller next/image; aynı-origin `/api/media`.

---

## Dosya Yapısı
| Dosya | Sorumluluk |
|---|---|
| `src/collections/RichPage.ts` | Genel prose koleksiyonu (slug, baslik, icerik, kategori, sonGuncelleme) |
| `payload.config.ts` (mod.) | RichPage koleksiyonu + siteSettings künye alanları |
| `src/globals/SiteSettings.ts` (mod.) | mersisNo, ticaretSicilNo, kepAdresi |
| `src/lib/cms/queries.ts` (mod.) | `getRichPage(slug)`, `getRichPagesByCategory(cat)` |
| `src/app/(site)/[locale]/yasal/[slug]/page.tsx` | Yasal sayfa render (force-dynamic, RichText) |
| `src/app/(site)/[locale]/yasal/kvkk-basvuru/page.tsx` | KVKK başvuru formu sayfası |
| `src/components/forms/KvkkBasvuruForm.tsx` | Başvuru formu (client) |
| `src/app/(site)/[locale]/iletisim/page.tsx` (mod.) | Tam künye bloğu |
| `src/components/layout/CookieConsent.tsx` | Çerez onay bandı (client) |
| `src/app/(site)/(layout veya [locale]/layout)` (mod.) | CookieConsent + Footer'a yasal linkler |
| `src/components/layout/Footer.tsx` (mod.) | Yasal linkler satırı + künye özeti |
| `src/payload/seed-legal.ts` veya seed güncelle | 4 yasal richPage + künye placeholder seed |
| `src/migrations/*` | richPage + siteSettings künye migration |

---

### Task 1: RichPage koleksiyonu + siteSettings künye + migration

**Files:** Create `src/collections/RichPage.ts`; Modify `payload.config.ts`, `src/globals/SiteSettings.ts`
**Interfaces:** Produces: `richPage` koleksiyonu (`slug` unique text, `baslik` localized text, `icerik` richText localized, `kategori` select[legal|kurumsal|redwall], `sonGuncelleme` date); siteSettings'e `mersisNo`/`ticaretSicilNo`/`kepAdresi` (text) eklenir.

- [ ] **Step 1:** `src/collections/RichPage.ts` oluştur (mevcut koleksiyon desenini izle — `src/collections/Service.ts` gibi; `access.read: () => true`, `admin.useAsTitle: 'slug'`):
```ts
import type { CollectionConfig } from 'payload'
export const RichPage: CollectionConfig = {
  slug: 'richPage',
  labels: { singular: 'İçerik Sayfası', plural: 'İçerik Sayfaları' },
  admin: { useAsTitle: 'slug' },
  access: { read: () => true },
  fields: [
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'kategori', type: 'select', options: ['legal', 'kurumsal', 'redwall'], defaultValue: 'kurumsal' },
    { name: 'baslik', type: 'text', localized: true, required: true },
    { name: 'icerik', type: 'richText', localized: true },
    { name: 'sonGuncelleme', type: 'date' },
  ],
}
```
- [ ] **Step 2:** `payload.config.ts` `collections` dizisine `RichPage` ekle (import + dizi). `src/globals/SiteSettings.ts` `iletisim` grubuna VEYA kök alanlara `mersisNo`/`ticaretSicilNo`/`kepAdresi` (text, localized DEĞİL) ekle.
- [ ] **Step 3:** `npx payload migrate:create richpage_kunye` → migration üret.
- [ ] **Step 4: Doğrula:** `npm run build` yeşil (types). Dev'de `npx payload migrate` uygular; `/admin`'de "İçerik Sayfaları" koleksiyonu + Site Ayarları'nda yeni künye alanları görünür.
- [ ] **Step 5: Commit** `feat(cms): RichPage koleksiyonu + siteSettings künye alanları`.

### Task 2: richPage adaptör fonksiyonları

**Files:** Modify `src/lib/cms/queries.ts`, `src/lib/cms/queries` (varsa test)
**Interfaces:** Produces: `getRichPage(slug: string)` → `{ baslik:{tr,en}, icerik:{tr,en}, kategori, sonGuncelleme } | null`; `getRichPagesByCategory(kategori: string)` → liste.

- [ ] **Step 1:** `src/lib/cms/queries.ts`'e ekle (mevcut `getPost` deseni; `getPayloadClient` + `safe` + `locale:'all'` + `depth:1`):
```ts
export async function getRichPage(slug: string) {
  return safe(async () => {
    const p = await getPayloadClient()
    const r = (await p.find({ collection: 'richPage', where: { slug: { equals: slug } }, locale: 'all', depth: 1, limit: 1 })).docs[0]
    if (!r) return null
    return { slug: r.slug, baslik: r.baslik, icerik: r.icerik, kategori: r.kategori, sonGuncelleme: r.sonGuncelleme }
  }, null)
}
export async function getRichPagesByCategory(kategori: string) {
  return safe(async () => {
    const p = await getPayloadClient()
    return (await p.find({ collection: 'richPage', where: { kategori: { equals: kategori } }, locale: 'all', depth: 0, limit: 50 })).docs
      .map((r) => ({ slug: r.slug, baslik: r.baslik, kategori: r.kategori }))
  }, [])
}
```
(Payload tipleri `locale:'all'` için `{tr,en}` döndürmez → Faz 2b'deki `as`/`Record<string,unknown>` deseniyle tiplendir, `any` KULLANMA — lint no-explicit-any error.)
- [ ] **Step 2: Doğrula:** `npm run build` yeşil.
- [ ] **Step 3: Commit** `feat(cms): getRichPage + getRichPagesByCategory adaptörleri`.

### Task 3: Yasal sayfa rotası + içerik render

**Files:** Create `src/app/(site)/[locale]/yasal/[slug]/page.tsx`
**Interfaces:** Consumes: `getRichPage`. Produces: `/[locale]/yasal/[slug]` rotası (force-dynamic), Lexical içeriği + uyarı bandı render.

- [ ] **Step 1:** Sayfa: `export const dynamic = 'force-dynamic'`; `getRichPage(slug)`; yoksa `notFound()`. `PageHero` (baslik) + `Section` içinde `<RichText data={pick(icerik, locale)} />` (blog/[slug] deseni). Kategori `legal` ise içeriğin üstünde **uyarı bandı**: TR "⚠️ Bu metin taslaktır; yürürlük öncesi KVKK danışmanınıza kontrol ettirin." / EN karşılığı. `generateMetadata` (baslik). `setRequestLocale(locale)`.
- [ ] **Step 2: Doğrula:** Task 4 seed sonrası; `npm run build` yeşil (önce boş veriyle de derlenmeli — getRichPage null → notFound, sayfa derlenir).
- [ ] **Step 3: Commit** `feat: /yasal/[slug] rotası (force-dynamic, Lexical + taslak şerhi)`.

### Task 4: Yasal içerik seed (4 taslak metin, TR+EN)

**Files:** Create `src/payload/seed-legal.ts`; Modify `package.json` (script `payload:seed-legal`)
**Interfaces:** Consumes: richPage koleksiyonu. Produces: idempotent seed — 4 yasal richPage + siteSettings künye placeholder.

- [ ] **Step 1:** `src/payload/seed-legal.ts` (mevcut `src/payload/seed.ts` deseni; `getPayload({config})`, idempotent slug-bazlı upsert, `locale:'tr'` create + `locale:'en'` update). 4 doc: `kvkk-aydinlatma`, `gizlilik-politikasi`, `cerez-politikasi`, `kullanim-kosullari` (kategori=legal, sonGuncelleme=bugün). Her biri için **gerçek Türkçe taslak prose** (Lexical formatında: başlıklar + paragraflar) + İngilizce karşılığı. İçerik yapısı:
  - **kvkk-aydinlatma:** Veri sorumlusu (Redwall... + `[DOLDURULACAK: MERSİS no, ticaret sicil no]`), işlenen veriler, işleme amaçları (m.5/6), aktarım, saklama süresi, ilgili kişi hakları (m.11), başvuru yöntemi (KVKK Başvuru Formu linki).
  - **gizlilik-politikasi:** toplanan veriler, kullanım, çerezler (çerez politikasına atıf), üçüncü taraflar, güvenlik, haklar, iletişim.
  - **cerez-politikasi:** çerez nedir, kullanılan çerezler (zorunlu: oturum/dil — şu an izleme yok), onay mekanizması (bant), tarayıcı ayarları.
  - **kullanim-kosullari:** kapsam, fikri mülkiyet (Redwall/YangınPro/MekanikPro markaları), sorumluluk reddi, dış linkler, değişiklik, uygulanacak hukuk (Türkiye), yetkili mahkeme `[DOLDURULACAK: yetkili mahkeme — Sakarya]`.
  Her metnin EN'i de yazılır (taslak; profesyonel çeviri sonra).
- [ ] **Step 2:** `package.json`'a `"payload:seed-legal": "tsx src/payload/seed-legal.ts"`. siteSettings künye placeholder'larını da set et (`mersisNo: '[DOLDURULACAK: MERSİS no]'` vb.) — yalnız boşsa.
- [ ] **Step 3: Doğrula:** `npm run payload:seed-legal` çalışır; ikinci çalıştırma idempotent. `npm run dev` → `/tr/yasal/kvkk-aydinlatma` ve diğer 3'ü 200, içerik + taslak şerhi render; `/en/...` de render.
- [ ] **Step 4: Commit** `feat(cms): 4 yasal sayfa taslak içeriği (seed, TR+EN, danışman şerhli)`.

### Task 5: KVKK Başvuru Formu

**Files:** Create `src/components/forms/KvkkBasvuruForm.tsx`, `src/app/(site)/[locale]/yasal/kvkk-basvuru/page.tsx`
**Interfaces:** Mevcut form deseni (`src/components/forms/ContactForm.tsx` / `QuoteForm.tsx` — incele). Produces: `/[locale]/yasal/kvkk-basvuru` sayfası + form.

- [ ] **Step 1:** Mevcut form bileşenini (ContactForm/QuoteForm) oku; aynı desenle `KvkkBasvuruForm.tsx`: alanlar adSoyad, iletisim (e-posta/tel), basvuruSahibiSifati (select: ilgili kişi/vekil/...), talepTuru (select: bilgi talebi/düzeltme/silme/itiraz...), aciklama (textarea), kvkkOnay (checkbox, zorunlu). Client validasyon + başarı mesajı (mevcut desen). **Gönderim:** mevcut formlar gibi henüz e-posta göndermez; üstte/altta not: "Başvurunuzu ayrıca KEP/e-posta ile de iletebilirsiniz: `[DOLDURULACAK: KEP]`". Yorum satırında `// TODO(Resend): server action ile gönderim — roadmap`.
- [ ] **Step 2:** Sayfa (`force-dynamic` gerekmez — statik form; ama `setRequestLocale`): PageHero + açıklama + `<KvkkBasvuruForm/>`.
- [ ] **Step 3: Doğrula:** build yeşil; `/tr/yasal/kvkk-basvuru` 200, form render + client validasyon çalışır.
- [ ] **Step 4: Commit** `feat: KVKK İlgili Kişi Başvuru Formu sayfası`.

### Task 6: Künye bloğu (iletişim) + siteSettings adaptörü

**Files:** Modify `src/app/(site)/[locale]/iletisim/page.tsx`, `src/lib/cms/queries.ts` (getSiteSettings künye alanları)
**Interfaces:** `getSiteSettings()` çıktısına `mersisNo/ticaretSicilNo/kepAdresi` eklenir.

- [ ] **Step 1:** `getSiteSettings()` adaptörüne yeni künye alanlarını ekle (mevcut fonksiyonu genişlet). `/iletisim` sayfasına **tam künye bloğu**: ticaret unvanı (sirketAdi), açık adres, telefon, e-posta, KEP, MERSİS no, ticaret sicil no — değerler siteSettings'ten, boşsa `[DOLDURULACAK]` göster. Görünür bir "Künye / Yasal Bilgiler" bölümü.
- [ ] **Step 2: Doğrula:** build yeşil; `/tr/iletisim` künye bloğu render (placeholder değerlerle).
- [ ] **Step 3: Commit** `feat: iletişim sayfasında tam künye bloğu`.

### Task 7: Çerez onay bandı + Footer yasal linkler

**Files:** Create `src/components/layout/CookieConsent.tsx`; Modify root site layout, `src/components/layout/Footer.tsx`
**Interfaces:** Produces: ilk ziyarette gösterilen, localStorage'da tercih saklayan çerez bandı; footer yasal linkler satırı.

- [ ] **Step 1:** `CookieConsent.tsx` ('use client'): `localStorage.getItem('cookie-consent')` yoksa altta sabit bant göster (kısa metin + Çerez Politikası linki `/yasal/cerez-politikasi` + "Kabul Et" / "Reddet" butonları). Tıklayınca `localStorage.setItem('cookie-consent', 'accepted'|'rejected')` + bandı gizle. SSR-safe (mounted state ile). i18n: next-intl `useTranslations` veya basit locale prop.
- [ ] **Step 2:** Site layout'a (`src/app/(site)/[locale]/layout.tsx`) `<CookieConsent/>` ekle (Footer yakını).
- [ ] **Step 3:** `Footer.tsx`'e yasal linkler satırı (alt bar): KVKK Aydınlatma (`/yasal/kvkk-aydinlatma`) | Gizlilik (`/yasal/gizlilik-politikasi`) | Çerez (`/yasal/cerez-politikasi`) | Kullanım Koşulları (`/yasal/kullanim-kosullari`) | Künye (`/iletisim#kunye`). i18n Link bileşeni.
- [ ] **Step 4: Doğrula:** build + lint yeşil; `npm run dev` → bant ilk ziyarette görünür, Kabul/Reddet kalıcı (reload'da gelmez); footer yasal linkler tıklanınca doğru sayfalara gider (TR/EN).
- [ ] **Step 5: Commit** `feat: çerez onay bandı + footer yasal linkler`.

### Task 8: Faz A doğrulama (build/lint/test)

- [ ] **Step 1:** `npm run build` (yeşil), `npm run lint` (0 error), `npx vitest run` (yeşil).
- [ ] **Step 2:** Preview: tüm yeni rotalar TR/EN 200 (`/yasal/kvkk-aydinlatma|gizlilik-politikasi|cerez-politikasi|kullanim-kosullari`, `/yasal/kvkk-basvuru`), künye bloğu, çerez bandı. Mevcut sayfalar regresyonsuz.
- [ ] **Step 3:** Deploy YAPILMAZ (Faz C+D sonrası tek deploy). Faz A commit'leri dalda kalır.

---

## Self-Review (Faz A)
- **Spec coverage:** 4 yasal sayfa (T3,T4) ✔, KVKK başvuru (T5) ✔, künye (T1,T6) ✔, çerez bandı (T7) ✔, footer yasal (T7) ✔, richPage altyapı (T1,T2) ✔. Spec Faz A maddeleri karşılanıyor.
- **Placeholder:** `[DOLDURULACAK]` bilinçli (künye/yasal ID'ler). Yasal prose içeriği T4'te implementer tarafından yazılır (yapı net).
- **Tutarlılık:** `getRichPage` (T2) → T3 tüketir; slug'lar (kvkk-aydinlatma/gizlilik-politikasi/cerez-politikasi/kullanim-kosullari) T3/T4/T7 arasında aynı; `richPage` alanları T1↔T2↔T4 tutarlı.
- **Risk:** Yasal metin taslak (şerhli); form e-posta göndermez (not düşülü).
