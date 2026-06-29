# Faz C — Kurumsal Sayfalar (Uygulama Planı)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Adımlar checkbox. Spec'in (`../specs/2026-06-29-redwall-eksik-kurumsal-sayfalar-design.md`) **Faz C**'si. Faz A bitti. Deploy hepsi (A+C+D) bitince.

**Goal:** Çözümler/Sektörler, Ekibimiz, İndirilebilir Dokümanlar sayfalarını Payload-backed kurmak.

**Architecture:** 3 yeni koleksiyon (`solution`, `teamMember`, `document`) + adaptörler + rotalar (içerik rotaları `force-dynamic`). Üst menüye "Çözümler" eklenir.

**Tech Stack:** Payload 3.85, Next 16.2.9, cms adaptör katmanı, dev Postgres 5433 + MinIO.

## Global Constraints
- Hepsi Payload (düzenlenebilir). İçerik rotaları `export const dynamic = 'force-dynamic'`. i18n `locale:'all'` → `{tr,en}`, `pick()`. Boş-dayanıklı `safe()`. Lint `no-explicit-any` ERROR → `as unknown as Record<string,unknown>` deseni. Görseller next/image, same-origin `/api/media`. Migration dosyaları (dev'de SQL/`migrate:create`; prod'da migrate temiz). Mevcut koleksiyon deseni: `src/collections/Service.ts`; adaptör: `getServices`; rota: `projeler/[slug]`; seed: `src/payload/seed.ts`.

---

## Dosya Yapısı
| Dosya | Sorumluluk |
|---|---|
| `src/collections/Solution.ts` | Çözüm/sektör (slug, baslik, ozet, icerik, ikon, hedefKitle, sira) |
| `src/collections/TeamMember.ts` | Ekip üyesi (ad, unvan, foto, bio, linkedin, sira) |
| `src/collections/Document.ts` | Doküman (baslik, aciklama, dosya[upload], kategori, sira) |
| `payload.config.ts` (mod.) | 3 koleksiyon + wiring |
| `src/lib/cms/queries.ts` (mod.) | getSolutions/getSolution, getTeam, getDocuments |
| `src/app/(site)/[locale]/cozumler/page.tsx` + `[slug]/page.tsx` | Çözümler liste + detay |
| `src/app/(site)/[locale]/kurumsal/ekibimiz/page.tsx` | Ekip grid |
| `src/app/(site)/[locale]/dokumanlar/page.tsx` | Doküman listesi |
| `src/components/layout/nav-config.ts` (mod.) | "Çözümler" menü öğesi |
| `src/payload/seed-kurumsal.ts` | solution/team/document seed |
| `src/migrations/*` | 3 koleksiyon migration |

---

