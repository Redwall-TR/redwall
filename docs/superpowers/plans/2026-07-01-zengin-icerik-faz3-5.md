# Zengin İçerik — Faz 3-5 (Faq / Product / Service) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Kalan düz-metin içerik alanlarını (Faq.cevap; Product.aciklama + ozellikler[].aciklama; Service.girisLead + girisParagraflar[] + altHizmetler[].aciklama + surec[].aciklama) Faz 1-2'de kurulan zengin-içerik altyapısıyla richText'e çevirmek.

**Architecture:** Faz 1-2'nin yapı taşları KULLANILIR (yeniden yazılmaz): `liteEditor`/`fullEditor` (`@/payload/lexical`), `plainToLexical`/`normalizeToLexical` (`@/lib/lexical/plainToLexical`), `<RichContent>` (`@/components/ui/RichContent` — string VEYA Lexical render eder, ship-safe). Her koleksiyon: alan(lar) richText yapılır, render `<RichContent>`'e çevrilir (string prop'lu paylaşılan bileşenler `React.ReactNode`'a açılır), veri **Faz-2 migration desenini** (kapt→ALTER→backfill, tek transaction, raw SQL) izleyen migration'la korunur.

**Tech Stack:** Payload 3.85, Next.js 16, Postgres, Vitest, TypeScript.

## Global Constraints

- Lint: `@typescript-eslint/no-explicit-any` ERROR → `as unknown as <T>` / `unknown`.
- **Migration deseni ZORUNLU (Faz 2 kanıtlandı):** textarea→richText = varchar→jsonb. Düz metin geçerli JSON değil → generated ALTER veriyi düşürür. Bu yüzden migration `up()`: (1) ALTER'dan ÖNCE ham `SELECT` ile eski değerleri yakala; (2) `ALTER COLUMN ... TYPE jsonb USING NULL`; (3) her satırı `plainToLexical(text)` JSON'u ile ham `UPDATE`. **Hepsi migration'ın kendi `db`'sinde (tek transaction) — ayrı bağlantı YOK, `payload.*` çağrısı YOK.** Referans: `src/migrations/20260701_181840_referans_gorus_richtext.ts` (bu dosyayı oku, birebir aynı yapıyı kur).
- Lokalize alan storage: `<coll>_locales.<field>` (tekil) veya `<coll>_<array>_locales.<field>` (dizi içi), anahtar `_parent_id`+`_locale`. Kesin ad üretilen migration SQL'inden doğrulanır.
- Hedef alanların hepsi `localized: true` (korunur).
- Render: `pick(value, locale)` → `<RichContent value={...} />`. String prop alan paylaşılan bileşenler `React.ReactNode`'a açılır (string zaten geçerli ReactNode; mevcut çağrılar kırılmaz).
- seed.ts: bir richText alana düz string seed'lenen yer varsa `plainToLexical(...)` ile sarılır (Faz 2'de yapıldığı gibi).
- Her task ship-safe: RichContent hem string (mevcut/fallback) hem Lexical (migration sonrası) render eder → ara adımda kırık sayfa olmaz.
- Test: `npm test`, `npm run lint`, `npm run build`. Dev migrate: `npx payload migrate` (asılmamalı; >60sn = BLOCKED).

---

### Task 1: Faq.cevap → richText (full)

**Files:**
- Modify: `src/collections/Faq.ts` (`cevap`: textarea → richText, `editor: fullEditor`, `localized: true` korunur; `import { fullEditor } from '@/payload/lexical'`)
- Modify: `src/components/ui/Accordion.tsx` (`cevap` prop tipi `string` → `React.ReactNode`; `{it.cevap}` aynen render, ReactNode olduğu için RichContent düğümü de basar)
- Modify: `src/app/(site)/[locale]/sss/page.tsx` (Accordion `items`'ında `cevap: pick(...)` → `cevap: <RichContent value={pick(faq.cevap, loc)} className="prose prose-sm max-w-none dark:prose-invert" />`; local `Faq.cevap` tipini `{tr:unknown;en:unknown}`'a gevşet; RichContent import et). Fallback SSS içeriği (varsa) string kalabilir.
- Create: `src/migrations/<ts>_faq_cevap_richtext.ts` (üret + Faz-2 desenine göre uyarla; tablo `faq_locales`, kolon `cevap`)

