# Tipografi/Tablo Tema + Video/Ses Gömme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** (Faz A) `@tailwindcss/typography` kurup site temasına bağlamak + tabloları markaya uydurmak; (Faz B) tüm Lexical editörlere YouTube/Vimeo/SoundCloud/Spotify URL'si yapıştırarak video/ses gömme (dış platform embed).

**Architecture:** Faz A = tamamen CSS (`globals.css` + package). Faz B = saf URL-parser (`parseEmbedUrl`, TDD) + Payload `BlocksFeature` "Medya Gömme" bloğu (config seviyesi, tablo feature yanına) + `RichContent` blok converter + CSP `frame-src` allowlist. Şema DEĞİŞMEZ (blok jsonb'a serileşir) → migration YOK.

**Tech Stack:** Tailwind v4 (CSS-first), `@tailwindcss/typography`, Payload 3.85 (`@payloadcms/richtext-lexical` `BlocksFeature`), Next.js 16, TypeScript, Vitest.

## Global Constraints

- Lint: `@typescript-eslint/no-explicit-any` ERROR → `as unknown as <T>` / `unknown` kullan.
- Editör config seviyesinde tek kaynak (`payload.config.ts`); alan-seviye `editor` prop VERİLMEZ. Yeni feature'lar mevcut `EXPERIMENTAL_TableFeature()`'ın yanına eklenir.
- **importMap tuzağı:** client bileşenli Lexical feature (BlocksFeature) eklenince `npx payload generate:importmap` çalıştırılıp `src/app/(payload)/admin/importMap.js` commit'lenir — yoksa admin'de SESSİZCE çıkmaz (build hata vermez).
- **CSP `frame-src` bir KISITLAMADIR:** eklenince allowlist DIŞI tüm iframe'ler (mevcut OpenStreetMap haritası dahil) bloklanır → allowlist OSM + 4 platformu içermek ZORUNDA. Mevcut `frame-ancestors 'self'` + `X-Frame-Options: SAMEORIGIN` KORUNUR. `script-src`/`style-src` EKLENMEZ (Payload /admin inline script'lerini bozar — [next.config.ts:23-26] yorumu).
- Tailwind v4 CSS-first: `tailwind.config.*` YOK; eklenti `globals.css`'e `@plugin` ile eklenir.
- Site tema değişkenleri (`globals.css`) light + `.dark`'ta otomatik flip eder: `--foreground`, `--muted`, `--border`, `--surface`, `--primary`. prose renkleri bunlara bağlanınca dark otomatik doğru olur.
- Faz A ve Faz B bağımsız; her task `npx tsc --noEmit && npm run lint && npm run build` yeşil olmalı. Migration YOK — `payload migrate:create` ÇALIŞTIRMA (blok jsonb'da). `payload-types.ts` `MediaEmbedBlock` arayüzüyle güncellenirse commit'e dahil et.
- Render altyapısı MEVCUT: `@/components/ui/RichContent` (`<RichText>`), `@/lib/lexical/plainToLexical`.

---

### Task 1 (Faz A): Typography eklentisi + prose tema + tablo tema

**Files:**
- Modify: `package.json` (+`@tailwindcss/typography` devDependency), `package-lock.json`
- Modify: `src/app/globals.css`

**Interfaces:** (yok — CSS/paket)

- [ ] **Step 1: Eklentiyi kur** — Run: `npm install -D @tailwindcss/typography`
  Expected: `package.json` devDependencies'e eklenir, lock güncellenir, 0 vulnerability hatası kırıcı değil.

- [ ] **Step 2: globals.css'e @plugin + prose tema + tablo tema ekle** — `src/app/globals.css`:
  `@import "tailwindcss";` satırının HEMEN ALTINA `@plugin "@tailwindcss/typography";` ekle.
  Dosyanın SONUNA (satır 39'dan sonra) şu bloğu ekle:

```css
/* Zengin içerik tipografisi — prose renklerini site temasına bağla.
   Değişkenler .dark'ta otomatik flip ettiğinden hem prose hem prose-invert doğru olur. */
.prose {
  --tw-prose-body: var(--foreground);
  --tw-prose-headings: var(--foreground);
  --tw-prose-lead: var(--muted);
  --tw-prose-links: var(--primary);
  --tw-prose-bold: var(--foreground);
  --tw-prose-counters: var(--muted);
  --tw-prose-bullets: var(--muted);
  --tw-prose-hr: var(--border);
  --tw-prose-quotes: var(--foreground);
  --tw-prose-quote-borders: var(--primary);
  --tw-prose-captions: var(--muted);
  --tw-prose-code: var(--foreground);
  --tw-prose-pre-code: var(--foreground);
  --tw-prose-pre-bg: var(--surface);
  --tw-prose-th-borders: var(--border);
  --tw-prose-td-borders: var(--border);
  /* prose-invert (dark:prose-invert) aynı değişkenlere bağlanır → çift doğru */
  --tw-prose-invert-body: var(--foreground);
  --tw-prose-invert-headings: var(--foreground);
  --tw-prose-invert-lead: var(--muted);
  --tw-prose-invert-links: var(--primary);
  --tw-prose-invert-bold: var(--foreground);
  --tw-prose-invert-counters: var(--muted);
  --tw-prose-invert-bullets: var(--muted);
  --tw-prose-invert-hr: var(--border);
  --tw-prose-invert-quotes: var(--foreground);
  --tw-prose-invert-quote-borders: var(--primary);
  --tw-prose-invert-captions: var(--muted);
  --tw-prose-invert-code: var(--foreground);
  --tw-prose-invert-pre-code: var(--foreground);
  --tw-prose-invert-pre-bg: var(--surface);
  --tw-prose-invert-th-borders: var(--border);
  --tw-prose-invert-td-borders: var(--border);
}
/* Tablo tema ince ayar: başlık satırı vurgusu + mobil yatay kaydırma */
.prose :where(table) { display: block; overflow-x: auto; }
.prose :where(thead) { background: var(--surface); }
.prose :where(th, td) { padding: 0.5rem 0.75rem; }
```

- [ ] **Step 3: Doğrula (build)** — Run: `npx tsc --noEmit && npm run lint && npm run build`
  Expected: 0 error, build OK (48 sayfa).

- [ ] **Step 4: Preview — 11 prose sayfası (TR+EN, light+dark)** — dev sunucuyu başlat; şu temsilcileri aç ve
  içeriğin bozulmadığını doğrula: bir blog (`/tr/blog/<slug>`), bir proje (`/tr/projeler/<slug>`),
  `/tr/yazilim/yanginpro`, `/tr/yasal/kvkk-aydinlatma`, `/tr/kurumsal/hakkimizda`, `/tr/sss`,
  `/tr/referanslar` (+ bir detay). Ayrıca `ProductGrid`/`ProductFeatures` içeren `/tr/yazilim`.
  prose tipografisi düzgün (başlık/paragraf/liste aralıkları), dark okunur. Bir sayfada prose istenmeyen
  bir bloğu bozarsa (ör. kart içi başlık aşırı büyük): o bloğa `not-prose` ekle VEYA o noktadaki `prose`
  sınıfını kaldır (minimal, hedefli). Bu düzeltmeler gerekirse aynı task içinde yapılır.

- [ ] **Step 5: Commit**
```bash
git add package.json package-lock.json src/app/globals.css
git commit -m "feat: @tailwindcss/typography kuruldu + prose site temasına bağlandı + tablo tema"
```

---

### Task 2 (Faz B): parseEmbedUrl saf fonksiyonu (TDD)

**Files:**
- Create: `src/lib/embed/parseEmbedUrl.ts`
- Test: `src/lib/embed/parseEmbedUrl.test.ts`

**Interfaces:**
- Produces: `parseEmbedUrl(raw: string): EmbedResult | null` ve `type EmbedResult = { platform: 'youtube'|'vimeo'|'soundcloud'|'spotify'; embedSrc: string; tur: 'video'|'ses'; oran: '16/9' | null }`

- [ ] **Step 1: Failing test yaz** — `src/lib/embed/parseEmbedUrl.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { parseEmbedUrl } from './parseEmbedUrl';

describe('parseEmbedUrl', () => {
  it('YouTube watch → nocookie embed', () => {
    expect(parseEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({
      platform: 'youtube', embedSrc: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', tur: 'video', oran: '16/9',
    });
  });
  it('youtu.be kısa link', () => {
    expect(parseEmbedUrl('https://youtu.be/dQw4w9WgXcQ')?.embedSrc).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });
  it('youtube /embed formu', () => {
    expect(parseEmbedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')?.platform).toBe('youtube');
  });
  it('Vimeo → player embed', () => {
    expect(parseEmbedUrl('https://vimeo.com/123456789')).toEqual({
      platform: 'vimeo', embedSrc: 'https://player.vimeo.com/video/123456789', tur: 'video', oran: '16/9',
    });
  });
  it('SoundCloud → w.soundcloud player, ses, oran null', () => {
    const r = parseEmbedUrl('https://soundcloud.com/artist/track-name');
    expect(r?.platform).toBe('soundcloud');
    expect(r?.tur).toBe('ses');
    expect(r?.oran).toBeNull();
    expect(r?.embedSrc).toContain('https://w.soundcloud.com/player/?url=');
    expect(r?.embedSrc).toContain(encodeURIComponent('https://soundcloud.com/artist/track-name'));
  });
  it('Spotify track → embed', () => {
    expect(parseEmbedUrl('https://open.spotify.com/track/abc123XYZ')).toEqual({
      platform: 'spotify', embedSrc: 'https://open.spotify.com/embed/track/abc123XYZ', tur: 'ses', oran: null,
    });
  });
  it('Spotify episode', () => {
    expect(parseEmbedUrl('https://open.spotify.com/episode/xyz789')?.embedSrc).toBe('https://open.spotify.com/embed/episode/xyz789');
  });
  it('tanınmayan host → null', () => {
    expect(parseEmbedUrl('https://example.com/video/1')).toBeNull();
  });
  it('javascript: şeması → null', () => {
    expect(parseEmbedUrl('javascript:alert(1)')).toBeNull();
  });
  it('geçersiz URL → null', () => {
    expect(parseEmbedUrl('not a url')).toBeNull();
  });
  it('boş → null', () => {
    expect(parseEmbedUrl('')).toBeNull();
  });
});
```

- [ ] **Step 2: Test'in fail ettiğini gör** — Run: `npm test -- parseEmbedUrl`
  Expected: FAIL ("parseEmbedUrl is not a function" / modül yok).

- [ ] **Step 3: Implementasyon** — `src/lib/embed/parseEmbedUrl.ts`:

```ts
export type EmbedResult = {
  platform: 'youtube' | 'vimeo' | 'soundcloud' | 'spotify';
  embedSrc: string;
  tur: 'video' | 'ses';
  oran: '16/9' | null;
};

/**
 * Desteklenen platform URL'sini güvenli embed src'ye çevirir.
 * Tanınmayan host, http(s) dışı şema veya geçersiz URL → null (ham iframe basılmaz).
 */
export function parseEmbedUrl(raw: string): EmbedResult | null {
  if (!raw || typeof raw !== 'string') return null;
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  const host = u.hostname.replace(/^www\./, '').toLowerCase();

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const id = u.searchParams.get('v') ?? (u.pathname.startsWith('/embed/') ? u.pathname.slice(7) : '');
    if (!id) return null;
    return { platform: 'youtube', embedSrc: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`, tur: 'video', oran: '16/9' };
  }
  if (host === 'youtu.be') {
    const id = u.pathname.slice(1);
    if (!id) return null;
    return { platform: 'youtube', embedSrc: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`, tur: 'video', oran: '16/9' };
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const m = u.pathname.match(/(\d+)/);
    if (!m) return null;
    return { platform: 'vimeo', embedSrc: `https://player.vimeo.com/video/${m[1]}`, tur: 'video', oran: '16/9' };
  }
  if (host === 'soundcloud.com') {
    return { platform: 'soundcloud', embedSrc: `https://w.soundcloud.com/player/?url=${encodeURIComponent(u.href)}&color=%23c41e3a`, tur: 'ses', oran: null };
  }
  if (host === 'spotify.com' || host === 'open.spotify.com') {
    const m = u.pathname.match(/^\/(track|episode|album|playlist|show)\/([A-Za-z0-9]+)/);
    if (!m) return null;
    return { platform: 'spotify', embedSrc: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, tur: 'ses', oran: null };
  }
  return null;
}
```

- [ ] **Step 4: Test'in geçtiğini gör** — Run: `npm test -- parseEmbedUrl`
  Expected: PASS (12 test).

- [ ] **Step 5: Commit**
```bash
git add src/lib/embed/parseEmbedUrl.ts src/lib/embed/parseEmbedUrl.test.ts
git commit -m "feat: parseEmbedUrl — platform URL → güvenli embed src (YouTube/Vimeo/SoundCloud/Spotify)"
```

---

### Task 3 (Faz B): Medya Gömme bloğu + config + importMap

**Files:**
- Create: `src/blocks/MediaEmbed.ts`
- Modify: `payload.config.ts`
- Modify: `src/app/(payload)/admin/importMap.js` (üretilir)
- Modify: `src/payload-types.ts` (üretilir — `MediaEmbedBlock` arayüzü)

**Interfaces:**
- Produces: `MediaEmbed` Payload `Block` (slug `'mediaEmbed'`, fields `url` [text, required], `baslik` [text, localized]).

- [ ] **Step 1: Blok tanımı** — `src/blocks/MediaEmbed.ts`:

```ts
import type { Block } from 'payload';

