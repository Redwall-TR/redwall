# Referans Detay + Projeler↔Referanslar İlişkisi — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Referanslara tıklanınca o referansla yapılan projeleri gösteren detay sayfası eklemek ve projeleri referanslara (opsiyonel ilişki) bağlayıp iki yönlü gezinme sağlamak.

**Architecture:** Payload'a Referans.slug (ad'dan otomatik) + Project.referans (opsiyonel relationship) eklenir. CMS adaptör katmanına (src/lib/cms/queries.ts) yeni okuyucular eklenir. Yeni dinamik sayfa `/referanslar/[slug]`; referanslar listesi ilişkili projesi olan logoları linkler; proje detayı müşteriyi referansa linkler. Şema değişikliği Payload migration + idempotent slug backfill ile prod'a taşınır.

**Tech Stack:** Next.js 16 (App Router, force-dynamic), Payload 3.85 (Postgres), next-intl, Vitest, TypeScript.

## Global Constraints

- Lint: `@typescript-eslint/no-explicit-any` ERROR → `as unknown as Record<string, unknown>` cast kullan.
- CMS okuyan route'larda `export const dynamic = 'force-dynamic'` zorunlu (Payload `headers()` okur → statik üretim DYNAMIC_SERVER_USAGE verir).
- Tüm CMS okumaları `safe(fn, fallback)` (src/lib/cms/client.ts) ile sarılır.
- Adaptörler `locale: 'all'`, `depth: 2` ile okur; lokalize alanlar `{ tr, en }` döner; sayfada `pick(value, locale)` ile seçilir.
- next-intl link: `import { Link } from '@/i18n/navigation'` (yerel `<a>` değil).
- Türkçe karakter dönüşümü: ı→i, İ→i, ş→s, ğ→g, ç→c, ö→o, ü→u.
- Mevcut projeler referansa **elle /admin'den** bağlanır; `musteri` metninden otomatik eşleştirme yapılmaz.
- Test komutları: `npm test` (vitest), `npm run lint`, `npm run build`.

---

### Task 1: Türkçe slugify + benzersiz slug yardımcıları

**Files:**
- Create: `src/lib/slug.ts`
- Test: `src/lib/slug.test.ts`

**Interfaces:**
- Produces:
  - `slugify(input: string): string`
  - `buildUniqueSlugs<T extends { ad: string; slug?: string | null }>(items: T[]): { item: T; slug: string }[]`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/slug.test.ts
import { describe, it, expect } from 'vitest'
import { slugify, buildUniqueSlugs } from './slug'

describe('slugify', () => {
  it('Türkçe karakterleri ASCII slug yapar', () => {
    expect(slugify('Şişli Ağır Çelik İnşaat')).toBe('sisli-agir-celik-insaat')
  })
  it('boşluk ve sembolleri tek tireye indirger, baş/son tireyi kırpar', () => {
    expect(slugify('  Redwall   &  Co.  ')).toBe('redwall-co')
  })
  it('İ ve ı harflerini i yapar', () => {
    expect(slugify('İLKER ışık')).toBe('ilker-isik')
  })
  it('boş girdi için boş döner', () => {
    expect(slugify('')).toBe('')
  })
})

