# SEO Yapısal Veri (JSON-LD) + Sitemap + OG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Siteye JSON-LD yapısal veri (Organization/WebSite/Article/SoftwareApplication/FAQPage/BreadcrumbList) + OG görseli + article type + sitemap referans kapsamı ekleyerek Google rich snippet ve sosyal önizleme kazanmak.

**Architecture:** Saf builder katmanı (`lexicalToPlainText`, `jsonLd.ts` — primitif girdili, TDD) → `<JsonLd>` server component (`<` kaçışlı güvenli script) → sayfalara bağlama (layout site-geneli, detay sayfaları özel) + `metadata.ts` OG genişletme + `sitemap.ts` referans ekleme. Şema/CMS değişmez, migration YOK.

**Tech Stack:** Next.js 16 App Router (server components, `generateMetadata`), TypeScript, Vitest, schema.org JSON-LD.

## Global Constraints

- Lint: `@typescript-eslint/no-explicit-any` ERROR → `unknown` / gerçek tipler.
- Builder'lar SAF + primitif girdili (React'a bağımsız); locale `pick`'i + settings-şekli çıkarımı ÇAĞIRAN tarafta (layout/sayfa) yapılır.
- Tek `dangerouslySetInnerHTML` yalnız `JsonLd.tsx`'te; `JSON.stringify(data).replace(/</g,'\\u003c')` ile `<` kaçışı ZORUNLU (XSS-breakout engeli) + gerekçe yorumu.
- Mevcut altyapı: `@/lib/cms/queries` (`getSiteSettings`, `getFaqs`, `getReferences`, `getPosts`), `@/lib/cms/image` (`mediaUrl`), `@/lib/locales` (`pick`? — sayfalar `pick` kullanıyor), `@/lib/lexical/plainToLexical` (`normalizeToLexical`), `@/lib/metadata` (`buildMetadata`).
- SITE_URL = `process.env.NEXT_PUBLIC_SITE_URL || 'https://redwall.tr'`.
- Her task `npx tsc --noEmit && npm run lint && npm run build` yeşil olmalı; migration YOK.

---

### Task 1: `lexicalToPlainText` saf fonksiyonu (TDD)

**Files:**
- Create: `src/lib/lexicalToPlainText.ts`
- Test: `src/lib/lexicalToPlainText.test.ts`

**Interfaces:**
- Produces: `lexicalToPlainText(value: unknown): string`

- [ ] **Step 1: Failing test** — `src/lib/lexicalToPlainText.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { lexicalToPlainText } from './lexicalToPlainText';

describe('lexicalToPlainText', () => {
  it('düz string → aynen döner (trim)', () => {
    expect(lexicalToPlainText('  merhaba  ')).toBe('merhaba');
  });
  it('null/undefined → boş string', () => {
    expect(lexicalToPlainText(null)).toBe('');
    expect(lexicalToPlainText(undefined)).toBe('');
  });
  it('tek paragraf Lexical → metin', () => {
    const v = { root: { children: [ { type: 'paragraph', children: [ { type: 'text', text: 'Yangın güvenliği' } ] } ] } };
    expect(lexicalToPlainText(v)).toBe('Yangın güvenliği');
  });
  it('çok paragraf → boşlukla birleşir', () => {
    const v = { root: { children: [
      { type: 'paragraph', children: [ { type: 'text', text: 'Bir' } ] },
      { type: 'paragraph', children: [ { type: 'text', text: 'iki' } ] },
    ] } };
    expect(lexicalToPlainText(v)).toBe('Bir iki');
  });
  it('iç içe (liste/format) → tüm text düğümleri', () => {
    const v = { root: { children: [ { type: 'list', children: [
      { type: 'listitem', children: [ { type: 'text', text: 'a' } ] },
      { type: 'listitem', children: [ { type: 'text', text: 'b' } ] },
    ] } ] } };
    expect(lexicalToPlainText(v)).toBe('a b');
  });
  it('boş root → boş string', () => {
    expect(lexicalToPlainText({ root: { children: [] } })).toBe('');
  });
});
```