export const MediaEmbed: Block = {
  slug: 'mediaEmbed',
  interfaceName: 'MediaEmbedBlock',
  labels: { singular: 'Medya Gömme', plural: 'Medya Gömmeler' },
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
      label: 'Bağlantı (YouTube / Vimeo / SoundCloud / Spotify)',
    },
    {
      name: 'baslik',
      type: 'text',
      localized: true,
      label: 'Başlık / açıklama (opsiyonel)',
    },
  ],
};
```

- [ ] **Step 2: Config'e BlocksFeature ekle** — `payload.config.ts`: import satırını
  `import { lexicalEditor, EXPERIMENTAL_TableFeature, BlocksFeature } from '@payloadcms/richtext-lexical'`
  yap; `import { MediaEmbed } from './src/blocks/MediaEmbed'` ekle; `editor`'ı:

```ts
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      EXPERIMENTAL_TableFeature(),
      BlocksFeature({ blocks: [MediaEmbed] }),
    ],
  }),
```

- [ ] **Step 3: importMap üret** — Run: `npx payload generate:importmap`
  Expected: `src/app/(payload)/admin/importMap.js` güncellenir (BlocksFeatureClient/blok bileşeni eklenir).
  Doğrula: `grep -ci "block" "src/app/(payload)/admin/importMap.js"` > 0.

- [ ] **Step 4: Tip + build doğrula** — Run: `npx payload generate:types && npx tsc --noEmit && npm run lint && npm run build`
  Expected: `src/payload-types.ts`'e `MediaEmbedBlock` eklenir; 0 error; build OK. (Migration YOK — blok jsonb'da; `payload migrate:create` çalıştırma. `payload migrate:status` çalıştırırsan bekleyen migration olmamalı.)

- [ ] **Step 5: Commit**
```bash
git add src/blocks/MediaEmbed.ts payload.config.ts "src/app/(payload)/admin/importMap.js" src/payload-types.ts
git commit -m "feat: Medya Gömme bloğu (BlocksFeature) config'e eklendi + importMap"
```

---

### Task 4 (Faz B): MediaEmbed render + RichContent converter + CSP

**Files:**
- Create: `src/components/ui/MediaEmbed.tsx`
- Modify: `src/components/ui/RichContent.tsx`
- Modify: `next.config.ts:35` (CSP `frame-src`)

**Interfaces:**
- Consumes: `parseEmbedUrl` (Task 2), `mediaEmbed` blok alanları `url`/`baslik` (Task 3).

- [ ] **Step 1: Render bileşeni** — `src/components/ui/MediaEmbed.tsx`:

```tsx
import { parseEmbedUrl } from '@/lib/embed/parseEmbedUrl';

