# İçerik Genişliği + Kurumsal richText + Tablo Desteği Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** (A) Uzun-metin içerik gövdelerini tam sayfa genişliğine açmak; (B) kurumsal `Page` alanlarını richText yapmak; (C) tüm Lexical editörlerine tablo + Word/web yapıştırma desteği eklemek.

**Architecture:** A = CSS (max-w-3xl kaldır). B = mevcut zengin-içerik deseni (alan→richText, PageContent render `<RichContent>`, veri-koruyan migration). C = config-seviye `lexicalEditor()`'a `EXPERIMENTAL_TableFeature()` (tüm alanlar miras alır) + render/paste doğrulama.

**Tech Stack:** Payload 3.85 (`@payloadcms/richtext-lexical`), Next.js 16, Postgres, TypeScript, Vitest.

## Global Constraints

- Lint: `@typescript-eslint/no-explicit-any` ERROR → `as unknown as <T>` / `unknown`.
- Altyapı MEVCUT (yeniden yazma): `@/components/ui/RichContent`, `@/lib/lexical/plainToLexical` (`plainToLexical`, `normalizeToLexical`). Migration deseni: `src/migrations/20260701_193609_service_richtext.ts` (referans — birebir izle).
- **B migration ZORUNLU desen:** her alan `up()`: (1) ALTER'dan ÖNCE ham `SELECT` ile eski değerleri yakala; (2) `ALTER COLUMN ... TYPE jsonb USING NULL`; (3) `plainToLexical(text)` JSON'u ile ham `UPDATE`. Hepsi migration'ın kendi `db`'sinde (tek transaction), raw SQL, `payload.*` YOK. Dizi-locale tablolarında `_parent_id` varchar olabilir → capture tipi ona göre. Tablo/kolon adları üretilen SQL'den doğrulanır.
- Lokalize alanlar `pick(value, locale)` → `<RichContent value={...} />`. Alan-seviye `editor` prop VERİLMEZ (config default'u kullansın → tablo da gelsin).
- Fazlar bağımsız; her biri `npx tsc --noEmit && npm run lint && npm run build` yeşil olmalı. Dev migrate `npx payload migrate` asılmamalı (>60sn = BLOCKED).
- Bu işte yeni birim-test edilebilir saf mantık yok (CSS/wiring/config); doğrulama build + preview (gözlem).

---

### Task 1 (Faz A): İçerik gövdelerini tam genişliğe aç

**Files:**
- Modify: `src/app/(site)/[locale]/blog/[slug]/page.tsx:139`
- Modify: `src/app/(site)/[locale]/yazilim/[urun]/page.tsx:446`
- Modify: `src/app/(site)/[locale]/projeler/[slug]/page.tsx:220`
- Modify: `src/components/sections/RichPageView.tsx:81,83`

**Interfaces:** (yok — CSS)

- [ ] **Step 1: blog detay** — `blog/[slug]/page.tsx` içindeki
  `<div className="mx-auto max-w-3xl prose prose-neutral dark:prose-invert">` →
  `<div className="prose prose-neutral dark:prose-invert max-w-none">`

- [ ] **Step 2: ürün açıklaması** — `yazilim/[urun]/page.tsx` içindeki
  `<RichContent value={aciklama} className="prose prose-neutral dark:prose-invert mx-auto max-w-3xl" />` →
  `<RichContent value={aciklama} className="prose prose-neutral dark:prose-invert max-w-none" />`

- [ ] **Step 3: proje "Proje Hakkında"** — `projeler/[slug]/page.tsx` içindeki
  `<div className="max-w-3xl prose prose-neutral dark:prose-invert">` →
  `<div className="prose prose-neutral dark:prose-invert max-w-none">`

- [ ] **Step 4: RichPageView (yasal/RichPage)** — `RichPageView.tsx`: satır 81 sarmalayıcı
  `<div className="max-w-3xl space-y-6">` → `<div className="space-y-6">`; satır 83'teki
  `<div className="prose prose-neutral dark:prose-invert">` → `<div className="prose prose-neutral dark:prose-invert max-w-none">`

- [ ] **Step 5: doğrula** — `npx tsc --noEmit && npm run lint && npm run build` (0 error, build OK).
  Preview: `/tr/projeler/<slug>`, bir blog, bir `/yasal/<slug>`, `/tr/yazilim/yanginpro` → içerik gövdesi
  tam genişlikte (max-w-3xl dar sütun yok), 200.

- [ ] **Step 6: Commit**
```bash
git add "src/app/(site)/[locale]/blog/[slug]/page.tsx" "src/app/(site)/[locale]/yazilim/[urun]/page.tsx" "src/app/(site)/[locale]/projeler/[slug]/page.tsx" src/components/sections/RichPageView.tsx
git commit -m "fix: içerik gövdelerini tam sayfa genişliğine aç (max-w-3xl kaldırıldı)"
```

---

### Task 2 (Faz B): Kurumsal Page alanları → richText

**Files:**
- Modify: `src/collections/Page.ts` (5 alan textarea→richText)
- Modify: `src/components/sections/PageContent.tsx` (render → RichContent)
- Create: `src/migrations/<ts>_page_richtext.ts`
- Modify: `src/payload/seed.ts` (Page bu alanları seed'liyorsa plainToLexical'e sar)

**Interfaces:**
- Consumes: `RichContent`, `plainToLexical` (mevcut)

- [ ] **Step 1: referans migration'ı oku** — `src/migrations/20260701_193609_service_richtext.ts` (4-alan, capture→ALTER→backfill deseni; birebir izlenecek).

- [ ] **Step 2: Page.ts alanlarını richText yap** — `src/collections/Page.ts`:
  `girisLead` (satır ~47), `girisParagraflar[].paragraf` (~58), `vizyonMetin` (~73), `misyonMetin` (~85),
  `kartlar[].aciklama` (~127) alanlarında `type: 'textarea'` → `type: 'richText'` (her birinde `localized: true`
  KORUNUR, `editor` prop EKLENMEZ). Diğer alanlar (baslik, chips, kartlarAciklama vb.) DEĞİŞMEZ.

- [ ] **Step 3: PageContent render'ı RichContent'e çevir** — `src/components/sections/PageContent.tsx`:
  - RichContent import et: `import { RichContent } from '@/components/ui/RichContent';`
  - Local `PageData` arayüzünde 5 alanı gevşet: `girisLead?: unknown; girisParagraflar?: unknown[]; vizyonMetin?: unknown; misyonMetin?: unknown;` ve `PageCard.aciklama?: unknown;`.
  - vizyonMetin (`<p className="mt-5 text-base leading-relaxed text-muted">{p(data.vizyonMetin)}</p>`) →
    `<div className="mt-5 text-base leading-relaxed text-muted"><RichContent value={pick(data.vizyonMetin as Record<'tr'|'en',unknown>, locale)} className="prose prose-sm max-w-none dark:prose-invert prose-p:my-0" /></div>`
  - misyonMetin: aynı desen (`data.misyonMetin`).
  - IntroLead (girisLead + girisParagraflar): `lead={p(data.girisLead) ?? ''}` → `lead={<RichContent value={pick(data.girisLead as Record<'tr'|'en',unknown>, locale)} />}`; `body={(data.girisParagraflar ?? []).map((x) => p(x) ?? '')}` → `body={(data.girisParagraflar ?? []).map((x, i) => <RichContent key={i} value={pick(x as Record<'tr'|'en',unknown>, locale)} />)}`.
  - FeatureCard kartlar (`{data.kartlar!.map((k,i) => <FeatureCard ... description={p(k.aciklama)} .../>)}`): `description={<RichContent value={pick(k.aciklama as Record<'tr'|'en',unknown>, locale)} />}`.
  - `hasGiris` koşulu (`!!data.girisLead`) çalışmaya devam eder (obje truthy). Fallback (koddaki `p(...) ?? ''`) düz string kaldığında RichContent yine işler.

- [ ] **Step 4: migration üret + uyarla** — `npx payload migrate:create page_richtext`; üretilen SQL'den 5
  kolon/tablo adını doğrula (beklenen: `page_locales.giris_lead`, `page_giris_paragraflar_locales.paragraf`,
  `page_locales.vizyon_metin`, `page_locales.misyon_metin`, `page_kartlar_locales.aciklama`). `up()`'ı 5 blok
  capture→`ALTER ... TYPE jsonb USING NULL`→`plainToLexical` backfill olarak yeniden yaz (`import { plainToLexical } from '../lib/lexical/plainToLexical'`); dizi tablolarında `_parent_id` tipini `\d`/SQL'e göre ayarla; `down()` 5 kolonu varchar'a çevirir.

- [ ] **Step 5: seed** — `src/payload/seed.ts` Page için bu 5 alanı seed'liyorsa değerleri `plainToLexical(...)`'e sar (build tip hatası + prod bozuk veri olmasın). Seed'lemiyorsa atla.

- [ ] **Step 6: doğrula** — `npx tsc --noEmit && npm run lint` (0 error); `npx payload migrate` (dev, asılmadan, `y` gerekirse); `npm test` + `npm run build` yeşil. Preview: `/tr/kurumsal/hakkimizda`, `/vizyon-misyon`, `/kalite-belgeler` içerik RichContent ile render (TR+EN); `/admin`'de bir Page alanı zengin düzenlenebilir.

- [ ] **Step 7: Commit**
```bash
git add src/collections/Page.ts src/components/sections/PageContent.tsx src/migrations/ src/payload-types.ts src/payload/seed.ts
git commit -m "feat: kurumsal Page içerik alanları richText'e çevrildi + migration"
```

---

### Task 3 (Faz C): Tüm editörlere tablo desteği + Word/web yapıştırma

**Files:**
- Modify: `payload.config.ts` (lexicalEditor + EXPERIMENTAL_TableFeature)
- Modify: `src/components/ui/RichContent.tsx` (gerekirse tablo jsxConverters) + tablo CSS (`src/app/globals.css` veya prose)

**Interfaces:** (yok)

- [ ] **Step 1: config'e tablo feature ekle** — `payload.config.ts`: importa `EXPERIMENTAL_TableFeature` ekle
  (`import { lexicalEditor, EXPERIMENTAL_TableFeature } from '@payloadcms/richtext-lexical'`); `editor: lexicalEditor()` →
```ts
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [...defaultFeatures, EXPERIMENTAL_TableFeature()],
  }),
```

- [ ] **Step 2: build + admin editör kontrolü** — `npx tsc --noEmit && npm run lint && npm run build` (0 error).
  Preview başlat; `/admin`'de bir richText alanı aç → toolbar'da **tablo ekle** aracı görünmeli. Bir tablo ekle + kaydet.

- [ ] **Step 3: site render'ı doğrula + gerekirse converter ekle** — kaydettiğin tabloyu içeren sayfayı preview'da aç.
  Tablo düzgün `<table>` olarak render oluyorsa EK İŞ YOK. Render OLMUYORSA (boş/ham), `RichContent.tsx`'e Payload'ın
  `RichText` `converters` prop'una tablo düğümü converter'ları ekle (Payload'ın `@payloadcms/richtext-lexical/react`
  varsayılan converter'larıyla birleştirerek — dokümandaki `converters={({ defaultConverters }) => ({ ...defaultConverters, ...tableConverters })}` deseni) ve tablo için global CSS (border-collapse, hücre border/padding, başlık kalın). Kesin ihtiyaç bu adımda gözlemle belirlenir; converter eklenirse `RichContent` API'si değişmez (yalnız iç converters).

- [ ] **Step 4: Word/web yapıştırma testi** — Preview `/admin` editöründe bir richText alanına **Word'den (veya
  başka bir web sayfasından) tablo içeren metin yapıştır**. Tablo Lexical tablosuna dönüşmeli. Dönüşmüyorsa/eksikse
  raporla (feature/converter ayarı ile giderilir; experimental → bu adım gerçek içerikle doğrulanır).

- [ ] **Step 5: doğrula (tam)** — `npx tsc --noEmit && npm run lint && npm run build` (0 error); `npm test` yeşil.
  Preview: editörde tablo aracı + eklenen tablo sitede doğru render + Word yapıştırma çalışıyor (TR+EN bir sayfada).

- [ ] **Step 6: Commit**
```bash
git add payload.config.ts src/components/ui/RichContent.tsx src/app/globals.css src/app/(payload)/admin/importMap.js
git commit -m "feat: tüm Lexical editörlerine tablo desteği (EXPERIMENTAL_TableFeature) + render/paste"
```

---

### Task 4: Doğrulama + deploy

**Files:** (yok)

- [ ] **Step 1: tam suite** — `npm test && npm run lint && npm run build` → PASS, 0 error, build OK.
- [ ] **Step 2: preview uçtan uca** — genişlik (blog/proje/yasal/ürün tam genişlik), kurumsal 3 sayfa richText render (TR+EN), /admin'de tablo ekleme + Word yapıştırma çalışıyor.
- [ ] **Step 3: deploy** — `git checkout main && git merge --no-ff <branch> -m "Merge: içerik genişliği + kurumsal richText + tablo"`; `git push origin main`. CI: build + `payload migrate` (page_richtext; capture→alter→backfill, hızlı). `gh run watch`.
- [ ] **Step 4: prod doğrulama** — page_richtext migration kayıtlı + Page kolonları jsonb + veri Lexical'e korundu; kurumsal 3 sayfa 200 + render; içerik gövdeleri tam genişlik; `/admin`'de tablo aracı görünür; bağlantı sağlıklı; diğer sayfalar 200.

---

## Self-Review Notları
- **Spec kapsamı:** A genişlik 4 nokta (T1) ✓; B Page 5 alan richText + render + migration + seed (T2) ✓; C config tablo + render/paste (T3) ✓; deploy (T4) ✓.
- **Ship-safe:** B render `<RichContent>` (string+Lexical); PageContent fallback string'leri çalışır. C şema değişmez (migration yok), tablo düğümleri jsonb'da.
- **Migration güvenliği:** B, Faz-5 (service_richtext) deseninin aynısı — tek-transaction, raw SQL, `payload.*`/ayrı-bağlantı yok → deadlock yok. Tablo/kolon adları üretilen SQL'den doğrulanır.
- **C experimental riski:** render converter + Word-paste gerçek preview testiyle doğrulanır; eksik çıkarsa T3 içinde giderilir, A/B'yi etkilemez.
- **Tip tutarlılığı:** RichContent `value: unknown`; PageContent 5 alan `unknown`'a gevşetilir; IntroLead/FeatureCard prop'ları ReactNode (önceki işte açıldı).