- [ ] **Step 2: Fail** — Run: `npm test -- lexicalToPlainText` → FAIL (modül yok).

- [ ] **Step 3: Implement** — `src/lib/lexicalToPlainText.ts`:

```ts
import { normalizeToLexical } from '@/lib/lexical/plainToLexical';

type LexicalNode = { type?: string; text?: string; children?: LexicalNode[] };

function collectText(node: LexicalNode, out: string[]): void {
  if (typeof node.text === 'string' && node.text) out.push(node.text);
  if (Array.isArray(node.children)) for (const c of node.children) collectText(c, out);
}

/** Lexical state (veya düz string) → düz metin. Paragraf/öğe metinleri boşlukla birleşir.
 *  JSON-LD (FAQPage acceptedAnswer vb.) için; null/boş → ''. */
export function lexicalToPlainText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  const data = normalizeToLexical(value) as unknown as { root?: LexicalNode } | null;
  if (!data?.root?.children) return '';
  const parts: string[] = [];
  for (const child of data.root.children) {
    const buf: string[] = [];
    collectText(child, buf);
    if (buf.length) parts.push(buf.join(''));
  }
  return parts.join(' ').trim();
}
```
  NOT: `normalizeToLexical` düz string'i paragrafa sarar → `collectText` yine metni çeker; ama Step 1'in "düz string → trim" testini garanti için başta string kısayolu var. İç içe `children` birleştirme boşluksuz (kelime bütünlüğü); paragraf-arası boşluklu.

- [ ] **Step 4: Pass** — Run: `npm test -- lexicalToPlainText` → PASS (6 test). Sonra `npx tsc --noEmit && npm run lint` (0 error).

- [ ] **Step 5: Commit**
```bash
git add src/lib/lexicalToPlainText.ts src/lib/lexicalToPlainText.test.ts
git commit -m "feat: lexicalToPlainText — Lexical state → düz metin (JSON-LD için)"
```

---

### Task 2: `jsonLd.ts` saf builder'ları (TDD)

**Files:**
- Create: `src/lib/jsonLd.ts`
- Test: `src/lib/jsonLd.test.ts`

**Interfaces:**
- Produces:
  - `organizationJsonLd(o: { name: string; url: string; logoUrl?: string; phone?: string; email?: string; sameAs?: string[] }): Record<string, unknown>`
  - `websiteJsonLd(o: { name: string; url: string }): Record<string, unknown>`
  - `articleJsonLd(o: { headline: string; description?: string; datePublished?: string; imageUrl?: string; url: string; authorName?: string }): Record<string, unknown>`
  - `softwareAppJsonLd(o: { name: string; description?: string; url: string; category?: string }): Record<string, unknown>`
  - `faqPageJsonLd(items: { question: string; answer: string }[]): Record<string, unknown>`
  - `breadcrumbJsonLd(items: { name: string; url: string }[]): Record<string, unknown>`

