# Faz 2b — Sanity → Payload Cutover (Uygulama Planı)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Adımlar checkbox (`- [ ]`). Bu plan Faz 2b'dir: site veri katmanını Sanity'den Payload'a çevirir ve Sanity'yi kaldırır. Faz 2a (Payload canlı, /admin, gerçek içerik) TAMAMLANDI.

**Goal:** Site Server Component'lerinin verisini Sanity (`sanityFetch`/GROQ) yerine **Payload Local API**'den okutmak ve Sanity'yi (paketler, `/studio`, `src/sanity/*`, env) tamamen kaldırmak — görünüm/davranış birebir korunarak.

**Architecture:** Payload Local API'yi `locale:'all'` ile sorgulayıp veriyi **mevcut bileşenlerin beklediği Sanity şekline çeviren** bir adaptör katmanı (`src/lib/cms/`). `locale:'all'` localized alanları `{tr,en}` döndürür (Sanity deseni) → bileşenlerin `pick()` çağrıları değişmez. Named-subfield array'leri unwrap edilir. Görseller Payload'ın kendi `/api/media` route'undan servis edilir (MinIO iç ağda, tarayıcı doğrudan erişemez).

**Tech Stack:** Next.js 16.2.9, Payload 3.85.1 Local API (`getPayload`), PostgreSQL, MinIO. Site hâlâ SSR/SSG; veri kaynağı Payload.

## Global Constraints

