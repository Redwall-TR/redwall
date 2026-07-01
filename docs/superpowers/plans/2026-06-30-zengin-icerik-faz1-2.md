# Zengin İçerik — Faz 1 (Yapı Taşları) + Faz 2 (Referans Görüş) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zengin-içerik altyapısını (2 Lexical editör profili + `plainToLexical` + `<RichContent>`) kurmak ve ilk alan olarak `Referans.gorus.metin`'i düz metinden richText'e uçtan uca (şema + veri migration + render) taşımak.

**Architecture:** İki paylaşılan Lexical editör config'i (`lite`/`full`) Payload alanlarına `editor:` olarak verilir. Saf `plainToLexical`/`normalizeToLexical` yardımcıları düz metni Lexical state'e çevirir; `<RichContent>` bileşeni değeri (string VEYA Lexical) tek noktada render eder — böylece koddaki düz-string fallback'ler ve taşınmamış içerik çalışmaya devam eder. `Referans.gorus.metin` alanı richText'e çevrilir; migration mevcut metni **kapt-önce → tip-değiştir → geri-yaz** sırasıyla korur (`req` transaction içinde).

**Tech Stack:** Payload CMS 3.85 (`@payloadcms/richtext-lexical`), Next.js 16, Postgres, Vitest, TypeScript.

## Global Constraints

- Lint: `@typescript-eslint/no-explicit-any` ERROR → `as unknown as <T>` cast kullan.
- Migration backfill'de `payload`/raw SQL çağrılarında migration transaction'ı kullanılır; `payload` local API çağrısı yapılırsa **`req` MUTLAKA geçilir** (aksi halde ALTER kilidiyle deadlock).
- Lokalize alanlar `{ tr, en }`; render'da `pick(value, locale)`. Hedef alan `Referans.gorus.metin` `localized: true`.
- RichText render cast deseni: `data={x as unknown as Parameters<typeof RichText>[0]['data']}` (mevcut kullanım: blog/[slug], yasal/[slug]).
- next-intl `Link` from `@/i18n/navigation` (bu planda gerekmiyor ama genel kural).
- Test: `npm test` (vitest), `npm run lint`, `npm run build`.
- CMS okumaları `safe(fn, fallback)` ile sarılı kalır.

---

### Task 1: İki Lexical editör profili

**Files:**
- Create: `src/payload/lexical.ts`

**Interfaces:**
- Produces: `liteEditor` ve `fullEditor` (Payload `RichTextField['editor']` — `lexicalEditor(...)` dönüşü). Sonraki fazlarda `editor: liteEditor|fullEditor` olarak kullanılır.

- [ ] **Step 1: lexical.ts'i yaz**

```ts
// src/payload/lexical.ts
import {
  lexicalEditor,
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  LinkFeature,
  ParagraphFeature,
  UnorderedListFeature,
  OrderedListFeature,
  HeadingFeature,
  BlockquoteFeature,
  InlineToolbarFeature,
  FixedToolbarFeature,
} from '@payloadcms/richtext-lexical'

/** Kısa alanlar (kart/görüş/lead): paragraf + kalın/italik/altçizgi + link + liste. Başlık yok. */
export const liteEditor = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    LinkFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    InlineToolbarFeature(),
    FixedToolbarFeature(),
  ],
})

/** Uzun alanlar (SSS/giriş/ürün açıklaması): lite + h2/h3 başlık + alıntı. */
export const fullEditor = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    LinkFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    BlockquoteFeature(),
    InlineToolbarFeature(),
    FixedToolbarFeature(),
  ],
})
```

- [ ] **Step 2: Import adlarını + tip uyumunu doğrula (typecheck)**

Run: `npx tsc --noEmit`
Expected: 0 hata. (Bir feature import adı 3.85'te farklıysa hata verir → o feature'ı doğru isimle düzelt; feature listesi `node -e "import('@payloadcms/richtext-lexical').then(m=>console.log(Object.keys(m).filter(k=>/Feature$/.test(k))))"` ile listelenebilir.)

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: 0 error.