- [ ] **Step 1: Failing test** — `src/lib/jsonLd.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { organizationJsonLd, websiteJsonLd, articleJsonLd, softwareAppJsonLd, faqPageJsonLd, breadcrumbJsonLd } from './jsonLd';

describe('jsonLd builders', () => {
  it('organization — zorunlu alanlar + boş atlanır', () => {
    const o = organizationJsonLd({ name: 'Redwall', url: 'https://redwall.tr', sameAs: ['https://x.com/redwall'] });
    expect(o['@type']).toBe('Organization');
    expect(o['@context']).toBe('https://schema.org');
    expect(o.name).toBe('Redwall');
    expect(o.sameAs).toEqual(['https://x.com/redwall']);
    expect('logo' in o).toBe(false); // logoUrl verilmedi → alan yok
  });
  it('organization — logo/telefon verilince eklenir', () => {
    const o = organizationJsonLd({ name: 'R', url: 'https://redwall.tr', logoUrl: 'https://redwall.tr/l.png', phone: '+90 212 000 00 00' });
    expect(o.logo).toBe('https://redwall.tr/l.png');
    expect((o.contactPoint as Record<string, unknown>)['@type']).toBe('ContactPoint');
  });
  it('website', () => {
    expect(websiteJsonLd({ name: 'Redwall', url: 'https://redwall.tr' })['@type']).toBe('WebSite');
  });
  it('article — headline + date + image', () => {
    const a = articleJsonLd({ headline: 'Başlık', url: 'https://redwall.tr/tr/blog/x', datePublished: '2026-01-01', imageUrl: 'https://redwall.tr/c.jpg' });
    expect(a['@type']).toBe('Article');
    expect(a.headline).toBe('Başlık');
    expect(a.datePublished).toBe('2026-01-01');
    expect(a.image).toBe('https://redwall.tr/c.jpg');
  });
  it('softwareApp', () => {
    const s = softwareAppJsonLd({ name: 'YangınPro', url: 'https://redwall.tr/tr/yazilim/yanginpro', category: 'BusinessApplication' });
    expect(s['@type']).toBe('SoftwareApplication');
    expect(s.applicationCategory).toBe('BusinessApplication');
    expect(s.operatingSystem).toBe('Web');
  });
  it('faqPage — boş item elenir', () => {
    const f = faqPageJsonLd([ { question: 'S?', answer: 'C' }, { question: '', answer: 'x' }, { question: 'S2', answer: '' } ]);
    expect(f['@type']).toBe('FAQPage');
    expect((f.mainEntity as unknown[]).length).toBe(1);
    const q = (f.mainEntity as Record<string, unknown>[])[0];
    expect(q['@type']).toBe('Question');
    expect((q.acceptedAnswer as Record<string, unknown>).text).toBe('C');
  });
  it('breadcrumb — position sıralı', () => {
    const b = breadcrumbJsonLd([ { name: 'Ana', url: 'https://redwall.tr/tr' }, { name: 'Blog', url: 'https://redwall.tr/tr/blog' } ]);
    expect(b['@type']).toBe('BreadcrumbList');
    const items = b.itemListElement as Record<string, unknown>[];
    expect(items[0].position).toBe(1);
    expect(items[1].position).toBe(2);
    expect(items[1].name).toBe('Blog');
  });
});
```

- [ ] **Step 2: Fail** — Run: `npm test -- jsonLd` → FAIL.

- [ ] **Step 3: Implement** — `src/lib/jsonLd.ts`:

```ts
const CTX = 'https://schema.org';

export function organizationJsonLd(o: {
  name: string; url: string; logoUrl?: string; phone?: string; email?: string; sameAs?: string[];
}): Record<string, unknown> {
  const out: Record<string, unknown> = { '@context': CTX, '@type': 'Organization', name: o.name, url: o.url };
  if (o.logoUrl) out.logo = o.logoUrl;
  if (o.sameAs && o.sameAs.length) out.sameAs = o.sameAs;
  if (o.phone || o.email) {
    const cp: Record<string, unknown> = { '@type': 'ContactPoint', contactType: 'customer service' };
    if (o.phone) cp.telephone = o.phone;
    if (o.email) cp.email = o.email;
    out.contactPoint = cp;
  }
  return out;
}

export function websiteJsonLd(o: { name: string; url: string }): Record<string, unknown> {
  return { '@context': CTX, '@type': 'WebSite', name: o.name, url: o.url };
}

export function articleJsonLd(o: {
  headline: string; description?: string; datePublished?: string; imageUrl?: string; url: string; authorName?: string;
}): Record<string, unknown> {
  const out: Record<string, unknown> = {
    '@context': CTX, '@type': 'Article', headline: o.headline, url: o.url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': o.url },
  };
  if (o.description) out.description = o.description;
  if (o.datePublished) out.datePublished = o.datePublished;
  if (o.imageUrl) out.image = o.imageUrl;
  if (o.authorName) out.author = { '@type': 'Organization', name: o.authorName };
  return out;
}

export function softwareAppJsonLd(o: {
  name: string; description?: string; url: string; category?: string;
}): Record<string, unknown> {
  const out: Record<string, unknown> = {
    '@context': CTX, '@type': 'SoftwareApplication', name: o.name, url: o.url,
    applicationCategory: o.category ?? 'BusinessApplication', operatingSystem: 'Web',
  };
  if (o.description) out.description = o.description;
  return out;
}

export function faqPageJsonLd(items: { question: string; answer: string }[]): Record<string, unknown> {
  const mainEntity = items
    .filter((i) => i.question.trim() && i.answer.trim())
    .map((i) => ({
      '@type': 'Question', name: i.question,
      acceptedAnswer: { '@type': 'Answer', text: i.answer },
    }));
  return { '@context': CTX, '@type': 'FAQPage', mainEntity };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    '@context': CTX, '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem', position: i + 1, name: it.name, item: it.url,
    })),
  };
}
```