- **Görünüm/davranış DEĞİŞMEZ.** Cutover sadece veri kaynağını değiştirir; her sayfa TR/EN aynı içeriği render etmeli.
- **Boş-dayanıklı:** adaptör fonksiyonları asla throw etmez; hata/boş veride mevcut kod-fallback'leri devreye girer (Payload erişilemezse site çökmező).
- **`locale: 'all'`** ile sorgula → localized alanlar `{tr,en}` (bileşen `pick()`'i korunur).
- **Named-subfield array unwrap:** `chips:[{etiket}]`→`[{tr,en}]`, `girisParagraflar:[{paragraf}]`→`[...]`, `hedefKitle:[{madde}]`, `ekranGorselleri:[{gorsel}]`, `post.etiketler:[{etiket}]`.
- **Medya:** tarayıcıya giden görsel URL'leri `redwall.tr` üzerinden (Payload `/api/media/file/...` veya app-served) olmalı — `http://minio:9000` (iç) DEĞİL.
- **Local API prod'da:** web konteyneri `DATABASE_URI` + S3 env'e sahip (Faz 2a). Dev'de `.env.local` (5433).
- Site `(site)` route grubunda; Payload `(payload)` ayrı. Cutover `(site)` tarafını değiştirir.

---

## Dosya Yapısı

| Dosya | Sorumluluk |
|---|---|
| `src/lib/cms/client.ts` | Cached `getPayloadClient()` + boş-dayanıklı `safe<T>(fn, fallback)` |
| `src/lib/cms/transform.ts` | Payload→legacy şekil yardımcıları (unwrap array, media→{url}, group/localized geçişi) |
| `src/lib/cms/queries.ts` | 17 adaptör fonksiyonu (GROQ sorgularının Payload karşılığı, legacy şekil döner) |
| `src/lib/cms/image.ts` | `mediaUrl(media)` — Payload media → app-served URL (urlFor yerine) |
| `src/collections/Media.ts` (mod.) | Görsellerin app üzerinden servisi (S3 URL değil, `/api/media`) |
| `payload.config.ts` / `next.config.ts` (mod.) | remotePatterns: `cdn.sanity.io` kaldır → MinIO/redwall asset hostu |
| 15 tüketici dosya (mod.) | `sanityFetch(Q)`→`getX(locale)`, `urlFor(x)`→`mediaUrl(x)` |
| **Kaldırılan:** `src/sanity/*`, `src/app/(site)/studio/*`, `sanity`/`next-sanity`/`@sanity/*` paketleri, `SANITY_*` env/secret |

**17 sorgu → adaptör fonksiyonu eşlemesi** (kaynak: `src/sanity/lib/queries.ts`):
`getProjects/getProject/getFeaturedProjects`, `getServices/getService`, `getProducts/getProduct`, `getReferences/getFeaturedReferences`, `getFaqs`, `getPosts/getPost`, `getJobs`, `getPage`, `getSiteSettings`, `getNav`, `getHome`. Her biri ilgili GROQ projeksiyonundaki alanları aynı isim/şekille döndürür.

---

### Task 1: Payload client + boş-dayanıklı yardımcı

**Files:** Create `src/lib/cms/client.ts`, `src/lib/cms/client.test.ts`
**Interfaces:** Produces: `getPayloadClient(): Promise<Payload>` (cached), `safe<T>(fn: () => Promise<T>, fallback: T): Promise<T>`.

- [ ] **Step 1: Test** — `safe` hata atan fn'de fallback döner, başarılıda değeri döner.
```ts
import { safe } from './client'
test('safe returns fallback on throw', async () => {
  expect(await safe(async () => { throw new Error('x') }, 42)).toBe(42)
  expect(await safe(async () => 7, 0)).toBe(7)
})
```
- [ ] **Step 2:** `npx vitest run src/lib/cms/client.test.ts` → FAIL (modül yok).
- [ ] **Step 3:** Implement:
```ts
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'

let cached: Promise<Payload> | null = null
export function getPayloadClient(): Promise<Payload> {
  if (!cached) cached = getPayload({ config })
  return cached
}
export async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn() } catch (e) { console.error('[cms] fetch failed:', e); return fallback }
}
```
- [ ] **Step 4:** Test PASS.
- [ ] **Step 5:** Commit `feat(cms): Payload client + boş-dayanıklı safe()`.

### Task 2: Transform yardımcıları (Payload → legacy şekil)

**Files:** Create `src/lib/cms/transform.ts`, `src/lib/cms/transform.test.ts`
**Interfaces:** Produces:
- `unwrap<T>(arr, key): T[]` — `[{[key]:v}]` → `[v]` (named-subfield array unwrap; null-safe → `[]`).
- `mediaRef(m): { url: string } | null` — Payload upload alanı (id veya {url}) → `{ url }` ya da null.
- `loc(field)` — `locale:'all'` çıktısını olduğu gibi geçirir (zaten `{tr,en}`); helper sadece tip kolaylığı.

- [ ] **Step 1: Test** — unwrap + mediaRef null-safe.
```ts
import { unwrap, mediaRef } from './transform'
test('unwrap', () => {
  expect(unwrap([{etiket:{tr:'a'}}], 'etiket')).toEqual([{tr:'a'}])
  expect(unwrap(undefined, 'etiket')).toEqual([])
})
test('mediaRef', () => {
  expect(mediaRef({ url: '/api/media/file/x.png' })).toEqual({ url: '/api/media/file/x.png' })
  expect(mediaRef(null)).toBeNull()
  expect(mediaRef(5)).toBeNull() // çözülmemiş id → null
})
```
- [ ] **Step 2:** vitest FAIL.
- [ ] **Step 3:** Implement (unwrap maps `r => r?.[key]` filter Boolean; mediaRef: obje + `.url` → `{url}`, değilse null).
- [ ] **Step 4:** Test PASS.
- [ ] **Step 5:** Commit `feat(cms): transform yardımcıları (unwrap, mediaRef)`.

### Task 3: Medya app üzerinden servis (MinIO iç ağ → tarayıcı erişimi)

**Files:** Modify `src/collections/Media.ts`, `src/lib/cms/image.ts` (create), verify `payload.config.ts`
**Interfaces:** Produces: Payload media `url`'i `redwall.tr` üzerinden çözülür (ör. `/api/media/file/<filename>`); `mediaUrl(m): string | undefined`.

- [ ] **Step 1:** s3Storage'ın URL davranışını incele. MinIO iç ağda olduğundan, media `url`'i **app-served** olmalı. `@payloadcms/storage-s3`'te `signedDownloads`/`disablePayloadAccessControl` ayarlarını kontrol et; gerekiyorsa Media koleksiyonuna app-served URL üreten erişim sağla (Payload upload route `/api/media/file/<name>` web app'ten servis eder, web MinIO'dan iç ağ üzerinden çeker).
- [ ] **Step 2:** `src/lib/cms/image.ts`:
```ts
export function mediaUrl(m: unknown): string | undefined {
  if (m && typeof m === 'object' && 'url' in m && typeof (m as any).url === 'string') return (m as any).url
  return undefined
}
```
- [ ] **Step 3: Doğrula** — dev'de bir media kaydının `url`'i app-served formatta; `<img src>` ile yüklenebiliyor. `npm run dev` → bir referans logosu görseli tarayıcıda yükleniyor (preview).
- [ ] **Step 4:** Commit `feat(cms): medya app-served URL (MinIO iç ağ uyumu) + mediaUrl`.

### Task 4: Adaptör fonksiyonları — içerik koleksiyonları

**Files:** Create `src/lib/cms/queries.ts` (kısım 1)
**Interfaces:** Produces (legacy şekil döner, `locale:'all'` ile sorgular):
`getProjects()`, `getProject(slug)`, `getFeaturedProjects()`, `getServices()`, `getService(isKolu)`, `getProducts()`, `getProduct(slug)`, `getReferences()`, `getFeaturedReferences()`, `getFaqs()`, `getPosts()`, `getPost(slug)`, `getJobs()`.

- [ ] **Step 1:** Her fonksiyon `getPayloadClient()` + `payload.find({ collection, locale:'all', where, sort, depth })` ile veriyi çeker, `safe()` sarar, ve `queries.ts`'teki GROQ projeksiyonuyla **birebir aynı alan adları/şekli** döndürür (transform: unwrap array'ler, mediaRef görseller, depth:2 ile media/relationship çöz). Kaynak alan adları: `src/sanity/lib/queries.ts` + `src/collections/*.ts`.
  Örnek (`getService`):