- [ ] **Step 4: Commit**

```bash
git add src/payload/lexical.ts
git commit -m "feat: iki Lexical editör profili (lite/full)"
```

---

### Task 2: plainToLexical + normalizeToLexical (saf yardımcılar)

**Files:**
- Create: `src/lib/lexical/plainToLexical.ts`
- Test: `src/lib/lexical/plainToLexical.test.ts`

**Interfaces:**
- Produces:
  - `type LexicalState = { root: { children: unknown[]; type: 'root'; version: 1; format: ''; indent: 0; direction: 'ltr' } }`
  - `plainToLexical(text: string | null | undefined): LexicalState`
  - `normalizeToLexical(value: unknown): LexicalState | null`

- [ ] **Step 1: Testi yaz (RED)**

```ts
// src/lib/lexical/plainToLexical.test.ts
import { describe, it, expect } from 'vitest'
import { plainToLexical, normalizeToLexical } from './plainToLexical'

describe('plainToLexical', () => {
  it('boş/whitespace → boş root', () => {
    expect(plainToLexical('').root.children).toEqual([])
    expect(plainToLexical('   ').root.children).toEqual([])
    expect(plainToLexical(null).root.children).toEqual([])
    expect(plainToLexical(undefined).root.children).toEqual([])
  })
  it('tek satır → tek paragraf, doğru metin', () => {
    const s = plainToLexical('Merhaba dünya')
    expect(s.root.children).toHaveLength(1)
    const p = s.root.children[0] as { type: string; children: { text: string }[] }
    expect(p.type).toBe('paragraph')
    expect(p.children[0].text).toBe('Merhaba dünya')
  })
  it('çok satır → satır başına paragraf, boş satırlar atlanır', () => {
    const s = plainToLexical('bir\n\niki\n')
    expect(s.root.children).toHaveLength(2)
  })
})

describe('normalizeToLexical', () => {
  it('null/undefined/boş string → null', () => {
    expect(normalizeToLexical(null)).toBeNull()
    expect(normalizeToLexical(undefined)).toBeNull()
    expect(normalizeToLexical('   ')).toBeNull()
  })
  it('dolu string → Lexical state (paragraf)', () => {
    const s = normalizeToLexical('selam')
    expect(s?.root.children).toHaveLength(1)
  })
  it('zaten Lexical (root olan obje) → aynen döner', () => {
    const existing = plainToLexical('x')
    expect(normalizeToLexical(existing)).toBe(existing)
  })
  it('root.children boş olan Lexical → null (render edilecek şey yok)', () => {
    expect(normalizeToLexical(plainToLexical(''))).toBeNull()
  })
})
```

- [ ] **Step 2: Testi çalıştır (fail)**

Run: `npm test -- src/lib/lexical/plainToLexical.test.ts`
Expected: FAIL (modül yok).

- [ ] **Step 3: Implementasyon**

```ts
// src/lib/lexical/plainToLexical.ts
export type LexicalState = {
  root: {
    children: unknown[]
    type: 'root'
    version: 1
    format: ''
    indent: 0
    direction: 'ltr'
  }
}

function textParagraph(text: string) {
  return {
    type: 'paragraph',
    version: 1,
    format: '',
    indent: 0,
    direction: 'ltr' as const,
    textFormat: 0,
    textStyle: '',
    children: [
      { type: 'text', version: 1, detail: 0, format: 0, mode: 'normal', style: '', text },
    ],
  }
}

/** Düz metni (satır başına bir paragraf) Lexical editor state'ine çevirir. */
export function plainToLexical(text: string | null | undefined): LexicalState {
  const paras = (text ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  return {
    root: {
      children: paras.map(textParagraph),
      type: 'root',
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr',
    },
  }
}

/**
 * Render/backfill için değeri normalize eder:
 * - null/undefined/boş string → null
 * - dolu string → plainToLexical
 * - Lexical state (root'lu obje) → aynen (children boşsa null)
 */
export function normalizeToLexical(value: unknown): LexicalState | null {
  if (value == null) return null
  if (typeof value === 'string') {
    const s = plainToLexical(value)
    return s.root.children.length > 0 ? s : null
  }
  if (typeof value === 'object' && 'root' in (value as Record<string, unknown>)) {
    const st = value as LexicalState
    return st.root?.children?.length ? st : null
  }
  return null
}
```