/** Lexical mediaEmbed bloğunu güvenli, responsive oynatıcı iframe'ine çevirir.
 *  Tanınmayan URL → düz bağlantı fallback (asla ham iframe). */
export function MediaEmbed({ url, baslik }: { url?: unknown; baslik?: unknown }) {
  const src = typeof url === 'string' ? url : '';
  const caption = typeof baslik === 'string' && baslik.trim() ? baslik.trim() : undefined;
  const parsed = parseEmbedUrl(src);

  if (!parsed) {
    if (!src) return null;
    return (
      <a href={src} target="_blank" rel="noopener noreferrer nofollow" className="text-primary underline">
        {caption ?? src}
      </a>
    );
  }

  const title = caption ?? parsed.platform;
  const iframe = (
    <iframe
      src={parsed.embedSrc}
      title={title}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      allow="autoplay; encrypted-media; picture-in-picture; clipboard-write; fullscreen"
      allowFullScreen
      className={parsed.oran ? 'absolute inset-0 h-full w-full' : 'w-full'}
      style={parsed.oran ? undefined : { height: parsed.platform === 'spotify' ? 152 : 166 }}
    />
  );

  return (
    <figure className="my-6 not-prose">
      {parsed.oran ? (
        <div className="relative w-full overflow-hidden rounded-xl border border-border" style={{ aspectRatio: '16 / 9' }}>
          {iframe}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">{iframe}</div>
      )}
      {caption && <figcaption className="mt-2 text-sm text-muted">{caption}</figcaption>}
    </figure>
  );
}
```

- [ ] **Step 2: RichContent'e blok converter bağla** — `src/components/ui/RichContent.tsx`:
  `MediaEmbed` import et (`import { MediaEmbed } from '@/components/ui/MediaEmbed';`) ve `<RichText>`'e
  `converters` prop'u ekle (Payload varsayılanlarını koruyarak blok ekle). `no-explicit-any` için
  parametreleri `unknown` alıp daralt:

```tsx
import { RichText } from '@payloadcms/richtext-lexical/react';
import { normalizeToLexical } from '@/lib/lexical/plainToLexical';
import { MediaEmbed } from '@/components/ui/MediaEmbed';