describe('buildUniqueSlugs', () => {
  it('mevcut slugu korur, boş olanı ad’dan üretir', () => {
    const out = buildUniqueSlugs([
      { ad: 'Acme', slug: 'acme-custom' },
      { ad: 'Beta A.Ş.', slug: null },
    ])
    expect(out.map((o) => o.slug)).toEqual(['acme-custom', 'beta-a-s'])
  })
  it('çakışan sluglara sonek ekler', () => {
    const out = buildUniqueSlugs([
      { ad: 'Çelik', slug: null },
      { ad: 'Celik', slug: null },
    ])
    expect(out.map((o) => o.slug)).toEqual(['celik', 'celik-2'])
  })
  it('slugify boş dönerse referans tabanını kullanır', () => {
    const out = buildUniqueSlugs([{ ad: '!!!', slug: null }])
    expect(out[0].slug).toBe('referans')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/slug.test.ts`
Expected: FAIL ("Cannot find module './slug'" / export yok).

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/slug.ts
const TR_MAP: Record<string, string> = {
  ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', İ: 'i',
  ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u',
}

/** Türkçe-duyarlı slug üretir; boş/anlamsız girdide '' döner. */
export function slugify(input: string): string {
  if (!input) return ''
  return input
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (c) => TR_MAP[c] ?? c)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Liste için benzersiz slug atar: dolu `slug` korunur; boş olan `ad`'dan
 * üretilir; çakışmada `-2`, `-3`… soneki eklenir. slugify boş dönerse
 * 'referans' tabanı kullanılır.
 */
export function buildUniqueSlugs<T extends { ad: string; slug?: string | null }>(
  items: T[],
): { item: T; slug: string }[] {
  const used = new Set<string>()
  const out: { item: T; slug: string }[] = []
  for (const item of items) {
    if (item.slug) {
      used.add(item.slug)
      out.push({ item, slug: item.slug })
      continue
    }
    const base = slugify(item.ad) || 'referans'
    let s = base
    let n = 2
    while (used.has(s)) s = `${base}-${n++}`
    used.add(s)
    out.push({ item, slug: s })
  }
  return out
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/slug.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/slug.ts src/lib/slug.test.ts
git commit -m "feat: Türkçe slugify + benzersiz slug yardımcıları"
```

---

### Task 2: Referans koleksiyonuna slug alanı + otomatik-slug hook

**Files:**
- Modify: `src/collections/Referans.ts`

**Interfaces:**
- Consumes: `slugify` (Task 1)
- Produces: `referans` koleksiyonu artık `slug` (text, unique, index) alanı taşır; boşsa `ad`'dan otomatik dolar.

- [ ] **Step 1: slug alanını ve hook'u ekle**

`src/collections/Referans.ts` dosyasını şu içerikle güncelle (import + `ad`'dan sonra `slug` alanı):

```ts
import type { CollectionConfig } from 'payload'
import { slugify } from '@/lib/slug'

export const Referans: CollectionConfig = {
  slug: 'referans',
  labels: { singular: 'Referans', plural: 'Referanslar' },
  admin: { useAsTitle: 'ad' },
  access: { read: () => true },
  fields: [
    { name: 'ad', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'URL eki. Boş bırakılırsa addan otomatik üretilir.',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            const v = (value as string | undefined)?.trim()
            if (v) return slugify(v)
            const ad = (data?.ad as string | undefined) ?? ''
            return slugify(ad)
          },
        ],
      },
    },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    {
      name: 'anasayfada',
      type: 'checkbox',
      label: 'Ana sayfada göster',
      defaultValue: false,
    },
    {
      name: 'gorus',
      type: 'group',
      label: 'Görüş',
      fields: [
        { name: 'metin', type: 'textarea', localized: true },
        { name: 'kisi', type: 'text' },
        { name: 'unvan', type: 'text', localized: true },
      ],
    },
  ],
}
```

> Not: Alan `required` DEĞİL (DB sütunu nullable) — bu, mevcut satırlara migration sırasında NOT NULL ihlali olmadan sütun eklemeyi sağlar. Hook her kayıtta değeri doldurduğu için pratikte her zaman dolu olur; benzersizlik `unique: true` ile korunur.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 0 error (slug.ts importu çözülür).

- [ ] **Step 3: Commit**

```bash
git add src/collections/Referans.ts
git commit -m "feat: Referans koleksiyonuna otomatik slug alanı"
```

---

### Task 3: Project koleksiyonuna referans ilişkisi

**Files:**
- Modify: `src/collections/Project.ts`

**Interfaces:**
- Produces: `project` koleksiyonu opsiyonel `referans` (relationship → referans) alanı taşır.

- [ ] **Step 1: referans alanını ekle**

`src/collections/Project.ts` içinde `musteri` alanından hemen sonra ekle:

```ts
    {
      name: 'musteri',
      type: 'text',
      label: 'Müşteri',
    },
    {
      name: 'referans',
      type: 'relationship',
      relationTo: 'referans',
      hasMany: false,
      label: 'Referans (müşteri kaydı)',
      admin: {
        description:
          'Bu proje bir referans kaydına bağlanırsa referans detay sayfasında listelenir ve proje detayında referansa link verilir. Opsiyonel.',
      },
    },
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 0 error.

- [ ] **Step 3: Commit**

```bash
git add src/collections/Project.ts
git commit -m "feat: Project'e opsiyonel referans ilişkisi"
```

---

### Task 4: Slug backfill fonksiyonu + CLI script

**Files:**
- Create: `src/payload/backfillReferansSlug.ts`
- Create: `src/payload/backfill-referans-slug.ts`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: `buildUniqueSlugs` (Task 1)
- Produces: `backfillReferansSlugs(payload: Payload): Promise<number>` — slug'ı boş olan referansları doldurur, doldurulan satır sayısını döner. Migration (Task 5) ve CLI bunu paylaşır.

- [ ] **Step 1: Backfill fonksiyonunu yaz**

```ts
// src/payload/backfillReferansSlug.ts
import type { Payload } from 'payload'
import { buildUniqueSlugs } from '@/lib/slug'

/**
 * Slug'ı boş olan tüm referans kayıtlarını ad'dan üretilen benzersiz slug ile
 * doldurur. İdempotent: dolu slug'lara dokunmaz. Doldurulan satır sayısını döner.
 */
export async function backfillReferansSlugs(payload: Payload): Promise<number> {
  const { docs } = await payload.find({
    collection: 'referans',
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })

  const items = docs.map((d) => ({
    id: d.id,
    ad: (d as unknown as { ad: string }).ad,
    slug: (d as unknown as { slug?: string | null }).slug ?? null,
  }))

  const assigned = buildUniqueSlugs(items)
  let filled = 0
  for (const { item, slug } of assigned) {
    if (item.slug) continue
    await payload.update({
      collection: 'referans',
      id: item.id,
      data: { slug } as unknown as Record<string, unknown>,
      overrideAccess: true,
    })
    filled++
  }
  return filled
}
```

- [ ] **Step 2: CLI sarmalayıcıyı yaz**

```ts
// src/payload/backfill-referans-slug.ts
import { config as dotenvConfig } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenvConfig({ path: resolve(__dirname, '../../.env.local') })
dotenvConfig({ path: resolve(__dirname, '../../.env') })

const { default: config } = await import('../../payload.config')
const { getPayload } = await import('payload')
const { backfillReferansSlugs } = await import('./backfillReferansSlug')

async function main() {
  const payload = await getPayload({ config })
  console.log('🌱  Referans slug backfill başlıyor…')
  const n = await backfillReferansSlugs(payload)
  console.log(`✅  ${n} referans slug ile dolduruldu.`)
  process.exit(0)
}

main().catch((err) => {
  console.error('❌  Backfill hatası:', err)
  process.exit(1)
})
```

- [ ] **Step 3: package.json scriptini ekle**

`scripts` bloğuna ekle (mevcut `payload:seed-danismanlik` satırından sonra):

```json
    "payload:seed-danismanlik": "tsx src/payload/seed-danismanlik.ts",
    "payload:backfill-referans-slug": "tsx src/payload/backfill-referans-slug.ts"
```

- [ ] **Step 4: Lint + dev backfill (yerel DB)**

Run: `npm run lint`
Expected: 0 error.

Run: `npm run payload:backfill-referans-slug`
Expected: `✅  N referans slug ile dolduruldu.` (dev DB'deki mevcut referanslar slug alır).

> Not: Bu adımdan ÖNCE Task 2'nin slug alanı dev DB'ye push edilmiş olmalı (Payload dev push modu kolonu otomatik ekler — `npm run dev` bir kez çalıştırıldığında veya `npm run build` sırasında şema senkronlanır). Kolon yoksa script hata verir; o durumda `npm run dev`'i bir kez başlatıp durdur, sonra script'i çalıştır.

- [ ] **Step 5: Commit**

```bash
git add src/payload/backfillReferansSlug.ts src/payload/backfill-referans-slug.ts package.json
git commit -m "feat: referans slug backfill fonksiyonu + CLI"
```

---

### Task 5: Payload migration (slug + referans ilişkisi + backfill)

**Files:**
- Create: `src/migrations/<timestamp>_referans_slug_project_referans.ts` (Payload üretir)

**Interfaces:**
- Consumes: `backfillReferansSlugs` (Task 4)

- [ ] **Step 1: Migration'ı üret**

Run: `npx payload migrate:create referans_slug_project_referans`
Expected: `src/migrations/` altında yeni dosya; `up()` içinde `referans.slug` ve `project.referans` (+ ilişki tablosu/sütunu) için ALTER ifadeleri.

- [ ] **Step 2: up() içinde slug sütununu nullable yap ve backfill'i ekle**

Üretilen `up()` fonksiyonunda:
1. `referans` tablosuna `slug` ekleyen ifadeyi bul. Eğer `NOT NULL` içeriyorsa onu kaldır (nullable ekle). `UNIQUE`/index ifadelerini OLDUĞU GİBİ bırak (NULL'lar Postgres'te unique çakışmaz).
2. Tüm şema ifadelerinden SONRA, fonksiyonun sonuna backfill çağrısını ekle.

Dosyanın başına import ekle ve `up` imzasına `payload` ekli olduğundan emin ol:

```ts
import { backfillReferansSlugs } from '../payload/backfillReferansSlug'
```

`up` fonksiyonunun sonuna (şema ALTER'larından sonra):

```ts
  // Mevcut referans satırlarına benzersiz slug doldur (yeni nullable sütun).
  await backfillReferansSlugs(payload)
```

> `up`/`down` imzaları Payload tarafından `({ db, payload, req }: MigrateUpArgs)` olarak üretilir; `payload` parametresi mevcuttur.

- [ ] **Step 3: down() kontrolü**

`down()` üretildiği gibi kalır (eklenen sütun/ilişkiyi düşürür). Değişiklik gerekmez.

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: 0 error.

- [ ] **Step 5: Commit**

```bash
git add src/migrations/
git commit -m "feat: referans.slug + project.referans migration + slug backfill"
```

---

### Task 6: Query adaptörleri + referansHref yardımcısı

**Files:**
- Modify: `src/lib/cms/queries.ts`
- Create: `src/lib/references.ts`
- Test: `src/lib/references.test.ts`

**Interfaces:**
- Produces:
  - `src/lib/references.ts`: `interface ReferenceListItem { id: string; ad: string; slug?: string; logo?: unknown; gorus?: unknown }` ve `referansHref(ref: { id: string; slug?: string }, counts: Record<string, number>): string | undefined`
  - queries.ts: `getReferences()` (artık `id`, `slug` döner), `getReferenceProjectCounts(): Promise<Record<string, number>>`, `getReference(slug)`, `getProjectsByReference(refId)`, `getProject(slug)` (artık `referans: { ad, slug } | null` döner)

- [ ] **Step 1: referansHref testini yaz**

```ts
// src/lib/references.test.ts
import { describe, it, expect } from 'vitest'
import { referansHref } from './references'

describe('referansHref', () => {
  it('proje sayısı > 0 ve slug varsa link döner', () => {
    expect(referansHref({ id: 'a', slug: 'acme' }, { a: 2 })).toBe('/referanslar/acme')
  })
  it('proje sayısı 0 ise undefined döner', () => {
    expect(referansHref({ id: 'a', slug: 'acme' }, { a: 0 })).toBeUndefined()
  })
  it('counts içinde yoksa undefined döner', () => {
    expect(referansHref({ id: 'b', slug: 'beta' }, { a: 2 })).toBeUndefined()
  })
  it('slug yoksa undefined döner', () => {
    expect(referansHref({ id: 'a' }, { a: 2 })).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/references.test.ts`
Expected: FAIL (module/export yok).

- [ ] **Step 3: references.ts'i yaz**

```ts
// src/lib/references.ts
export interface ReferenceListItem {
  id: string
  ad: string
  slug?: string
  logo?: unknown
  gorus?: unknown
}

/** İlişkili projesi olan + slug'ı olan referans için detay linki; aksi halde undefined. */
export function referansHref(
  ref: { id: string; slug?: string },
  counts: Record<string, number>,
): string | undefined {
  if (!ref.slug) return undefined
  return (counts[ref.id] ?? 0) > 0 ? `/referanslar/${ref.slug}` : undefined
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/references.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: queries.ts adaptörlerini güncelle/ekle**

`getReferences()` map çıktısına `id` ve `slug` ekle:

```ts
    return docs.map((r) => ({
      id: String(r.id),
      ad: r.ad,
      slug: (r as unknown as { slug?: string }).slug,
      logo: r.logo,
      gorus: r.gorus,
    }))
```

`getProject(slug)` dönüşüne `referans` ekle (return objesine):

```ts
    const ref = (r as unknown as { referans?: { ad?: string; slug?: string } }).referans
    return {
      baslik: r.baslik,
      musteri: r.musteri,
      referans: ref && ref.slug ? { ad: ref.ad ?? '', slug: ref.slug } : null,
      isKolu: r.isKolu,
      durum: r.durum,
      yil: r.yil,
      il: r.il,
      kapsam: r.kapsam,
      ozet: r.ozet,
      aciklama: r.aciklama,
      gorseller: Array.isArray(r.gorseller)
        ? r.gorseller.map((row: Record<string, unknown>) => row?.gorsel ?? null).filter(Boolean)
        : [],
    }
```

Referans bölümünün (// References) sonuna üç yeni adaptör ekle:

```ts
export async function getReferenceProjectCounts() {
  return safe(async () => {
    const p = await getPayloadClient()
    const { docs } = await p.find({
      collection: 'project',
      depth: 0,
      limit: 0,
      pagination: false,
    })
    const counts: Record<string, number> = {}
    for (const r of docs) {
      const ref = (r as unknown as { referans?: string | number | { id?: string | number } }).referans
      if (ref == null) continue
      const id = String(typeof ref === 'object' ? ref.id : ref)
      if (!id || id === 'undefined') continue
      counts[id] = (counts[id] ?? 0) + 1
    }
    return counts
  }, {} as Record<string, number>)
}

export async function getReference(slug: string) {
  return safe(async () => {
    const p = await getPayloadClient()
    const { docs } = await p.find({
      collection: 'referans',
      where: { slug: { equals: slug } },
      locale: 'all',
      depth: 2,
      limit: 1,
    })
    const r = docs[0]
    if (!r) return null
    return {
      id: String(r.id),
      ad: r.ad,
      slug: (r as unknown as { slug?: string }).slug,
      logo: r.logo,
      gorus: r.gorus,
    }
  }, null)
}

export async function getProjectsByReference(refId: string) {
  return safe(async () => {
    const p = await getPayloadClient()
    const { docs } = await p.find({
      collection: 'project',
      where: { referans: { equals: refId } },
      sort: '-yil',
      locale: 'all',
      depth: 2,
      limit: 100,
    })
    return docs.map((r) => ({
      slug: r.slug,
      baslik: r.baslik,
      musteri: r.musteri,
      isKolu: r.isKolu,
      durum: r.durum,
      yil: r.yil,
      il: r.il,
      ozet: r.ozet,
    }))
  }, [])
}
```

- [ ] **Step 6: Lint + test**

Run: `npm run lint && npm test -- src/lib/references.test.ts`
Expected: 0 error; PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/cms/queries.ts src/lib/references.ts src/lib/references.test.ts
git commit -m "feat: referans/proje query adaptörleri + referansHref"
```

---

### Task 7: Yeniden kullanılabilir ProjectCardLink bileşeni

**Files:**
- Create: `src/components/sections/ProjectCardLink.tsx`
- Modify: `src/components/sections/ProjectsExplorer.tsx` (kart markup'ını bileşene çıkar)

**Interfaces:**
- Consumes: `ProjectCard` (`@/lib/projects`), `Locale`
- Produces: `<ProjectCardLink project={ProjectCard} locale={Locale} />` — `/projeler/[slug]`'e linkli proje kartı.

- [ ] **Step 1: ProjectCardLink bileşenini oluştur**

```tsx
// src/components/sections/ProjectCardLink.tsx
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui';
import { pick, type Locale } from '@/lib/locales';
import { isKoluLabel } from '@/lib/labels';
import { cn } from '@/lib/utils';
import type { ProjectCard } from '@/lib/projects';
import type { ProjeDurumu } from '@/types';

const DURUM_LABELS: Record<ProjeDurumu, Record<Locale, string>> = {
  'devam-eden': { tr: 'Devam Eden', en: 'Ongoing' },
  tamamlandi: { tr: 'Tamamlandı', en: 'Completed' },
};

const DURUM_TONE: Record<ProjeDurumu, 'amber' | 'green'> = {
  'devam-eden': 'amber',
  tamamlandi: 'green',
};

export function ProjectCardLink({
  project,
  locale,
}: {
  project: ProjectCard;
  locale: Locale;
}) {
  const title = pick(project.baslik, locale) ?? project.baslik.tr;
  return (
    <Link
      href={`/projeler/${project.slug}`}
      className={cn(
        'group relative flex flex-col rounded-2xl border border-border bg-surface overflow-hidden',
        'transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40',
      )}
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge tone={DURUM_TONE[project.durum]}>
            {DURUM_LABELS[project.durum][locale]}
          </Badge>
          <Badge tone="navy">{isKoluLabel(project.isKolu, locale)}</Badge>
        </div>
        <h3 className="font-display text-base font-bold text-foreground mb-1 line-clamp-2">
          {title}
        </h3>
        {project.musteri && (
          <p className="text-sm text-muted mt-1">{project.musteri}</p>
        )}
        {(project.yil || project.il) && (
          <p className="mt-auto pt-4 text-xs text-muted">
            {[project.yil, project.il].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: ProjectsExplorer'ı bileşeni kullanacak şekilde güncelle**

`src/components/sections/ProjectsExplorer.tsx` içinde:
- Üst kısımdaki `DURUM_LABELS` ve `DURUM_TONE` sabitleri kart için kullanılıyorsa kalsın (filtre/chip etiketleri de kullanıyor — `DURUM_LABELS` chip'lerde kullanılır, korunur).
- Importlara ekle: `import { ProjectCardLink } from './ProjectCardLink';`
- Kart grid'inin `.map(...)` gövdesini (satır ~121-160 arası `<Link>…</Link>`) şununla değiştir:

```tsx
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCardLink key={project.slug} project={project} locale={locale} />
          ))}
        </div>
```

- Artık kullanılmayan importları temizle (kart içinde kullanılan `pick`, `isKoluLabel` hâlâ başka yerde kullanılıyorsa bırak; lint uyarısına göre temizle).

- [ ] **Step 3: Lint + build (regresyon)**

Run: `npm run lint`
Expected: 0 error (kullanılmayan import yok).

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/ProjectCardLink.tsx src/components/sections/ProjectsExplorer.tsx
git commit -m "refactor: proje kartını yeniden kullanılabilir ProjectCardLink'e çıkar"
```

---

### Task 8: Referans detay sayfası (/referanslar/[slug])

**Files:**
- Create: `src/app/(site)/[locale]/referanslar/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getReference`, `getProjectsByReference` (Task 6), `ProjectCardLink` (Task 7)

- [ ] **Step 1: Detay sayfasını oluştur**

```tsx
// src/app/(site)/[locale]/referanslar/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { isLocale, pick, type Locale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { getReference, getProjectsByReference } from '@/lib/cms/queries';
import { mediaUrl } from '@/lib/cms/image';
import { Section, Cta } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { PageHero } from '@/components/sections/PageHero';
import { ServiceIcon } from '@/components/ui/icons';
import { ProjectCardLink } from '@/components/sections/ProjectCardLink';
import type { ProjectCard } from '@/lib/projects';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

interface ReferenceData {
  id: string;
  ad: string;
  slug?: string;
  logo?: unknown;
  gorus?: {
    metin?: { tr: string; en: string };
    kisi?: string;
    unvan?: { tr: string; en: string };
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc: Locale = isLocale(locale) ? locale : 'tr';
  const data = (await getReference(slug)) as ReferenceData | null;
  if (!data) {
    return buildMetadata({
      baslik: loc === 'tr' ? 'Referans | Redwall' : 'Reference | Redwall',
      aciklama: loc === 'tr' ? 'Redwall referansı.' : 'Redwall reference.',
      locale: loc,
      path: `/referanslar/${slug}`,
    });
  }
  const baslik = `${data.ad} | ${loc === 'tr' ? 'Referanslar' : 'References'} | Redwall`;
  const aciklama =
    loc === 'tr'
      ? `${data.ad} ile Redwall olarak gerçekleştirdiğimiz projeler.`
      : `Projects we delivered with ${data.ad} at Redwall.`;
  return buildMetadata({ baslik, aciklama, locale: loc, path: `/referanslar/${slug}` });
}

export default async function ReferansDetayPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const data = (await getReference(slug)) as ReferenceData | null;
  if (!data) notFound();

  const isTr = locale === 'tr';
  const logoSrc = data.logo ? mediaUrl(data.logo) ?? null : null;
  const projects = (await getProjectsByReference(data.id)) as unknown as ProjectCard[];

  const gorusMetin = data.gorus?.metin ? pick(data.gorus.metin, locale) ?? '' : '';
  const gorusUnvan = data.gorus?.unvan ? pick(data.gorus.unvan, locale) ?? '' : '';

  return (
    <>
      <PageHero
        eyebrow={isTr ? 'Referans' : 'Reference'}
        title={data.ad}
        accent="#e63950"
        glyph={
          logoSrc ? (
            <div className="relative h-[20rem] w-[20rem]">
              <Image src={logoSrc} alt={data.ad} fill className="object-contain opacity-90" sizes="320px" />
            </div>
          ) : (
            <ServiceIcon name="building" className="h-[26rem] w-[26rem]" />
          )
        }
      />

      {/* Back link */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8">
        <Link
          href="/referanslar"
          className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {isTr ? 'Referanslara Dön' : 'Back to References'}
        </Link>
      </div>

      {/* Görüş */}
      {gorusMetin && (
        <Section>
          <figure className="relative mx-auto max-w-3xl rounded-xl border border-border bg-surface p-6 pl-8 overflow-hidden">
            <span className="absolute left-0 top-0 h-full w-1 rounded-l-xl" style={{ backgroundColor: '#e63950' }} aria-hidden />
            <blockquote className="relative text-base leading-relaxed text-foreground/80">
              &ldquo;{gorusMetin}&rdquo;
            </blockquote>
            {(data.gorus?.kisi || gorusUnvan) && (
              <figcaption className="mt-4 border-t border-border pt-4">
                {data.gorus?.kisi && <p className="font-semibold">{data.gorus.kisi}</p>}
                {gorusUnvan && <p className="mt-0.5 text-sm text-muted">{gorusUnvan} — {data.ad}</p>}
              </figcaption>
            )}
          </figure>
        </Section>
      )}

      {/* Projeler */}
      <Section tone="muted">
        <h2 className="mb-10 font-display text-2xl font-bold sm:text-3xl">
          {isTr ? 'Bu referansla yapılan projeler' : 'Projects delivered with this reference'}
        </h2>
        {projects.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCardLink key={project.slug} project={project} locale={locale} />
            ))}
          </div>
        ) : (
          <p className="text-muted">
            {isTr ? 'Bu referans için henüz proje eklenmedi.' : 'No projects added for this reference yet.'}
          </p>
        )}
      </Section>

      <Cta
        baslik={isTr ? 'Projenizi Birlikte Hayata Geçirelim' : "Let’s Bring Your Project to Life"}
        aciklama={
          isTr
            ? 'Redwall olarak deneyimimizi sizin projenize taşımaya hazırız.'
            : "At Redwall, we're ready to bring our experience to your project."
        }
        buton={{ etiket: isTr ? 'Teklif Al' : 'Get a Quote', href: '/teklif' }}
      />
    </>
  );
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 0 error.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(site)/[locale]/referanslar/[slug]/page.tsx"
git commit -m "feat: referans detay sayfası (logo + ad + görüş + projeler)"
```

---

### Task 9: Referanslar listesi — ilişkili logoları linkle

**Files:**
- Modify: `src/components/ui/LogoWall.tsx`
- Modify: `src/components/sections/PaginatedLogoWall.tsx`
- Modify: `src/app/(site)/[locale]/referanslar/page.tsx`

**Interfaces:**
- Consumes: `referansHref`, `getReferenceProjectCounts`, `getReferences` (id+slug)
- Produces: LogoWall/PaginatedLogoWall öğe tipi `{ ad; src?; href? }`; href varsa logo linklenir.

- [ ] **Step 1: LogoWall'ı href destekleyecek şekilde güncelle**

`src/components/ui/LogoWall.tsx`:
- Import ekle: `import { Link } from '@/i18n/navigation';`
- Tip: `logos: { ad: string; src?: string; href?: string }[]`
- `.map` gövdesinde kart `<div>`'ini bir yardımcıyla sar: href varsa `Link`, yoksa `div`. Mevcut kart içeriğini koruyarak:

```tsx
export function LogoWall({ logos }: { logos: { ad: string; src?: string; href?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {logos.map((logo, i) => {
        const card = (
          <div className="group flex h-36 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-background p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
            <div className="flex h-12 w-full items-center justify-center">
              {logo.src ? (
                <div className="relative h-12 w-full">
                  <Image
                    src={logo.src}
                    alt={logo.ad}
                    fill
                    sizes="200px"
                    className="object-contain opacity-70 grayscale transition duration-200 group-hover:opacity-100 group-hover:grayscale-0"
                  />
                </div>
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 font-display text-base font-bold text-primary">
                  {initials(logo.ad)}
                </span>
              )}
            </div>
            <span className="line-clamp-2 text-center text-sm font-medium leading-tight text-foreground/80">
              {logo.ad}
            </span>
          </div>
        );
        return logo.href ? (
          <Link key={i} href={logo.href as Parameters<typeof Link>[0]['href']} aria-label={logo.ad}>
            {card}
          </Link>
        ) : (
          <div key={i}>{card}</div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: PaginatedLogoWall tipini genişlet**

`src/components/sections/PaginatedLogoWall.tsx`:
- `logos: { ad: string; src?: string }[]` → `logos: { ad: string; src?: string; href?: string }[]`
(Geri kalan mantık aynı; `slice` href'i taşır.)

- [ ] **Step 3: Referanslar listesinde href hesapla**

`src/app/(site)/[locale]/referanslar/page.tsx`:
- Importlara ekle: `import { getReferences, getReferenceProjectCounts } from '@/lib/cms/queries';` (mevcut getReferences importunu güncelle) ve `import { referansHref } from '@/lib/references';`
- `Reference` arayüzüne `id: string; slug?: string;` ekle.
- Veri çekimini güncelle:

```tsx
  const references = (await getReferences()) as unknown as Reference[];
  const counts = await getReferenceProjectCounts();

  const logoItems = references.map((ref) => ({
    ad: ref.ad,
    src: mediaUrl(ref.logo),
    href: referansHref({ id: ref.id, slug: ref.slug }, counts),
  }));
```

(`Reference` arayüzünü güncelle:)

```tsx
interface Reference {
  id: string;
  ad: string;
  slug?: string;
  logo?: unknown;
  gorus?: {
    metin: { tr: string; en: string };
    kisi: string;
    unvan: { tr: string; en: string };
  };
}
```

- [ ] **Step 4: Lint + build**

Run: `npm run lint && npm run build`
Expected: 0 error; build başarılı.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/LogoWall.tsx src/components/sections/PaginatedLogoWall.tsx "src/app/(site)/[locale]/referanslar/page.tsx"
git commit -m "feat: ilişkili projesi olan referans logolarını detaya linkle"
```

---

### Task 10: Proje detayında referans linki

**Files:**
- Modify: `src/app/(site)/[locale]/projeler/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getProject` (artık `referans: { ad, slug } | null` döner — Task 6)

- [ ] **Step 1: ProjectData tipine referans ekle**

`ProjectData` arayüzüne ekle:

```tsx
  referans?: { ad: string; slug: string } | null;
```

- [ ] **Step 2: Künyedeki "Müşteri" hücresini referans linkiyle güncelle**

Müşteri `<div>` bloğunu (künye grid'i içindeki ilk hücre) şununla değiştir:

```tsx
          {/* Müşteri */}
          {(data.referans || data.musteri) && (
            <div className="rounded-xl border border-border bg-background px-5 py-4">
              <dt className="text-xs uppercase tracking-wider text-muted mb-1">
                {isTr ? 'Müşteri' : 'Client'}
              </dt>
              <dd className="text-sm font-medium text-foreground">
                {data.referans ? (
                  <Link
                    href={`/referanslar/${data.referans.slug}` as Parameters<typeof Link>[0]['href']}
                    className="text-primary hover:underline"
                  >
                    {data.referans.ad || data.musteri}
                  </Link>
                ) : (
                  data.musteri
                )}
              </dd>
            </div>
          )}
```

(`Link` zaten import edilmiş.)

- [ ] **Step 3: Lint + build**

Run: `npm run lint && npm run build`
Expected: 0 error; build başarılı.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(site)/[locale]/projeler/[slug]/page.tsx"
git commit -m "feat: proje detayında müşteriyi referans detayına linkle"
```

---

### Task 11: Uçtan uca doğrulama (preview) + deploy

**Files:** (yok — doğrulama + deploy)

- [ ] **Step 1: Test + lint + build (hepsi yeşil)**

Run: `npm test && npm run lint && npm run build`
Expected: tüm testler PASS, 0 lint error, build başarılı.

- [ ] **Step 2: Preview ile manuel doğrulama**

`mcp__Claude_Preview__preview_start` → dev sunucu. /admin'den bir referansı 1-2 projeye `referans` alanından bağla (veya dev'de zaten bağlıysa atla). Doğrula:
- (a) `/tr/referanslar` — ilişkili projesi olan logo tıklanabilir, olmayan tıklanamaz.
- (b) Tıkla → `/tr/referanslar/<slug>` detay: logo + ad + (varsa) görüş + proje kartları.
- (c) Bir proje kartına tıkla → proje detayı; künyedeki "Müşteri" referans detayına geri linkli.
- (d) `/en/...` aynısı.
- Konsol/network hatası yok (`preview_console_logs`).

- [ ] **Step 3: Deploy**

```bash
git checkout main && git merge --no-ff <branch> -m "Merge: referans detay + projeler-referanslar ilişkisi"
git push origin main
```

CI: build + `payload migrate` (slug + referans ilişkisi + backfill otomatik). `gh run watch` ile izle.

- [ ] **Step 4: Prod doğrulaması**

- Migration sonrası `redwall.tr/admin`'den birkaç projeyi referansa bağla.
- `https://redwall.tr/tr/referanslar` → ilişkili logo tıklanır → detay render; proje detayında referans linki çalışır (TR + EN).

---

## Self-Review Notları
- **Spec kapsamı:** slug (T2) ✓, referans ilişkisi (T3) ✓, migration+backfill (T4-T5) ✓, adaptörler (T6) ✓, detay sayfası (T8) ✓, liste tıklanabilirlik (T9) ✓, proje→referans link (T10) ✓, slugify+href testleri (T1,T6) ✓.
- **Karar farkı:** Spec "slug required" diyordu; uygulamada DB sütunu nullable + hook her zaman doldurur (migration'da NOT NULL ihlali olmasın diye). Benzersizlik `unique` ile, doluluk hook ile garanti. İşlevsel sonuç aynı.
- **Tip tutarlılığı:** `ProjectCard` (lib/projects) hem ProjectCardLink hem detay sayfasında; `referansHref` imzası liste sayfasıyla uyumlu; `getProject.referans` ↔ proje detay `ProjectData.referans` uyumlu.