- [ ] **Step 4: Testi çalıştır (pass)**

Run: `npm test -- src/lib/lexical/plainToLexical.test.ts`
Expected: PASS. Sonra `npm test` (tüm suite) yeşil.

- [ ] **Step 5: Commit**

```bash
git add src/lib/lexical/plainToLexical.ts src/lib/lexical/plainToLexical.test.ts
git commit -m "feat: plainToLexical + normalizeToLexical yardımcıları"
```

---

### Task 3: RichContent render bileşeni

**Files:**
- Create: `src/components/ui/RichContent.tsx`
- Modify: `src/components/ui/index.ts` (varsa barrel export — yoksa bu satırı atla)

**Interfaces:**
- Consumes: `normalizeToLexical` (Task 2)
- Produces: `<RichContent value={unknown} className?: string />` — değer string veya Lexical olabilir; boşsa `null` render eder.

- [ ] **Step 1: Bileşeni yaz**

```tsx
// src/components/ui/RichContent.tsx
import { RichText } from '@payloadcms/richtext-lexical/react';
import { normalizeToLexical } from '@/lib/lexical/plainToLexical';

/**
 * İçeriği (Lexical state VEYA düz string) tek noktada render eder.
 * Düz string gelirse paragrafa sarılır (koddaki fallback'ler ve henüz
 * taşınmamış içerik çalışmaya devam eder). Boş/null → hiçbir şey render etmez.
 */
export function RichContent({ value, className }: { value: unknown; className?: string }) {
  const data = normalizeToLexical(value);
  if (!data) return null;
  return (
    <div className={className}>
      <RichText data={data as unknown as Parameters<typeof RichText>[0]['data']} />
    </div>
  );
}
```

- [ ] **Step 2: Barrel export (yalnızca `src/components/ui/index.ts` varsa)**

`src/components/ui/index.ts` mevcutsa şu satırı ekle (yoksa bu adımı atla, importlar doğrudan dosyadan yapılır):

```ts
export { RichContent } from './RichContent';
```

Kontrol: `test -f src/components/ui/index.ts && grep -q "RichContent" src/components/ui/index.ts && echo eklendi`

- [ ] **Step 3: Typecheck + lint + build**

Run: `npx tsc --noEmit && npm run lint`
Expected: 0 error.
Run: `npm run build`
Expected: başarılı (RichContent import çözülür).

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/RichContent.tsx src/components/ui/index.ts
git commit -m "feat: RichContent bileşeni (string veya Lexical render eder)"
```

---

### Task 4: Görüş metnini RichContent ile render et (render-önce, ship-safe)

**Files:**
- Modify: `src/app/(site)/[locale]/referanslar/page.tsx` (~satır 126, 148)
- Modify: `src/app/(site)/[locale]/referanslar/[slug]/page.tsx` (~satır 71, 105-136)

**Interfaces:**
- Consumes: `RichContent` (Task 3)

Bu task veri hâlâ düz string iken uygulanır; `RichContent` string'i sarıp render ettiği için güvenli, migration'dan (Task 5) önce de sonra da çalışır.

- [ ] **Step 1: Liste sayfası (`referanslar/page.tsx`) görüş bloğunu güncelle**

Importlara ekle (dosyanın üstündeki importlarla birlikte):

```tsx
import { RichContent } from '@/components/ui/RichContent';
```

`const metin = pick(ref.gorus!.metin, loc) ?? '';` satırını KALDIR ve `<blockquote>` içeriğini değiştir. Mevcut:

```tsx
                  <blockquote className="relative flex-1 text-base leading-relaxed text-foreground/80">
                    &ldquo;{metin}&rdquo;
                  </blockquote>