### Task 1: 3 koleksiyon (solution, teamMember, document) + migration
**Files:** Create `src/collections/{Solution,TeamMember,Document}.ts`; Modify `payload.config.ts`
**Interfaces:** Produces: `solution`(slug unique, baslik localized, ozet localized textarea, icerik richText localized, ikon select[ICON_OPTIONS], hedefKitle localized textarea, sira number), `teamMember`(ad text, unvan localized, foto upload→media, bio localized textarea, linkedin text, sira number), `document`(baslik localized, aciklama localized textarea, dosya upload→media, kategori localized text, sira number). Hepsi `access.read:()=>true`.
- [ ] **Step 1:** 3 koleksiyon dosyası (Service.ts/Referans.ts desenini izle; ikon için `import { ICON_OPTIONS } from './iconOptions'`). payload.config'e ekle.
- [ ] **Step 2:** `npx payload migrate:create kurumsal_koleksiyonlar`. **Dev DB notu:** `payload migrate` dev-push promptu sorar; dev için kolonları doğrudan SQL ile eklemek gerekebilir (Faz A ürün task'ındaki gibi) VEYA `next dev` push'u kullan. Build için migration dosyası yeterli.
- [ ] **Step 3: Doğrula:** `npm run build` yeşil; `/admin`'de 3 koleksiyon görünür.
- [ ] **Step 4: Commit** `feat(cms): solution/teamMember/document koleksiyonları`.

### Task 2: Adaptörler
**Files:** Modify `src/lib/cms/queries.ts`
**Interfaces:** Produces: `getSolutions()` (sort sira, liste {slug,baslik,ozet,ikon}), `getSolution(slug)` ({baslik,ozet,icerik,ikon,hedefKitle}|null), `getTeam()` (sort sira, {ad,unvan,foto,bio,linkedin}), `getDocuments()` (sort sira, {baslik,aciklama,dosya,kategori}). Hepsi `locale:'all'`, `safe()`, no-any.
- [ ] **Step 1:** 4 fonksiyonu ekle (getServices/getProducts deseni; depth:2 media çözer).
- [ ] **Step 2: Doğrula:** build yeşil, lint 0.
- [ ] **Step 3: Commit** `feat(cms): solution/team/document adaptörleri`.

### Task 3: Çözümler liste + detay rotaları
**Files:** Create `src/app/(site)/[locale]/cozumler/page.tsx`, `cozumler/[slug]/page.tsx`
**Interfaces:** Consumes: getSolutions, getSolution.
- [ ] **Step 1:** Liste (`force-dynamic`, getSolutions, kart grid: ikon+baslik+ozet, `/cozumler/[slug]`'e link; PageHero). Detay (`force-dynamic`, getSolution(slug), null→notFound, PageHero+ozet+`<RichText>` icerik + hedefKitle listesi). `projeler` liste/detay desenini izle.
- [ ] **Step 2: Doğrula:** build yeşil (seed öncesi boş liste de derlenir).
- [ ] **Step 3: Commit** `feat: /cozumler liste + detay rotaları`.

### Task 4: Ekibimiz sayfası
**Files:** Create `src/app/(site)/[locale]/kurumsal/ekibimiz/page.tsx`
- [ ] **Step 1:** `force-dynamic`, getTeam(), kart grid (foto[next/image]+ad+unvan+bio+linkedin ikonu). PageHero. Boşsa nazik boş-durum.
- [ ] **Step 2: Doğrula:** build yeşil.
- [ ] **Step 3: Commit** `feat: /kurumsal/ekibimiz sayfası`.

### Task 5: Dokümanlar sayfası
**Files:** Create `src/app/(site)/[locale]/dokumanlar/page.tsx`
- [ ] **Step 1:** `force-dynamic`, getDocuments(), kategori bazlı liste (baslik+aciklama + indir linki `mediaUrl(dosya)` — `download` attribute). PageHero.
- [ ] **Step 2: Doğrula:** build yeşil.
- [ ] **Step 3: Commit** `feat: /dokumanlar sayfası`.

### Task 6: Seed (solution/team/document)
**Files:** Create `src/payload/seed-kurumsal.ts` + package.json script
**Interfaces:** idempotent.
- [ ] **Step 1:** seed.ts deseni; solutions: **Kamu Çözümleri, Müteahhit/İnşaat Çözümleri, Sağlık Yapıları, Sanayi & Enerji** (TR+EN ozet+icerik+ikon+hedefKitle); team: 2-3 placeholder üye (ad/unvan/bio); document: 1-2 placeholder (katalog/broşür — dosya opsiyonel, boş bırakılabilir). Idempotent slug/ad-bazlı.
- [ ] **Step 2:** package.json `"payload:seed-kurumsal": "tsx src/payload/seed-kurumsal.ts"`. Çalıştır (dev'de kolonlar SQL ile eklenmeli — Task 1 notu).
- [ ] **Step 3: Doğrula:** `/tr/cozumler` (+ bir detay), `/tr/kurumsal/ekibimiz`, `/tr/dokumanlar` 200 + içerik; `/en/...` 200.
- [ ] **Step 4: Commit** `feat(cms): kurumsal seed (çözümler/ekip/doküman)`.

### Task 7: Menü — Çözümler
**Files:** Modify `src/components/layout/nav-config.ts` (+ gerekiyorsa Header/messages)
- [ ] **Step 1:** Üst menüye "Çözümler" → `/cozumler` ekle (mevcut nav-config yapısını izle; i18n etiket anahtarı gerekiyorsa messages/*.json'a ekle). Footer'a "Çözümler" + "Ekibimiz" + "Dokümanlar" linkleri (uygun sütuna).
- [ ] **Step 2: Doğrula:** build yeşil; menüde Çözümler görünür, tıklanınca /cozumler.
- [ ] **Step 3: Commit** `feat: menü + footer — Çözümler/Ekibimiz/Dokümanlar linkleri`.

### Task 8: Faz C doğrulama
- [ ] `npm run build` (yeşil), `npm run lint` (0 error), `npx vitest run` (yeşil). Preview: /cozumler(+detay), /kurumsal/ekibimiz, /dokumanlar TR/EN 200; menü/footer linkleri; regresyon yok. Deploy YAPILMAZ (Faz D sonrası).

---

## Self-Review (Faz C)
- **Spec coverage:** Çözümler (T1,T2,T3,T6) ✔, Ekibimiz (T1,T2,T4,T6) ✔, Dokümanlar (T1,T2,T5,T6) ✔, menü (T7) ✔. Faz C maddeleri karşılanıyor. (Kamu/Müteahhit Çözümleri = solution kayıtları → Faz D'de ayrı sistem değil, burada seed'lenir.)
- **Placeholder:** Ekip/doküman seed placeholder (kullanıcı /admin'de gerçekleştirir) — bilinçli.
- **Tutarlılık:** adaptör adları T2'de tanımlı, T3/T4/T5 tüketir; koleksiyon alanları T1↔T2↔T6 tutarlı; force-dynamic tüm içerik rotalarında.