- [ ] **Step 4: Pass** — Run: `npm test -- jsonLd` → PASS (7 test). Sonra `npx tsc --noEmit && npm run lint` (0 error).

- [ ] **Step 5: Commit**
```bash
git add src/lib/jsonLd.ts src/lib/jsonLd.test.ts
git commit -m "feat: jsonLd — schema.org yapısal veri builder'ları (Org/WebSite/Article/SoftwareApp/FAQ/Breadcrumb)"
```

---

### Task 3: `JsonLd` bileşeni + kök layout'a Organization + WebSite

**Files:**
- Create: `src/components/seo/JsonLd.tsx`
- Modify: `src/app/(site)/[locale]/layout.tsx`

**Interfaces:**
- Consumes: `organizationJsonLd`, `websiteJsonLd` (Task 2), `getSiteSettings` (mevcut).
- Produces: `<JsonLd data={Record<string, unknown>} />`

- [ ] **Step 1: JsonLd bileşeni** — `src/components/seo/JsonLd.tsx`:

```tsx
/** Yapısal veriyi <script type="application/ld+json"> olarak basar.
 *  Güvenlik: JSON.stringify + `<`→< kaçışı script-breakout/XSS'i engeller.
 *  İçerik sunucu-üretimi JSON'dur (kullanıcı girdisi değil); kod tabanındaki tek
 *  dangerouslySetInnerHTML — bu desen JSON-LD için endüstri standardıdır. */
export function JsonLd({ data }: { data: Record<string, unknown> | null | undefined }) {
  if (!data) return null;
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
```