**Interfaces:**
- Consumes: `fullEditor`, `RichContent`, `plainToLexical` (Faz 1)

- [ ] **Step 1: Faz-2 referans migration'ını oku** — `src/migrations/20260701_181840_referans_gorus_richtext.ts` (birebir izlenecek yapı).
- [ ] **Step 2: Faq.ts** — `cevap` alanını `type: 'richText', editor: fullEditor` yap (localized korunur), importu ekle.
- [ ] **Step 3: Accordion.tsx** — `items` tipini `{ soru: string; cevap: React.ReactNode }[]` yap. Render (`{it.cevap}`) değişmez. `Accordion.test.tsx` string cevap ile hâlâ geçmeli (string ⊂ ReactNode) — çalıştır: `npm test -- src/components/ui/Accordion.test.tsx`, PASS bekle.
- [ ] **Step 4: sss/page.tsx** — RichContent import; `items` map'inde `cevap`'ı `<RichContent value={pick(faq.cevap, loc)} className="prose prose-sm max-w-none dark:prose-invert" />` yap; local `Faq` arayüzünde `cevap` tipini `{ tr: unknown; en: unknown }` yap.
- [ ] **Step 5: migration üret + uyarla** — `npx payload migrate:create faq_cevap_richtext`; üretilen SQL'den `faq_locales.cevap` adını doğrula; `up()`'ı kapt→`ALTER ... TYPE jsonb USING NULL`→`plainToLexical` backfill olarak yeniden yaz (`import { plainToLexical } from '../lib/lexical/plainToLexical'`); `down()` jsonb→varchar.
- [ ] **Step 6: doğrula** — `npx tsc --noEmit && npm run lint` (0 error); `npx payload migrate` (dev, asılmadan; SSS'in cevabı olan satırlar Lexical'e taşınır); `npm test` (tam suite) + `npm run build` yeşil.
- [ ] **Step 7: Commit** — `git add src/collections/Faq.ts src/components/ui/Accordion.tsx "src/app/(site)/[locale]/sss/page.tsx" src/migrations/ src/payload-types.ts` + `git commit -m "feat: Faq.cevap richText'e çevrildi + migration"` (seed.ts Faq.cevap seed'liyorsa onu da plainToLexical'e sarıp ekle).

---

### Task 2: Product — aciklama (full) + ozellikler[].aciklama (lite)