```ts
export async function getService(isKolu: string) {
  return safe(async () => {
    const p = await getPayloadClient()
    const r = (await p.find({ collection: 'service', where: { isKolu: { equals: isKolu } }, locale: 'all', depth: 2, limit: 1 })).docs[0]
    if (!r) return null
    return {
      isKolu: r.isKolu, baslik: r.baslik, ozet: r.ozet,
      chips: unwrap(r.chips, 'etiket'),
      girisLead: r.girisLead,
      girisParagraflar: unwrap(r.girisParagraflar, 'paragraf'),
      altHizmetler: r.altHizmetler, surec: r.surec,
    }
  }, null)
}
```
- [ ] **Step 2: Doğrula** — dev'de her fonksiyonu Local API ile çağırıp (geçici script veya bir test sayfası) çıktının legacy şekle uyduğunu gör; `npm run build` type-check geçer.
- [ ] **Step 3:** Commit `feat(cms): içerik adaptör fonksiyonları (project/service/product/referans/faq/post/job)`.

### Task 5: Adaptör fonksiyonları — page + globals (settings/nav/home)

**Files:** Modify `src/lib/cms/queries.ts` (kısım 2)
**Interfaces:** Produces: `getPage(slug)`, `getSiteSettings()`, `getNav()`, `getHome()` (legacy şekil; globals `payload.findGlobal({ slug, locale:'all', depth:2 })`).

- [ ] **Step 1:** `getPage` (chips/girisParagraflar/kartlar unwrap + kartlar.icon), `getSiteSettings` (iletisim/sosyal group, istatistikler), `getNav` (headerLinks/footerKolonlari nested array), `getHome` (hero* + yaklasim + oneCikanUrun relationship→{slug,ad,slogan}). GROQ projeksiyonlarıyla aynı şekil.
- [ ] **Step 2:** build type-check geçer.
- [ ] **Step 3:** Commit `feat(cms): page + globals adaptör fonksiyonları`.

### Task 6: Tüketicileri Payload'a bağla — ana sayfa + hizmet/ürün

**Files:** Modify `src/app/(site)/[locale]/page.tsx`, `yazilim/page.tsx`, `yazilim/[urun]/page.tsx`, `components/sections/ServiceDetail.tsx`, `components/sections/PageContent.tsx`
**Interfaces:** Consumes: Task 4-5 fonksiyonları.