- [ ] **Step 2: Layout'a bağla** — `src/app/(site)/[locale]/layout.tsx`: `getSiteSettings()` zaten `settings`'e alınıyor. Importları ekle:
  `import { JsonLd } from '@/components/seo/JsonLd';`
  `import { organizationJsonLd, websiteJsonLd } from '@/lib/jsonLd';`
  `import { mediaUrl } from '@/lib/cms/image';`
  `import { pick } from '@/lib/locales';` (locale bazlı alan varsa; yoksa atla)
  Render `return (...)` içinde, en dışa (ör. `<main>`'den önce) şunu ekle. Settings'ten alanları ÇIKAR
  (gerçek alan adlarını `src/payload-types.ts` `SiteSetting` tipinden doğrula — `iletisim` altındaki
  telefon/email, `sosyal` içindeki url'ler, `marka`/logo):

```tsx
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://redwall.tr';
  const orgLd = settings
    ? organizationJsonLd({
        name: (settings.sirketAdi as { tr?: string; en?: string } | string | undefined)
          ? (typeof settings.sirketAdi === 'string' ? settings.sirketAdi : pick(settings.sirketAdi as Record<'tr'|'en', string>, locale) ?? 'Redwall')
          : 'Redwall',
        url: SITE_URL,
        logoUrl: /* settings.marka logo veya varsayılan */ `${SITE_URL}/og-default.png`,
        phone: /* settings.iletisim?.telefon */ undefined,
        email: /* settings.iletisim?.email */ undefined,
        sameAs: /* settings.sosyal linkleri → string[] */ undefined,
      })
    : null;
  const siteLd = websiteJsonLd({ name: 'Redwall', url: SITE_URL });
```
  ve JSX'te:
```tsx
        <JsonLd data={orgLd} />
        <JsonLd data={siteLd} />
```
  DİKKAT: yukarıdaki alan çıkarımı `SiteSetting` tipine göre KESİNLEŞTİRİLİR (implementer `payload-types.ts`'ten
  `iletisim`/`sosyal`/`sirketAdi`/`marka` alt-alanlarını okur; localized ise `pick` ile locale seçer; bir alan
  yoksa `undefined` bırakır — builder atlar). Amaç: en az `name`+`url` dolu geçerli Organization.

- [ ] **Step 3: Doğrula** — `npx tsc --noEmit && npm run lint && npm run build` (0 error). Preview: herhangi bir
  sayfada view-source → iki `<script type="application/ld+json">` (Organization + WebSite), geçerli JSON.

- [ ] **Step 4: Commit**
```bash
git add src/components/seo/JsonLd.tsx "src/app/(site)/[locale]/layout.tsx"
git commit -m "feat: JsonLd bileşeni + kök layout'a Organization + WebSite yapısal verisi"
```

---

### Task 4: Detay sayfalarına JSON-LD (blog/ürün/SSS/proje)

**Files:**
- Modify: `src/app/(site)/[locale]/blog/[slug]/page.tsx`, `src/app/(site)/[locale]/yazilim/[urun]/page.tsx`, `src/app/(site)/[locale]/sss/page.tsx`, `src/app/(site)/[locale]/projeler/[slug]/page.tsx`

**Interfaces:**
- Consumes: `JsonLd` (T3), `articleJsonLd`/`softwareAppJsonLd`/`faqPageJsonLd`/`breadcrumbJsonLd` (T2), `lexicalToPlainText` (T1), `mediaUrl`, `pick`.

- [ ] **Step 1: Blog — Article + Breadcrumb** — `blog/[slug]/page.tsx` render'ında (içeriğin yanında, üstte),
  `data` yüklendikten sonra:
```tsx
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://redwall.tr';
  const postUrl = `${SITE_URL}/${locale}/blog/${slug}`;
  const articleLd = articleJsonLd({
    headline: baslik,
    description: aciklama,
    imageUrl: imgSrc ? (imgSrc.startsWith('http') ? imgSrc : `${SITE_URL}${imgSrc}`) : undefined,
    url: postUrl,
    authorName: 'Redwall',
  });
  const bcLd = breadcrumbJsonLd([
    { name: isTr ? 'Ana Sayfa' : 'Home', url: `${SITE_URL}/${locale}` },
    { name: 'Blog', url: `${SITE_URL}/${locale}/blog` },
    { name: baslik, url: postUrl },
  ]);
```
  ve JSX başına `<JsonLd data={articleLd} /><JsonLd data={bcLd} />`. (`baslik`/`aciklama`/`imgSrc`/`isTr`/`locale`
  bu dosyada mevcut; `datePublished` varsa `data`'daki tarih alanından `articleJsonLd`'ye eklenir — alan adı
  `payload-types` Post'tan doğrulanır, yoksa atlanır.) Importlar: `JsonLd`, `articleJsonLd`, `breadcrumbJsonLd`.

- [ ] **Step 2: Ürün — SoftwareApplication + Breadcrumb** — `yazilim/[urun]/page.tsx`: `data` (yayındaki ürün)
  yüklendikten sonra:
```tsx
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://redwall.tr';
  const urunUrl = `${SITE_URL}/${locale}/yazilim/${urun}`;
  const appLd = softwareAppJsonLd({ name: ad, description: undefined, url: urunUrl, category: 'BusinessApplication' });
  const bcLd = breadcrumbJsonLd([
    { name: isTr ? 'Ana Sayfa' : 'Home', url: `${SITE_URL}/${locale}` },
    { name: isTr ? 'Yazılım' : 'Software', url: `${SITE_URL}/${locale}/yazilim` },
    { name: ad, url: urunUrl },
  ]);
```
  JSX başına `<JsonLd data={appLd} /><JsonLd data={bcLd} />`. (`ad`/`urun`/`isTr`/`locale` mevcut; `description`
  ürün açıklaması richText ise `lexicalToPlainText(pick(aciklama))` ile eklenebilir — implementer mevcut değişkenlerden türetir.)

- [ ] **Step 3: SSS — FAQPage** — `sss/page.tsx`: `getFaqs()` sonucundan (soru/cevap `{tr,en}`):
```tsx
  const faqItems = (faqs ?? []).map((f) => ({
    question: pick(f.soru, locale) ?? '',
    answer: lexicalToPlainText(pick(f.cevap, locale)),
  }));
  const faqLd = faqPageJsonLd(faqItems);
```
  JSX başına `<JsonLd data={faqLd} />`. Importlar: `JsonLd`, `faqPageJsonLd`, `lexicalToPlainText`, `pick`.
  (`faqs`/`locale` bu dosyada mevcut; değilse `getFaqs()` çağrısı + `pick` importu eklenir.)

- [ ] **Step 4: Proje — Breadcrumb** — `projeler/[slug]/page.tsx`: `data` yüklendikten sonra:
```tsx
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://redwall.tr';
  const projeUrl = `${SITE_URL}/${locale}/projeler/${slug}`;
  const bcLd = breadcrumbJsonLd([
    { name: isTr ? 'Ana Sayfa' : 'Home', url: `${SITE_URL}/${locale}` },
    { name: isTr ? 'Projeler' : 'Projects', url: `${SITE_URL}/${locale}/projeler` },
    { name: baslik ?? slug, url: projeUrl },
  ]);
```
  JSX başına `<JsonLd data={bcLd} />`. (`baslik`/`slug`/`isTr`/`locale` mevcut değişkenlerden; değilse uyarlanır.)

- [ ] **Step 5: Doğrula** — `npx tsc --noEmit && npm run lint && npm run build` (0 error). Preview (TR+EN):
  blog detay → Article+Breadcrumb script'leri; ürün detay → SoftwareApplication+Breadcrumb; `/sss` → FAQPage
  (mainEntity dolu); proje detay → Breadcrumb. Hepsi geçerli JSON (view-source).

- [ ] **Step 6: Commit**
```bash
git add "src/app/(site)/[locale]/blog/[slug]/page.tsx" "src/app/(site)/[locale]/yazilim/[urun]/page.tsx" "src/app/(site)/[locale]/sss/page.tsx" "src/app/(site)/[locale]/projeler/[slug]/page.tsx"
git commit -m "feat: blog/ürün/SSS/proje sayfalarına JSON-LD yapısal veri"
```

---

### Task 5: OG görseli + article type + sitemap referansları

**Files:**
- Modify: `src/lib/metadata.ts`, `src/app/(site)/[locale]/blog/[slug]/page.tsx` (generateMetadata), `src/app/sitemap.ts`
- Create: `public/og-default.png` (marka OG görseli — mevcut logo/görsel kullanılabilir)

**Interfaces:**
- `buildMetadata` genişler: opsiyonel `gorselUrl?: string`, `type?: 'website' | 'article'`.

- [ ] **Step 1: metadata.ts OG genişlet** — `buildMetadata` imzasına `gorselUrl?: string` ve `type?: 'website' | 'article'` ekle; `openGraph`'a:
```ts
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://redwall.tr';
  const ogImage = gorselUrl ?? `${SITE_URL}/og-default.png`;
  // ...openGraph içinde:
    type: type ?? 'website',
    images: [{ url: ogImage }],
  // + twitter kartı:
  twitter: { card: 'summary_large_image', title: baslik, description: aciklama, images: [ogImage] },
```
  (Mevcut title/description/url/locale korunur.)

- [ ] **Step 2: OG görseli ekle** — `public/og-default.png` oluştur: marka görseli (mevcut bir logo/görsel
  kopyalanabilir; 1200×630 ideal ama mevcut varlık da olur). Yoksa `public/`'teki mevcut bir marka görseli
  yolunu Step 1'de varsayılan yap.

- [ ] **Step 3: Blog article type + kapak OG** — `blog/[slug]/page.tsx` `generateMetadata`: `buildMetadata(...)`
  çağrılarına `type: 'article'` ve (kapak varsa) `gorselUrl: <kapak mutlak url>` ekle. Kapak url'i
  `mediaUrl(data.kapak)` ile (mutlak değilse `${SITE_URL}` öne eklenir).

- [ ] **Step 4: Sitemap referansları** — `src/app/sitemap.ts`: `getReferences` import et; `Promise.all`'a ekle;
  yayındaki referansları locale başına `${SITE_URL}/${locale}/referanslar/${ref.slug}` olarak map'le (projeler/blog
  ile aynı desen; `slug`'ı olmayanları atla).

- [ ] **Step 5: Doğrula** — `npx tsc --noEmit && npm run lint && npm run build` (0 error). Preview: blog detay
  head'inde `og:type=article` + `og:image` + `twitter:card`; herhangi bir sayfada `og:image` varsayılan; sitemap
  (`/sitemap.xml`) referans detay url'lerini içerir.

- [ ] **Step 6: Commit**
```bash
git add src/lib/metadata.ts "src/app/(site)/[locale]/blog/[slug]/page.tsx" src/app/sitemap.ts public/og-default.png
git commit -m "feat: OG görseli + twitter card + blog article type + sitemap referansları"
```

---

### Task 6: Doğrulama + deploy

**Files:** (yok)

- [ ] **Step 1: Tam suite** — `npm test && npm run lint && npm run build` → PASS, 0 error.
- [ ] **Step 2: Preview uçtan uca** — layout Org+WebSite; blog Article+Breadcrumb+og:article; ürün SoftwareApp+Breadcrumb; /sss FAQPage; proje Breadcrumb; sitemap referansları. Hepsi geçerli JSON (view-source), TR+EN.
- [ ] **Step 3: Deploy** — `git checkout main && git merge --no-ff <branch> -m "Merge: SEO yapısal veri + OG + sitemap"`; `git push origin main`. CI: build + migrate (yeni migration YOK → no-op). `gh run watch`.
- [ ] **Step 4: Prod doğrulama** — sayfalar 200; view-source'ta JSON-LD script'leri; **Google Rich Results Test** (search.google.com/test/rich-results) ile bir blog + /sss + ana sayfa URL'i doğrula (Organization/Article/FAQPage tanınmalı); `sitemap.xml` referansları içerir; OG image sosyal önizlemede görünür (opsiyonel: metatags.io ile kontrol).

---

## Self-Review Notları
- **Spec kapsamı:** lexicalToPlainText (T1) ✓; jsonLd builder'ları (T2) ✓; JsonLd bileşeni + layout Org/WebSite (T3) ✓; sayfa bağlama blog/ürün/SSS/proje (T4) ✓; OG görseli+article type+sitemap (T5) ✓; deploy (T6) ✓.
- **Güvenlik:** JsonLd tek `dangerouslySetInnerHTML`, `<` kaçışlı; girdi sunucu-üretimi JSON.
- **Ship-safe:** builder'lar boş/null alanı atlar (kısmi geçerli schema); getSiteSettings/getFaqs `safe()`; JsonLd null'da null döner. Şema/CMS değişmez, migration yok.
- **Tip tutarlılığı:** builder imzaları T2'de sabit; T3/T4 primitifleri çıkarıp geçirir; lexicalToPlainText(T1) T4-SSS'te tüketilir; buildMetadata gorselUrl/type (T5) blog'da kullanılır.
- **Belirsizlik:** siteSettings alt-alan adları (iletisim/sosyal/sirketAdi/marka) `payload-types.ts SiteSetting`'ten kesinleştirilir (T3); en az name+url dolu geçerli Organization garanti. Blog `datePublished` alan adı Post tipinden (T4-blog); yoksa atlanır (builder opsiyonel).