```

Yeni (metin değişkeni yerine doğrudan pick + RichContent; dekoratif tırnaklar kalkar, RichText paragraf üretir):

```tsx
                  <blockquote className="relative flex-1 text-base leading-relaxed text-foreground/80">
                    <RichContent value={pick(ref.gorus!.metin, loc)} className="prose prose-sm max-w-none dark:prose-invert prose-p:my-0" />
                  </blockquote>
```

> Not: `metin` değişkeni artık kullanılmıyorsa tanımını sil (lint unused-var). `unvan` aynen kalır.

- [ ] **Step 2: Detay sayfası (`referanslar/[slug]/page.tsx`) görüş figürünü güncelle**

Importlara ekle:

```tsx
import { RichContent } from '@/components/ui/RichContent';
```

`const gorusMetin = data.gorus?.metin ? pick(data.gorus.metin, locale) ?? '' : '';` satırını şununla değiştir (Lexical değeri normalize etmeden koşul için ham değeri tut):

```tsx
  const gorusMetinRaw = data.gorus?.metin ?? null;
```

Render koşulunu ve blockquote'u güncelle. Mevcut:

```tsx
      {gorusMetin && (
        <Section>
          <figure ...>
            ...
            <blockquote className="relative text-base leading-relaxed text-foreground/80">
              &ldquo;{gorusMetin}&rdquo;
            </blockquote>
```

Yeni:

```tsx
      {gorusMetinRaw && (
        <Section>
          <figure ...>
            ...
            <blockquote className="relative text-base leading-relaxed text-foreground/80">
              <RichContent value={pick(gorusMetinRaw as Record<'tr'|'en', unknown>, locale)} className="prose prose-sm max-w-none dark:prose-invert prose-p:my-0" />
            </blockquote>
```

> `ReferenceData` arayüzündeki `gorus.metin` tipi `{ tr: string; en: string }` → migration sonrası Lexical objesi de olabilir; tipi `{ tr: unknown; en: unknown }` olarak gevşet (bu dosyadaki local arayüzde). `pick` çağrısı için cast yeterli.

- [ ] **Step 3: Typecheck + lint + build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: 0 error; build OK.

- [ ] **Step 4: Preview doğrulama (veri hâlâ düz metin)**

`preview_start` → `/tr/referanslar` ve görüşü olan bir referansın `/tr/referanslar/<slug>` sayfasında görüş metni hâlâ görünür (RichContent düz string'i paragraf olarak render eder). Konsol/network hatası yok.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(site)/[locale]/referanslar/page.tsx" "src/app/(site)/[locale]/referanslar/[slug]/page.tsx"
git commit -m "refactor: referans görüşünü RichContent ile render et (string+Lexical uyumlu)"
```

---

### Task 5: Referans.gorus.metin → richText + migration (kapt→tip-değiştir→geri-yaz)

**Files:**
- Modify: `src/collections/Referans.ts`
- Create: `src/migrations/<timestamp>_referans_gorus_richtext.ts` (Payload üretir, elle uyarlanır)

**Interfaces:**
- Consumes: `liteEditor` (Task 1), `plainToLexical` (Task 2)

- [ ] **Step 1: Alanı richText yap**

`src/collections/Referans.ts`: en üste import ekle:

```ts
import { liteEditor } from '@/payload/lexical'
```

`gorus` grubundaki `metin` alanını değiştir. Mevcut:

```ts
        { name: 'metin', type: 'textarea', localized: true },
```

Yeni:

```ts
        { name: 'metin', type: 'richText', editor: liteEditor, localized: true },
```

- [ ] **Step 2: Migration üret**

Run: `npx payload migrate:create referans_gorus_richtext`
Expected: `src/migrations/` altında yeni dosya; `up()` içinde `referans_locales.gorus_metin` (lokalize group subfield'ı) için tip değişimi ifadesi.

- [ ] **Step 3: Gerçek tablo/kolon adını doğrula**

Run: `docker`'sız yerelde — dev DB'ye bak (Payload dev push). Şu komutla lokalize kolonu doğrula:
`npx payload migrate:status` çıktısını gör; kolon adını kesinleştirmek için üretilen migration dosyasındaki `ALTER TABLE ... "gorus_metin"` ifadesini oku. Beklenen tablo: `referans_locales`, kolon: `gorus_metin`, anahtarlar: `_parent_id`, `_locale`. Farklıysa aşağıdaki SQL'de bu adları kullan.

- [ ] **Step 4: up()'ı kapt→tip-değiştir→geri-yaz olarak yeniden yaz**

Üretilen tip-değişim ifadesi eski `varchar` veriyi `jsonb`'a güvenli taşıyamaz (düz metin geçerli JSON değil). Bu yüzden **ALTER'dan ÖNCE ham SQL ile eski değerleri oku**, sonra tipi değiştir, sonra Lexical JSON yaz. Dosyanın başına import ekle:

```ts
import { plainToLexical } from '../lib/lexical/plainToLexical'
```

`up({ db, payload, req })` gövdesini şu yapıya getir (üretilen ALTER ifadesini 2. adımdaki gerçek koluna göre yerleştir):

```ts
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // 1) ALTER'dan önce eski düz-metin değerleri yakala (varchar olarak)
  const existing = await db.execute(sql`
    SELECT "_parent_id" AS id, "_locale" AS locale, "gorus_metin" AS metin
    FROM "referans_locales"
    WHERE "gorus_metin" IS NOT NULL AND "gorus_metin" <> ''
  `)
  const rows = (existing.rows ?? existing) as unknown as { id: number; locale: string; metin: string }[]

  // 2) Kolon tipini jsonb'a çevir (Payload üretimi; USING ile veri düşürülür, veriyi 1'de yakaladık)
  await db.execute(sql`ALTER TABLE "referans_locales" ALTER COLUMN "gorus_metin" TYPE jsonb USING NULL;`)

  // 3) Yakalanan düz metni Lexical JSON olarak geri yaz
  for (const r of rows) {
    const lex = JSON.stringify(plainToLexical(r.metin))
    await db.execute(sql`
      UPDATE "referans_locales"
      SET "gorus_metin" = ${lex}::jsonb
      WHERE "_parent_id" = ${r.id} AND "_locale" = ${r.locale}
    `)
  }
}
```

> `payload` kullanılmıyorsa imzada bırakılır (lint uyarısı zararsız, mevcut migration deseniyle tutarlı). `req` bu migration'da raw SQL kullandığı için gerekmez — tüm işlemler aynı `db` (transaction) üzerinde.

- [ ] **Step 5: down()'ı yaz**

```ts
export async function down({ db }: MigrateDownArgs): Promise<void> {
  // jsonb → varchar (Lexical'den düz metne dönüş yapılmaz; boşaltılır)
  await db.execute(sql`ALTER TABLE "referans_locales" ALTER COLUMN "gorus_metin" TYPE varchar USING NULL;`)
}
```

- [ ] **Step 6: Lint + dev'de uygula/doğrula**

Run: `npm run lint`
Expected: 0 error.

Dev DB'de migration'ı çalıştır (dev'de push yerine migrate ile kolon tipini değiştirmek için):
Run: `npx payload migrate`
Expected: `Migrating: ..._referans_gorus_richtext` başarılı, hata yok.

> Eğer dev push modu kolonu zaten jsonb'a çevirdiyse (veri kaybıyla), migration idempotent değildir; o durumda dev DB'de görüşü olan referansın `gorus.metin`'i `/admin`'den yeniden girilir. Prod'da migrate temiz çalışır (kolon henüz varchar).

- [ ] **Step 7: Preview doğrulama (veri artık Lexical)**

`preview` dev sunucusunu yeniden başlat. Görüşü olan referansın `/tr/referanslar/<slug>` ve `/tr/referanslar` sayfalarında görüş metni RichContent ile render olur (artık Lexical). `/admin`'de referans görüşünü aç → zengin editör (kalın/italik/link/liste) görünür; bir kelimeyi kalın yapıp kaydet → sitede kalın görünür. TR + EN.

- [ ] **Step 8: Commit**

```bash
git add src/collections/Referans.ts src/migrations/
git commit -m "feat: Referans.gorus.metin richText'e çevrildi + migration"
```

---

### Task 6: Faz 1+2 doğrulama + deploy

**Files:** (yok — doğrulama + deploy)

- [ ] **Step 1: Tam suite**

Run: `npm test && npm run lint && npm run build`
Expected: tüm testler PASS, 0 lint error, build OK.

- [ ] **Step 2: Branch → main + deploy**

```bash
git checkout main && git merge --no-ff <branch> -m "Merge: zengin içerik Faz 1-2 (yapı taşları + Referans görüş)"
git push origin main
```

CI: build + `payload migrate` (referans_gorus_richtext prod'da çalışır — kolon varchar→jsonb + backfill). `gh run watch` ile izle. **Migrate adımı saniyeler sürmeli**; asılırsa logu incele.

- [ ] **Step 3: Prod doğrulama**

- Prod migration kaydı: `payload_migrations` içinde `..._referans_gorus_richtext`.
- `redwall.tr/admin` → bir referansın görüşünü zengin editörle düzenle (kalın/liste) → kaydet.
- `https://redwall.tr/tr/referanslar` ve görüşlü referansın detay sayfasında görüş doğru render (TR+EN).
- Bağlantı sağlığı (`too many clients` yok), diğer sayfalar 200.

---

## Sonraki fazlar (ayrı planlar)
Bu plan Faz 1-2'yi kapsar. Onaylanan spec'e göre sonraki fazlar kendi planlarıyla:
- **Faz 3:** `Faq.cevap` (fullEditor) — tekil lokalize alan.
- **Faz 4:** `Product.aciklama` (full) + `Product.ozellikler[].aciklama` (lite, lokalize dizi).
- **Faz 5:** `Service` — `girisLead` (lite), `girisParagraflar[].paragraf` (full), `altHizmetler[].aciklama` (lite), `surec[].aciklama` (lite) — lokalize diziler, en karmaşık. ServiceDetail fallback'leri RichContent sayesinde string kalabilir.

## Self-Review Notları
- **Spec kapsamı (Faz 1-2):** 2 editör profili (T1) ✓, plainToLexical/normalizeToLexical (T2) ✓, RichContent string+Lexical (T3) ✓, gorus.metin schema+migration+backfill+req/transaction (T5) ✓, render (T4) ✓, doğrulama+deploy (T6) ✓.
- **Ship-safe sıralama:** render-önce (T4) → şema (T5); RichContent her iki veri tipini işlediği için hiçbir ara adımda kırık sayfa olmaz.
- **Tip tutarlılığı:** `plainToLexical`/`normalizeToLexical` imzaları T2↔T3↔T5 arasında tutarlı; `liteEditor` T1↔T5.
- **Migration veri güvenliği:** düz metin geçerli JSON olmadığı için ALTER veriyi düşürür → değerler ALTER'dan ÖNCE yakalanıp Lexical JSON olarak geri yazılır. Tablo/kolon adları 2-3. adımda doğrulanır.