- [ ] **Step 1:** Her dosyada `sanityFetch(QUERY, params, fallback)` → ilgili `getX(...)` ile değiştir; `import` güncelle. Veri şekli aynı olduğu için JSX/pick() mantığı DEĞİŞMEZ. `urlFor(x)...` → `mediaUrl(x)`.
- [ ] **Step 2: Doğrula** — `npm run build` yeşil; preview'da `/tr` ve `/en` ana sayfa + `/yazilim` + bir ürün + bir kurumsal sayfa, içerik Payload'dan geliyor (ör. `/admin`'de bir başlığı değiştir → sayfada görün), görseller yükleniyor.
- [ ] **Step 3:** Commit `feat(cms): ana sayfa + hizmet/ürün Payload'dan okuyor`.

### Task 7: Tüketicileri bağla — projeler + blog + görseller

**Files:** Modify `projeler/page.tsx`, `projeler/[slug]/page.tsx`, `blog/page.tsx`, `blog/[slug]/page.tsx`, `components/sections/ReferenceStrip.tsx`
**Interfaces:** Consumes: getProjects/getProject/getFeaturedProjects/getPosts/getPost/getFeaturedReferences + mediaUrl.

- [ ] **Step 1:** sanityFetch→getX, urlFor→mediaUrl. Blog `icerik` (Lexical) render: Sanity PortableText yerine Payload Lexical render (mevcut `@portabletext/react` → Payload Lexical→React). Lexical'i HTML/React'e çevir (Payload `@payloadcms/richtext-lexical`'in React converter'ı veya serialize).
- [ ] **Step 2: Doğrula** — build yeşil; preview'da projeler listesi+detay (görseller), blog listesi+detay (Lexical içerik render), referans logoları yükleniyor (TR/EN).
- [ ] **Step 3:** Commit `feat(cms): projeler + blog + referans görselleri Payload'dan`.

### Task 8: Tüketicileri bağla — referanslar/sss/kariyer/iletişim + Footer + sitemap

**Files:** Modify `referanslar/page.tsx`, `sss/page.tsx`, `kariyer/page.tsx`, `iletisim/page.tsx`, `components/layout/Footer.tsx`, `app/sitemap.ts`
**Interfaces:** Consumes: getReferences/getFaqs/getJobs/getSiteSettings/getProjects/getPosts.

- [ ] **Step 1:** sanityFetch→getX, urlFor→mediaUrl. sitemap.ts dinamik slug'ları (projeler/blog/ürün) Payload'dan çeker.
- [ ] **Step 2: Doğrula** — build yeşil; preview'da referanslar (paginate+logo), SSS, kariyer, iletişim (gerçek adres Adapazarı), footer (sosyal linkler), `/sitemap.xml` slug'ları içeriyor (TR/EN).
- [ ] **Step 3:** Commit `feat(cms): referanslar/sss/kariyer/iletişim/footer/sitemap Payload'dan`.

### Task 9: Sanity'yi kaldır

**Files:** Delete `src/sanity/`, `src/app/(site)/studio/`; Modify `package.json`, `next.config.ts`, `src/sanity/lib/fetch.test.ts` (→ kaldır), env
**Interfaces:** Produces: Sanity'siz, yalnız Payload okuyan kod tabanı.

- [ ] **Step 1:** `grep -r "sanityFetch\|@/sanity\|urlFor\|next-sanity" src/` → 0 sonuç (Task 6-8 sonrası). Kalan varsa düzelt.
- [ ] **Step 2:** Sil: `src/sanity/`, `src/app/(site)/studio/`. `package.json`'dan `sanity`, `next-sanity`, `@sanity/*` çıkar (`npm rm`). `next.config.ts` remotePatterns'dan `cdn.sanity.io` çıkar (Task 3'te MinIO/asset hostu eklendi). `NEXT_PUBLIC_SANITY_*` + `SANITY_API_READ_TOKEN` artık gereksiz (build-arg/secret) — kaldırma notu (CI vars/secrets temizliği).
- [ ] **Step 3: Doğrula** — `npm run build` yeşil, `npm run lint` temiz, `npm test` yeşil (Sanity testleri kaldırıldı). `/studio` artık yok (404).
- [ ] **Step 4:** Commit `feat(cms): Sanity tamamen kaldırıldı (studio, lib, paketler, env)`.

### Task 10: Deploy + canlı cutover doğrulama

**Files:** (deploy)
**Interfaces:** Produces: Canlı site Payload'dan okuyor.

- [ ] **Step 1:** main'e merge + push → CI build/deploy + migrate. (Web imajı artık Sanity'siz; Payload'dan okuyor.) CI'dan `SANITY_API_READ_TOKEN` build-arg/secret artık kullanılmıyor (workflow'dan NEXT_PUBLIC_SANITY_* + token referanslarını temizle).
- [ ] **Step 2: Doğrula (origin + Cloudflare):** `/tr` `/en` 200, içerik Payload'dan (ör. `/admin`'de bir değişiklik → canlıda görün), görseller (app-served, MinIO iç ağdan) yükleniyor, `/sitemap.xml`, `/studio` 404.
- [ ] **Step 3:** Memory/ledger güncelle: Faz 2b bitti, Sanity kaldırıldı, site tam self-hosted Payload.

---

## Self-Review (Faz 2b)

- **Spec coverage:** Adaptör katmanı (T1-5) ✔, görsel/medya (T3) ✔, tüketici rewire (T6-8, 15 dosya) ✔, Sanity removal (T9) ✔, deploy (T10) ✔. Spec'teki A-D maddeleri karşılanıyor.
- **Placeholder:** T3 (s3 URL davranışı) + T7 (Lexical render) implementasyonda netleşecek bilinçli inceleme noktaları — kaldırılamaz belirsizlikler değil, doğrulama adımlı.
- **Tutarlılık:** Adaptör fonksiyon adları (`getX`) T4-5'te tanımlı, T6-8'de tüketiliyor; `mediaUrl`/`unwrap`/`mediaRef` T2-3'te tanımlı. GROQ projeksiyon alanları ↔ adaptör çıktısı birebir.
- **Risk:** Medya app-served URL (T3) — MinIO iç ağda olduğu için kritik; T3 doğrulaması bunu erken yakalar. Lexical render (T7) — blog içeriği.