**Files:**
- Modify: `src/collections/Product.ts` (`aciklama`: textarea→richText `editor: fullEditor`; `ozellikler[].aciklama`: textarea→richText `editor: liteEditor`; ikisi de `localized: true`; importlar)
- Modify: `src/components/sections/ProductFeatures.tsx` (`Feature.aciklama` tipi `{tr,en}` string → `unknown`; `const aciklama = pick(...)` satırını kaldırıp render'da `<RichContent value={pick(feature.aciklama, locale)} className="prose prose-sm max-w-none dark:prose-invert prose-p:my-0" />` kullan)
- Modify: `src/app/(site)/[locale]/yazilim/[urun]/page.tsx` (product `aciklama`'nın render edildiği yeri `<RichContent value={pick(data.aciklama, locale)} className="prose prose-neutral dark:prose-invert" />` yap; local `ProductData.aciklama` + `ozellikler[].aciklama` tiplerini `unknown`'a gevşet; RichContent import; FALLBACK sabitleri string kalır — RichContent işler)
- Create: `src/migrations/<ts>_product_richtext.ts` (iki alan: `product_locales.aciklama` + `product_ozellikler_locales.aciklama`)

**Interfaces:**
- Consumes: `liteEditor`, `fullEditor`, `RichContent`, `plainToLexical`

- [ ] **Step 1: referans migration + mevcut render'ı oku** — `20260701_181840_referans_gorus_richtext.ts` deseni; `yazilim/[urun]/page.tsx` içinde `data.aciklama`'nın nerede/nasıl render edildiğini bul (muhtemelen `<p>` veya "Ürün Hakkında" bloğu).
- [ ] **Step 2: Product.ts** — `aciklama` → richText+fullEditor; `ozellikler[].aciklama` → richText+liteEditor; importlar; `localized: true` korunur.
- [ ] **Step 3: ProductFeatures.tsx** — `Feature.aciklama` tipini gevşet; kart açıklamasını RichContent ile render et.
- [ ] **Step 4: yazilim/[urun]/page.tsx** — product `aciklama` render'ını RichContent'e çevir; local tipleri gevşet; RichContent import; ProductFeatures'a geçen `features` FALLBACK string açıklamaları RichContent'te sorunsuz (değişiklik gerekmez).
- [ ] **Step 5: migration üret + uyarla** — `npx payload migrate:create product_richtext`; üretilen SQL'den iki kolon adını doğrula (`product_locales.aciklama`, `product_ozellikler_locales.aciklama`); `up()`'ta HER İKİ kolon için kapt→ALTER→backfill (iki ayrı kapt/backfill bloğu, aynı transaction); `down()` iki kolonu varchar'a çevirir.
- [ ] **Step 6: doğrula** — `npx tsc --noEmit && npm run lint` (0 error); `npx payload migrate` (dev, asılmadan); `npm test` + `npm run build` yeşil.
- [ ] **Step 7: Commit** — ilgili dosyalar + migration + payload-types + (seed.ts product aciklama/ozellikler seed'liyorsa plainToLexical) → `git commit -m "feat: Product.aciklama + ozellikler richText'e çevrildi + migration"`.

---

### Task 3: Service — girisLead + girisParagraflar[] + altHizmetler[].aciklama + surec[].aciklama

**Files:**
- Modify: `src/collections/Service.ts` (`girisLead`: richText+liteEditor; `girisParagraflar[].paragraf`: richText+fullEditor; `altHizmetler[].aciklama`: richText+liteEditor; `surec[].aciklama`: richText+liteEditor; hepsi `localized: true`; importlar)
- Modify: `src/components/sections/page-blocks.tsx` (`IntroLead`, `FeatureCard`, `ProcessTimeline` bileşenlerinde `lead`/`description` string prop'larını `React.ReactNode`'a aç — string zaten geçerli ReactNode, mevcut çağrılar kırılmaz)
- Modify: `src/components/sections/ServiceDetail.tsx` (girisLead → IntroLead'e `<RichContent>`; girisParagraflar → her paragraf `<RichContent>`; altHizmetler[].aciklama → FeatureCard `description`'a `<RichContent>`; surec[].aciklama → ProcessTimeline `description`'a `<RichContent>`. Kod fallback'leri (`DANISMANLIK_FALLBACK`, mühendislik, `DANISMANLIK_SURECLER`) string kalabilir — RichContent işler. `data?.*` pick sonuçları RichContent'e `value` olarak geçer.)
- Create: `src/migrations/<ts>_service_richtext.ts` (dört alan: `service_locales.giris_lead`, `service_giris_paragraflar_locales.paragraf`, `service_alt_hizmetler_locales.aciklama`, `service_surec_locales.aciklama` — adlar üretilen SQL'den doğrulanır)

**Interfaces:**
- Consumes: `liteEditor`, `fullEditor`, `RichContent`, `plainToLexical`

- [ ] **Step 1: referans migration + ServiceDetail/page-blocks oku** — `20260701_181840_...ts` deseni; `page-blocks.tsx`'te IntroLead/FeatureCard/ProcessTimeline prop tipleri; ServiceDetail'de dört alanın render satırları (girisLead, girisParagraflar map, FeatureCard `description`, ProcessTimeline `description`).
- [ ] **Step 2: Service.ts** — dört alanı richText + uygun editör yap (girisLead/altHizmetler.aciklama/surec.aciklama = lite; girisParagraflar.paragraf = full); importlar; `localized: true` korunur.
- [ ] **Step 3: page-blocks.tsx** — IntroLead `lead`, FeatureCard `description`, ProcessTimeline `description` prop tiplerini `React.ReactNode` yap (render `{description}` aynen — ReactNode basar).
- [ ] **Step 4: ServiceDetail.tsx** — dört render sitesini `<RichContent value={pick(...)} />` ile besle (lead için inline prose, paragraflar için blok prose). Fallback string'ler RichContent'e value olarak verilir (dönüştürme gerekmez). Local tipleri (`LocaleString` alanları) gerektiğinde `unknown`'a gevşet.
- [ ] **Step 5: migration üret + uyarla** — `npx payload migrate:create service_richtext`; üretilen SQL'den DÖRT kolon/tablo adını doğrula; `up()`'ta her biri için kapt→ALTER→backfill (dört blok, aynı transaction); `down()` dördünü varchar'a çevirir.
- [ ] **Step 6: doğrula** — `npx tsc --noEmit && npm run lint` (0 error); `npx payload migrate` (dev, asılmadan); `npm test` + `npm run build` yeşil.
- [ ] **Step 7: Commit** — ilgili dosyalar + migration + payload-types + (seed.ts / seed-danismanlik.ts bu alanları seed'liyorsa plainToLexical'e sar — ÖNEMLİ: `seed-danismanlik.ts` altHizmetler/surec/giris'i düz string yazıyor → hepsini plainToLexical'e sarmak gerekir) → `git commit -m "feat: Service içerik alanları richText'e çevrildi + migration"`.

---

### Task 4: Faz 3-5 doğrulama + deploy

**Files:** (yok)

- [ ] **Step 1: tam suite** — `npm test && npm run lint && npm run build` → hepsi yeşil.
- [ ] **Step 2: preview** — dev'de SSS (cevap), bir ürün detayı (aciklama + özellik kartları), danışmanlık + mühendislik (giriş + kartlar + süreç) sayfalarında içerik RichContent ile render oluyor (TR+EN); `/admin`'de bir alanı zengin biçimle (kalın/liste) düzenleyip kaydet → sitede görün.
- [ ] **Step 3: deploy** — `git checkout main && git merge --no-ff <branch> -m "Merge: zengin içerik Faz 3-5 (Faq/Product/Service richText)"`; `git push origin main`. CI: build + `payload migrate` (üç migration sırayla; her biri kendi transaction'ında, hızlı olmalı). `gh run watch` ile izle.
- [ ] **Step 4: prod doğrulama** — üç migration `payload_migrations`'da kayıtlı; ilgili kolonlar jsonb + veri Lexical'e korunmuş; SSS/ürün/hizmet sayfaları 200 + render (TR+EN); bağlantı sağlıklı (`too many clients` yok); `/admin`'de bir alan zengin düzenlenebiliyor.

---

## Self-Review Notları
- **Spec kapsamı (Faz 3-5):** Faq.cevap (T1) ✓, Product.aciklama+ozellikler (T2) ✓, Service 4 alan (T3) ✓, hepsi lite/full doğru profil, migration veri-koruma + tek-transaction + raw SQL (Faz-2 deseni), render RichContent, deploy (T4) ✓.
- **Ship-safe:** her task RichContent kullanır (string+Lexical); paylaşılan bileşenler ReactNode'a açılır (mevcut string çağrılar kırılmaz); fallback'ler string kalır.
- **Migration güvenliği:** Faz-2'de prod'da kanıtlanan kapt→ALTER(USING NULL)→backfill deseni; ayrı bağlantı/`payload.*` yok → deadlock yok. Tablo/kolon adları üretilen SQL'den doğrulanır.
- **seed uyumu:** richText'e çevrilen alanları seed eden yerler (özellikle `seed-danismanlik.ts` Service alanları) `plainToLexical`'e sarılmalı, yoksa build tip hatası / prod'da bozuk veri.
- **Tip tutarlılığı:** RichContent `value: unknown`; tüm render siteleri `pick(...)` sonucunu value olarak geçer; paylaşılan bileşen prop'ları ReactNode.