type RichData = Parameters<typeof RichText>[0]['data'];
type ConvertersProp = Parameters<typeof RichText>[0]['converters'];

export function RichContent({ value, className }: { value: unknown; className?: string }) {
  const data = normalizeToLexical(value);
  if (!data) return null;
  const converters = (({ defaultConverters }: { defaultConverters: Record<string, unknown> }) => ({
    ...defaultConverters,
    blocks: {
      mediaEmbed: ({ node }: { node: { fields: { url?: string; baslik?: string } } }) => (
        <MediaEmbed url={node.fields?.url} baslik={node.fields?.baslik} />
      ),
    },
  })) as unknown as ConvertersProp;
  return (
    <div className={className}>
      <RichText data={data as unknown as RichData} converters={converters} />
    </div>
  );
}
```

  NOT: `converters` prop'unun tam generic imzası `@payloadcms/richtext-lexical/react` sürümüne göre
  değişebilir; implementer `node_modules/.../react` tiplerinden `defaultConverters` adını ve blok
  converter imzasını DOĞRULAR ve `as unknown as ConvertersProp` cast'ini lint/tsc geçecek şekilde ayarlar.
  Tablo render'ı bu değişiklikten ETKİLENMEZ (defaultConverters yayılıyor).

- [ ] **Step 3: CSP frame-src allowlist** — `next.config.ts` satır 35, `Content-Security-Policy` değerini
  değiştir (OSM haritası + 4 platform ZORUNLU; `frame-ancestors` korunur):

```ts
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; frame-src 'self' https://www.openstreetmap.org https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com https://w.soundcloud.com https://open.spotify.com" },
```

- [ ] **Step 4: Doğrula (build)** — Run: `npx tsc --noEmit && npm run lint && npm run build`
  Expected: 0 error, build OK.

- [ ] **Step 5: Preview — gömme + harita + CSP** — dev sunucuyu başlat.
  (a) `/admin`'de bir richText alanına (ör. bir blog `icerik` / Kurumsal `girisLead`) `/` menüsünden
  **Medya Gömme** ekle, sırayla 4 platformdan birer gerçek URL yapıştır + kaydet. (b) O içeriği taşıyan
  sayfayı aç → 4 oynatıcı responsive + dark render; tarayıcı konsolunda **CSP frame-src ihlali yok**.
  (c) `/tr/iletisim` haritası HÂLÂ yükleniyor (OSM allowlist doğru). (d) Geçersiz bir URL yapıştır →
  düz bağlantı fallback. Test verisini geri al (dev DB kirli kalmasın).

- [ ] **Step 6: Commit**
```bash
git add src/components/ui/MediaEmbed.tsx src/components/ui/RichContent.tsx next.config.ts
git commit -m "feat: Medya Gömme render + RichContent blok converter + CSP frame-src allowlist"
```

---

### Task 5: Doğrulama + deploy

**Files:** (yok)

- [ ] **Step 1: Tam suite** — Run: `npm test && npm run lint && npm run build` → PASS, 0 error, build OK.
- [ ] **Step 2: Preview uçtan uca** — kozmetik (11 prose sayfası temsilcileri TR+EN, light+dark bozulmamış;
  tablolar temalı) + gömme (4 platform admin'de eklenebilir + sitede render + harita sağlam + CSP temiz).
- [ ] **Step 3: Deploy** — `git checkout main && git merge --no-ff <branch> -m "Merge: tipografi/tablo tema + video/ses gömme"`;
  `git push origin main`. CI: build + `payload migrate` (yeni migration YOK → no-op/idempotent). `gh run watch`.
- [ ] **Step 4: Prod doğrulama** — kurumsal/blog/proje/yasal sayfalar 200 + prose tipografi görünür;
  `/admin`'de Medya Gömme bloğu `/` menüsünde çıkar (importMap doğru); bir test gömme sitede render;
  `/tr/iletisim` haritası sağlam; `curl -sI https://redwall.tr | grep -i content-security` → `frame-src` allowlist içeriyor;
  diğer sayfalar 200.

---

## Self-Review Notları
- **Spec kapsamı:** Kozmetik spec (typography kur + tema bağla + tablo tema) → Task 1 ✓. Gömme spec:
  parseEmbedUrl (T2) ✓, blok+config+importMap (T3) ✓, render+converter+CSP (T4) ✓, deploy (T5) ✓.
- **Migration yok:** Faz B blok jsonb'da serileşir; `payload-types.ts` tip değişir ama DB şeması değişmez.
- **CSP kritik:** `frame-src` OSM + 4 platform içerir (mevcut harita kırılmasın); `frame-ancestors`/`X-Frame-Options` korunur; `script-src` eklenmez (admin bozulmaz).
- **importMap:** T3 Step 3 `generate:importmap` + commit — tablo feature dersinin tekrarı.
- **Tip tutarlılığı:** `EmbedResult`/`parseEmbedUrl` imzası T2'de tanımlı, T4 MediaEmbed onu tüketir; blok alanları `url`/`baslik` T3'te tanımlı, T4 converter onları okur.
- **Ship-safe:** MediaEmbed null-güvenli (geçersiz URL → fallback/null); RichContent converter defaultConverters'ı korur (tablo bozulmaz); prose fallback string'ler çalışır.
- **YAGNI:** kendi dosya yükleme, oEmbed, ekstra platform, playlist parametreleri kapsam dışı.
