# Redwall Kurumsal Web Sitesi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redwall'un üç iş kolunu (yazılım, danışmanlık, mühendislik) ayıran, iki dilli (TR/EN), koyu/açık temalı, Sanity CMS destekli çok sayfalı kurumsal web sitesini kurmak.

**Architecture:** Next.js 16 App Router; rotalar `src/app/[locale]/` altında; içerik Sanity'den GROQ ile çekilir; UI çentiği next-intl `messages`'tan gelir; tema `next-themes` ile sınıf-tabanlı. İçerik olmadan da derlenir (boş durumlar). Mantık taşıyan birimler (locale düzleştirme, proje filtreleme, form validasyonu, GROQ eşleme) Vitest ile test edilir; sunum sayfaları `npm run build` + render kontrolüyle doğrulanır.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, TypeScript, next-intl, next-themes, Sanity (sanity, next-sanity, @sanity/client, @sanity/image-url, @sanity/vision), Vitest + @testing-library/react.

## Global Constraints

- Diller: `tr` (varsayılan) + `en`. Tüm rotalar `/[locale]/...` ön ekli; `/` → `/tr` yönlenir.
- Slug'lar her iki dilde ortak (örn. `/en/yazilim`); çeviri içerikte.
- Marka renkleri: primary `#c41e3a`, koyu zemin `#141416`, amber `#F59E0B`, lacivert `#1E2A3A`, açık zemin `#FAFAFA`, metin `#1A1A1A`. Tüm renkler açık/koyu için CSS değişkeni; Tailwind `dark:` `class` stratejisi.
- Çevrilebilir Sanity alanları `{ tr, en }` nesne tipleri (`localeString`/`localeText`/`localePortableText`).
- UI çentik metinleri (buton/menü/form/validasyon) Sanity'de DEĞİL, `messages/{tr,en}.json`'da.
- Backend e-posta gönderimi KAPSAM DIŞI: formlar client-side validasyonlu, gönderim sahte-başarı + console TODO.
- Ödeme / müşteri paneli / kimlik doğrulama: projede HİÇ yer almaz.
- Site, Sanity bağlı olmasa bile `npm run build` ile temiz derlenmeli (boş durumlar).
- Her commit: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` ile bitmeli.
- Çalışma dalı: `feat/kurumsal-web-sitesi`.

## Dosya Yapısı (hedef)

```
src/
├── middleware.ts                    next-intl locale yönlendirme
├── i18n/{routing,request,navigation}.ts
├── messages/{tr,en}.json            UI çentik metinleri
├── lib/{locales.ts, utils.ts}       Locale sabitleri, cn() yardımcı
├── sanity/
│   ├── env.ts
│   ├── lib/{client.ts,image.ts,fetch.ts,queries.ts}
│   ├── schemaTypes/{index.ts, objects/*, documents/*}
│   └── structure.ts
├── sanity.config.ts
├── app/
│   ├── layout.tsx                   kök: ThemeProvider, fontlar
│   ├── globals.css
│   ├── sitemap.ts, robots.ts
│   ├── studio/[[...tool]]/page.tsx
│   └── [locale]/
│       ├── layout.tsx               NextIntlClientProvider, Header, Footer
│       ├── page.tsx, not-found.tsx
│       ├── yazilim/page.tsx, yazilim/[urun]/page.tsx
│       ├── danismanlik/page.tsx, muhendislik/page.tsx
│       ├── projeler/page.tsx, projeler/[slug]/page.tsx
│       ├── referanslar/page.tsx
│       ├── kurumsal/{hakkimizda,vizyon-misyon,kalite-belgeler}/page.tsx
│       ├── sss/page.tsx, blog/page.tsx, blog/[slug]/page.tsx
│       ├── kariyer/page.tsx, teklif/page.tsx, iletisim/page.tsx
├── components/
│   ├── ui/        Button, Section, PageHeader, Card, Badge, Breadcrumb, Cta,
│   │              Stat, Accordion, LogoWall, PortableText
│   ├── layout/    Header, Footer, ThemeToggle, LocaleSwitcher, MobileNav
│   └── sections/  Hero, ServiceCards, ProductGrid, ProjectsExplorer,
│                  ProductFeatures, ContactForm, QuoteForm, ...
└── types/index.ts
```

---

## MILESTONE 0 — Proje Temeli & Altyapı

Çıktı: TR/EN locale ön ekiyle çalışan, koyu/açık temalı, Header/Footer iskeletli boş site derlenir ve ayağa kalkar.

### Task 0.1: Bağımlılıklar ve test altyapısı

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`, `vitest.setup.ts`

**Interfaces:**
- Produces: `npm test` (vitest run), `npm run test:watch`.

- [ ] **Step 1: Bağımlılıkları kur**

```bash
npm install next-intl next-themes sanity next-sanity @sanity/client @sanity/image-url @sanity/vision @portabletext/react
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 2: `vitest.config.ts` oluştur**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', setupFiles: ['./vitest.setup.ts'], globals: true },
  resolve: { alias: { '@': resolve(__dirname, './src') } },
});
```

- [ ] **Step 3: `vitest.setup.ts` oluştur**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: `package.json` scripts ekle**

`scripts` içine: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 5: Doğrula ve commit**

Run: `npm test` → Expected: "No test files found" (hata değil, exit 0 değilse `--passWithNoTests` ekle).
```bash
git add package.json package-lock.json vitest.config.ts vitest.setup.ts
git commit -m "chore: next-intl, next-themes, sanity ve vitest kurulumu"
```

### Task 0.2: Tasarım token'ları (globals.css, açık/koyu)

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: CSS değişkenleri `--background, --foreground, --primary, --primary-light, --primary-dark, --amber, --navy, --surface, --border, --muted`; Tailwind tema renkleri `bg-background, text-foreground, bg-primary, ...`; `dark` sınıfı stratejisi.

- [ ] **Step 1: `globals.css`'i yaz**

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

:root {
  --background: #fafafa;  --foreground: #1a1a1a;
  --surface: #ffffff;     --border: #e5e7eb;     --muted: #6b7280;
  --primary: #c41e3a;     --primary-light: #e63950; --primary-dark: #9a1830;
  --amber: #f59e0b;       --navy: #1e2a3a;
}
.dark {
  --background: #0e0e10;  --foreground: #ededf0;
  --surface: #18181b;     --border: #27272a;     --muted: #a1a1aa;
  --primary: #e63950;     --primary-light: #f0566c; --primary-dark: #c41e3a;
  --amber: #fbbf24;       --navy: #cbd5e1;
}

@theme inline {
  --color-background: var(--background); --color-foreground: var(--foreground);
  --color-surface: var(--surface); --color-border: var(--border);
  --color-muted: var(--muted); --color-primary: var(--primary);
  --color-primary-light: var(--primary-light); --color-primary-dark: var(--primary-dark);
  --color-amber: var(--amber); --color-navy: var(--navy);
  --font-sans: var(--font-sans); --font-display: var(--font-display);
}

html { scroll-behavior: smooth; }
body { background: var(--background); color: var(--foreground); }

/* Blueprint çizgi dokusu (mühendislik motifi) */
.blueprint-grid {
  background-image:
    linear-gradient(var(--border) 1px, transparent 1px),
    linear-gradient(90deg, var(--border) 1px, transparent 1px);
  background-size: 32px 32px;
}
.text-gradient {
  background: linear-gradient(135deg, var(--primary), var(--amber));
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
```

- [ ] **Step 2: Derleme kontrolü ve commit**

Run: `npm run build` → Expected: PASS (mevcut sayfa hâlâ var; uyarı olabilir).
```bash
git add src/app/globals.css
git commit -m "style: açık/koyu tema token'ları ve marka renkleri"
```

### Task 0.3: Locale sabitleri ve cn() yardımcı

**Files:**
- Create: `src/lib/locales.ts`, `src/lib/utils.ts`, `src/types/index.ts`
- Test: `src/lib/locales.test.ts`

**Interfaces:**
- Produces: `type Locale = 'tr' | 'en'`; `LOCALES: Locale[]`; `DEFAULT_LOCALE: Locale`; `isLocale(x): x is Locale`; `type LocaleString = Record<Locale, string>`; `pick<T>(field: Record<Locale,T> | undefined, locale: Locale): T | undefined`; `cn(...classes)`.

- [ ] **Step 1: Testi yaz (`src/lib/locales.test.ts`)**

```ts
import { describe, it, expect } from 'vitest';
import { isLocale, pick, DEFAULT_LOCALE } from './locales';

describe('isLocale', () => {
  it('tr/en için true, diğerleri için false', () => {
    expect(isLocale('tr')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('de')).toBe(false);
  });
});
describe('pick', () => {
  it('aktif locale değerini döndürür', () => {
    expect(pick({ tr: 'Merhaba', en: 'Hello' }, 'en')).toBe('Hello');
  });
  it('aktif locale boşsa varsayılana düşer', () => {
    expect(pick({ tr: 'Merhaba', en: '' }, 'en')).toBe('Merhaba');
  });
  it('alan undefined ise undefined döner', () => {
    expect(pick(undefined, 'tr')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `npm test -- locales` → Expected: FAIL (module not found).

- [ ] **Step 3: `src/lib/locales.ts` yaz**

```ts
export type Locale = 'tr' | 'en';
export const LOCALES: Locale[] = ['tr', 'en'];
export const DEFAULT_LOCALE: Locale = 'tr';
export type LocaleString = Record<Locale, string>;

export function isLocale(x: string): x is Locale {
  return (LOCALES as string[]).includes(x);
}
export function pick<T>(field: Record<Locale, T> | undefined, locale: Locale): T | undefined {
  if (!field) return undefined;
  const v = field[locale];
  if (v === '' || v === undefined || v === null) return field[DEFAULT_LOCALE];
  return v;
}
```

- [ ] **Step 4: `src/lib/utils.ts` yaz**

```ts
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
```

- [ ] **Step 5: `src/types/index.ts` yaz**

```ts
export type { Locale, LocaleString } from '@/lib/locales';
export type IsKolu = 'yazilim' | 'danismanlik' | 'muhendislik';
export type ProjeDurumu = 'devam-eden' | 'tamamlandi';
```

- [ ] **Step 6: Testi çalıştır, geç, commit**

Run: `npm test -- locales` → Expected: PASS.
```bash
git add src/lib src/types
git commit -m "feat: locale sabitleri, pick() yerelleştirme yardımcısı ve cn()"
```

### Task 0.4: next-intl yapılandırması ve middleware

**Files:**
- Create: `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/i18n/navigation.ts`, `src/middleware.ts`
- Modify: `next.config.ts`

**Interfaces:**
- Consumes: `LOCALES`, `DEFAULT_LOCALE` (Task 0.3).
- Produces: `routing` objesi; `i18n/navigation` → `{ Link, redirect, usePathname, useRouter, getPathname }`; middleware locale algılama.

- [ ] **Step 1: `src/i18n/routing.ts`**

```ts
import { defineRouting } from 'next-intl/routing';
import { LOCALES, DEFAULT_LOCALE } from '@/lib/locales';

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
});
```

- [ ] **Step 2: `src/i18n/navigation.ts`**

```ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

- [ ] **Step 3: `src/i18n/request.ts`**

```ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { hasLocale } from 'next-intl';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return { locale, messages: (await import(`../messages/${locale}.json`)).default };
});
```

- [ ] **Step 4: `src/middleware.ts`**

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|studio|_next|_vercel|.*\\..*).*)'],
};
```

- [ ] **Step 5: `next.config.ts`'e plugin ekle**

```ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const nextConfig: NextConfig = {};
export default withNextIntl(nextConfig);
```

- [ ] **Step 6: Commit** (derleme Task 0.5 sonrası doğrulanır)

```bash
git add src/i18n src/middleware.ts next.config.ts
git commit -m "feat: next-intl yönlendirme, request config ve middleware"
```

### Task 0.5: Kök + [locale] layout, messages seed, taşıma

**Files:**
- Create: `src/messages/tr.json`, `src/messages/en.json`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`
- Modify: `src/app/layout.tsx`
- Delete: eski `src/app/page.tsx` (içerik [locale]'e taşınır), eski tek-sayfa bileşen kullanımları

**Interfaces:**
- Consumes: `routing` (0.4), token'lar (0.2).
- Produces: `getMessages`/`useTranslations` için `messages` ağacı; `[locale]/layout` Header/Footer'ı sarar; `generateStaticParams` her locale'i üretir.

- [ ] **Step 1: `src/messages/tr.json` (başlangıç çentik metinleri)**

```json
{
  "nav": {
    "yazilim": "Yazılım", "danismanlik": "Danışmanlık", "muhendislik": "Mühendislik",
    "projeler": "Projeler", "kurumsal": "Kurumsal", "hakkimizda": "Hakkımızda",
    "vizyonMisyon": "Vizyon & Misyon", "kaliteBelgeler": "Kalite & Belgeler",
    "dahaFazla": "Daha Fazla", "referanslar": "Referanslar", "sss": "S.S.S.",
    "blog": "Blog", "kariyer": "Kariyer", "iletisim": "İletişim", "teklifIste": "Teklif İste"
  },
  "common": {
    "detayliBilgi": "Detaylı bilgi", "tumProjeler": "Tüm projeler",
    "teklifAl": "Teklif Al", "demoTalep": "Demo Talep Et", "gonder": "Gönder",
    "yukleniyor": "Yükleniyor...", "bosVeri": "Henüz içerik eklenmedi.",
    "tema": "Tema", "dil": "Dil"
  },
  "form": {
    "ad": "Ad Soyad", "kurum": "Kurum", "email": "E-posta", "telefon": "Telefon",
    "mesaj": "Mesaj", "isKolu": "İlgili Hizmet", "il": "İl", "metrekare": "Bina m²",
    "zorunlu": "Bu alan zorunludur", "gecersizEmail": "Geçerli bir e-posta girin",
    "basarili": "Talebiniz alındı. En kısa sürede dönüş yapacağız."
  }
}
```

- [ ] **Step 2: `src/messages/en.json` (aynı anahtarlar, İngilizce)**

```json
{
  "nav": {
    "yazilim": "Software", "danismanlik": "Consulting", "muhendislik": "Engineering",
    "projeler": "Projects", "kurumsal": "Company", "hakkimizda": "About",
    "vizyonMisyon": "Vision & Mission", "kaliteBelgeler": "Quality & Certificates",
    "dahaFazla": "More", "referanslar": "References", "sss": "FAQ",
    "blog": "Blog", "kariyer": "Careers", "iletisim": "Contact", "teklifIste": "Get a Quote"
  },
  "common": {
    "detayliBilgi": "Learn more", "tumProjeler": "All projects",
    "teklifAl": "Get a Quote", "demoTalep": "Request a Demo", "gonder": "Send",
    "yukleniyor": "Loading...", "bosVeri": "No content added yet.",
    "tema": "Theme", "dil": "Language"
  },
  "form": {
    "ad": "Full Name", "kurum": "Company", "email": "Email", "telefon": "Phone",
    "mesaj": "Message", "isKolu": "Related Service", "il": "City", "metrekare": "Building m²",
    "zorunlu": "This field is required", "gecersizEmail": "Enter a valid email",
    "basarili": "Your request has been received. We'll get back to you shortly."
  }
}
```

- [ ] **Step 3: Kök `src/app/layout.tsx` (fontlar + ThemeProvider sarmalı)**

```tsx
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/layout/ThemeProvider';

const sans = Geist({ variable: '--font-sans', subsets: ['latin'] });
const display = Space_Grotesk({ variable: '--font-display', subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'Redwall', template: '%s | Redwall' },
  description: 'Redwall Yangın Danışmanlık, Yazılım ve Mühendislik Hizmetleri',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable} font-sans antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

> Not: `<html lang>` `[locale]/layout` içinde ayarlanamaz (html kökte). Locale'i
> `lang` için kökte bilmediğimizden, `[locale]/layout`'ta `<html lang>` yerine
> dökümana `lang`'i `generateMetadata`/middleware üzerinden bırakıyoruz; bu plan
> kökte `suppressHydrationWarning` kullanır ve `lang`'i Task 8.3'te
> `[locale]` segmentinden okuyarak `<html lang={locale}>`'a taşır (kök layout'u
> `[locale]` layout'una bilgi geçwhen gerekirse). Pratikte: kök layout `<html>`'i
> render eder, `lang` özniteliği `[locale]` layout'unun `params.locale`'inden
> türetilemediği için **kök layout `[locale]` segmentini `headers()`'tan okur**.

- [ ] **Step 4: `src/app/[locale]/layout.tsx`**

```tsx
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return (
    <NextIntlClientProvider>
      <div className="flex min-h-screen flex-col">
        <Header locale={locale} />
        <main className="flex-1">{children}</main>
        <Footer locale={locale} />
      </div>
    </NextIntlClientProvider>
  );
}
```

- [ ] **Step 5: Geçici `src/app/[locale]/page.tsx` (placeholder)**

```tsx
export default function HomePage() {
  return <div className="mx-auto max-w-6xl px-4 py-24">Redwall — yakında.</div>;
}
```

- [ ] **Step 6: Eski tek-sayfa dosyalarını kaldır**

```bash
git rm src/app/page.tsx
git rm -r src/components/Hero src/components/Solutions src/components/Software \
        src/components/About src/components/Contact src/components/Header src/components/Footer
```
(Bu eski bileşenler yeni `components/layout` + `components/sections` ile değişecek; içerik fikirleri Milestone 3–7'de yeniden kurulur.)

- [ ] **Step 7: Geçici Header/Footer/ThemeProvider stub'ları**

Task 0.6 ThemeProvider'ı, Milestone 3 Header/Footer'ı tamamlar. Derlemenin geçmesi için minimal stub yaz:
`src/components/layout/Header.tsx` → `export default function Header({locale}:{locale:string}){return <header className="h-16 border-b border-border"/>}`
`src/components/layout/Footer.tsx` → `export default function Footer({locale}:{locale:string}){return <footer className="h-24 border-t border-border"/>}`

- [ ] **Step 8: Derle ve commit**

Run: `npm run build` → Expected: `/tr` ve `/en` rotaları üretilir, PASS.
Run: `npm run dev` → `http://localhost:3000` → `/tr`'ye yönlenir.
```bash
git add -A
git commit -m "feat: [locale] layout, kök layout, messages seed; eski tek-sayfa kaldırıldı"
```

### Task 0.6: ThemeProvider + ThemeToggle

**Files:**
- Create: `src/components/layout/ThemeProvider.tsx`, `src/components/layout/ThemeToggle.tsx`

**Interfaces:**
- Produces: `<ThemeProvider>` (next-themes sarmalı, `attribute="class"`), `<ThemeToggle/>`.

- [ ] **Step 1: `ThemeProvider.tsx`**

```tsx
'use client';
import { ThemeProvider as NextThemes } from 'next-themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemes>
  );
}
```

- [ ] **Step 2: `ThemeToggle.tsx`**

```tsx
'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = resolvedTheme === 'dark';
  return (
    <button
      aria-label="Tema değiştir"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-surface"
    >
      {mounted ? (isDark ? '☀️' : '🌙') : null}
    </button>
  );
}
```

- [ ] **Step 3: Derle ve commit**

Run: `npm run build` → PASS.
```bash
git add src/components/layout/ThemeProvider.tsx src/components/layout/ThemeToggle.tsx
git commit -m "feat: koyu/açık tema sağlayıcı ve değiştirici"
```

### Task 0.7: LocaleSwitcher

**Files:**
- Create: `src/components/layout/LocaleSwitcher.tsx`
- Test: `src/components/layout/LocaleSwitcher.test.tsx`

**Interfaces:**
- Consumes: `usePathname`, `useRouter` (i18n/navigation), `LOCALES`.
- Produces: `<LocaleSwitcher locale={locale}/>` — aktif sayfayı koruyarak dili değiştirir.

- [ ] **Step 1: Test yaz**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/yazilim',
  useRouter: () => ({ replace: vi.fn() }),
}));
import LocaleSwitcher from './LocaleSwitcher';

describe('LocaleSwitcher', () => {
  it('TR ve EN seçeneklerini gösterir', () => {
    render(<LocaleSwitcher locale="tr" />);
    expect(screen.getByText('TR')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Çalıştır, başarısız gör** — Run: `npm test -- LocaleSwitcher` → FAIL.

- [ ] **Step 3: `LocaleSwitcher.tsx` yaz**

```tsx
'use client';
import { usePathname, useRouter } from '@/i18n/navigation';
import { LOCALES, type Locale } from '@/lib/locales';
import { cn } from '@/lib/utils';

export default function LocaleSwitcher({ locale }: { locale: string }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <div className="inline-flex rounded-md border border-border text-xs font-medium">
      {LOCALES.map((l: Locale) => (
        <button
          key={l}
          onClick={() => router.replace(pathname, { locale: l })}
          className={cn('px-2 py-1 uppercase', l === locale ? 'bg-primary text-white' : 'hover:bg-surface')}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Geç ve commit**

Run: `npm test -- LocaleSwitcher` → PASS.
```bash
git add src/components/layout/LocaleSwitcher.tsx src/components/layout/LocaleSwitcher.test.tsx
git commit -m "feat: dil değiştirici (aktif sayfayı korur)"
```

---

## MILESTONE 1 — Sanity Altyapısı

Çıktı: `/studio` gömülü editör açılır; şemalar tanımlı; GROQ fetch katmanı içerik yoksa boş döner; seed import edilebilir.

### Task 1.1: Sanity env + client + image

**Files:**
- Create: `src/sanity/env.ts`, `src/sanity/lib/client.ts`, `src/sanity/lib/image.ts`, `.env.local.example`
- Modify: `.gitignore` (`.env.local` zaten ignore'da mı kontrol et)

**Interfaces:**
- Produces: `client` (sanity client), `urlFor(source)` → image builder, `projectId/dataset/apiVersion`.

- [ ] **Step 1: `.env.local.example`**

```
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-10-01
```

- [ ] **Step 2: `src/sanity/env.ts`**

```ts
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-10-01';
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '';
export const isSanityConfigured = projectId.length > 0;
```

- [ ] **Step 3: `src/sanity/lib/client.ts`**

```ts
import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId } from '../env';

export const client = createClient({
  projectId: projectId || 'placeholder',
  dataset, apiVersion, useCdn: true,
});
```

- [ ] **Step 4: `src/sanity/lib/image.ts`**

```ts
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import { client } from './client';

const builder = imageUrlBuilder(client);
export const urlFor = (source: SanityImageSource) => builder.image(source);
```

- [ ] **Step 5: Commit**

```bash
git add src/sanity/env.ts src/sanity/lib/client.ts src/sanity/lib/image.ts .env.local.example
git commit -m "feat: Sanity env, client ve image url builder"
```

### Task 1.2: Locale nesne şemaları

**Files:**
- Create: `src/sanity/schemaTypes/objects/localeString.ts`, `localeText.ts`, `localePortableText.ts`

**Interfaces:**
- Produces: `localeString`, `localeText`, `localePortableText` nesne tipleri (her biri `tr` + `en` alanlı).

- [ ] **Step 1: `localeString.ts`**

```ts
import { defineType, defineField } from 'sanity';

export const localeString = defineType({
  name: 'localeString', title: 'Yerelleştirilmiş Metin', type: 'object',
  fields: [
    defineField({ name: 'tr', title: 'Türkçe', type: 'string' }),
    defineField({ name: 'en', title: 'İngilizce', type: 'string' }),
  ],
});
```

- [ ] **Step 2: `localeText.ts`** (aynı yapı, alan tipi `text`)

```ts
import { defineType, defineField } from 'sanity';

export const localeText = defineType({
  name: 'localeText', title: 'Yerelleştirilmiş Uzun Metin', type: 'object',
  fields: [
    defineField({ name: 'tr', title: 'Türkçe', type: 'text', rows: 4 }),
    defineField({ name: 'en', title: 'İngilizce', type: 'text', rows: 4 }),
  ],
});
```

- [ ] **Step 3: `localePortableText.ts`** (alan tipi `array of block`)

```ts
import { defineType, defineField } from 'sanity';

const blocks = { type: 'array' as const, of: [{ type: 'block' }, { type: 'image' }] };

export const localePortableText = defineType({
  name: 'localePortableText', title: 'Yerelleştirilmiş Zengin Metin', type: 'object',
  fields: [
    defineField({ name: 'tr', title: 'Türkçe', ...blocks }),
    defineField({ name: 'en', title: 'İngilizce', ...blocks }),
  ],
});
```

- [ ] **Step 4: Commit**

```bash
git add src/sanity/schemaTypes/objects
git commit -m "feat: Sanity yerelleştirilmiş alan tipleri (string/text/portable)"
```

### Task 1.3: Doküman şemaları

**Files:**
- Create (her biri ayrı dosya): `src/sanity/schemaTypes/documents/{siteSettings,navigation,homePage,service,product,project,reference,faq,post,jobPosting,page}.ts`

**Interfaces:**
- Produces: 11 doküman tipi (Bölüm 6 spec'i). `slug`, `localeString`/`localeText`/`localePortableText`, `image`, enum alanları.

- [ ] **Step 1: `service.ts` (örnek desen — tüm dokümanlar bu deseni izler)**

```ts
import { defineType, defineField } from 'sanity';

export const service = defineType({
  name: 'service', title: 'Hizmet (İş Kolu)', type: 'document',
  fields: [
    defineField({ name: 'isKolu', title: 'İş Kolu', type: 'string',
      options: { list: [
        { title: 'Yazılım', value: 'yazilim' },
        { title: 'Danışmanlık', value: 'danismanlik' },
        { title: 'Mühendislik', value: 'muhendislik' }] },
      validation: (r) => r.required() }),
    defineField({ name: 'baslik', title: 'Başlık', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'ozet', title: 'Özet', type: 'localeText' }),
    defineField({ name: 'icerik', title: 'İçerik', type: 'localePortableText' }),
    defineField({ name: 'altHizmetler', title: 'Alt Hizmetler', type: 'array',
      of: [{ type: 'object', fields: [
        { name: 'baslik', type: 'localeString', title: 'Başlık' },
        { name: 'aciklama', type: 'localeText', title: 'Açıklama' }] }] }),
    defineField({ name: 'imzaRengi', title: 'İmza Rengi', type: 'string',
      options: { list: ['primary', 'amber', 'navy'] } }),
    defineField({ name: 'sira', title: 'Sıra', type: 'number' }),
  ],
  preview: { select: { title: 'baslik.tr' } },
});
```

- [ ] **Step 2: Kalan dokümanları aynı desenle yaz**

Her dosya `defineType` ile, alanlar Bölüm 6 spec'ine göre:
- `siteSettings` (singleton): `sirketAdi` string, `iletisim` object{tel,email,adres:localeString}, `sosyal` object{linkedin,instagram,youtube}, `calismaSaatleri` localeString, `istatistikler` array of {deger string, etiket localeString}, `seo` object{baslik:localeString, aciklama:localeText}.
- `navigation` (singleton): `headerLinks` array of {etiket localeString, href string, alt array of {etiket localeString, href string}}, `footerKolonlari` array of {baslik localeString, linkler array of {etiket localeString, href string}}.
- `homePage` (singleton): `heroBaslik` localeString, `heroAltMetin` localeText, `heroBirincilCta`/`heroIkincilCta` object{etiket localeString, href string}, `oneCikanUrun` reference→product, `yaklasim` localePortableText.
- `product`: `slug` slug, `ad` string, `slogan` localeString, `aciklama` localeText, `ozellikler` array of {baslik localeString, aciklama localeText}, `hedefKitle` array of localeString, `ekranGorselleri` array of image, `sira` number.
- `project`: `slug` slug, `baslik` localeString, `musteri` string, `isKolu` enum (yukarıdaki list), `durum` string list ['devam-eden','tamamlandi'], `yil` number, `il` string, `kapsam` localeString, `ozet` localeText, `aciklama` localePortableText, `gorseller` array of image, `oneCikan` boolean.
- `reference`: `ad` string, `logo` image, `gorus` object{metin localeText, kisi string, unvan localeString}.
- `faq`: `kategori` string list ['genel','yazilim','danismanlik','muhendislik'], `soru` localeString, `cevap` localeText, `sira` number.
- `post`: `slug` slug, `baslik` localeString, `tarih` datetime, `kapak` image, `ozet` localeText, `icerik` localePortableText, `etiketler` array of string.
- `jobPosting`: `slug` slug, `baslik` localeString, `lokasyon` string, `tip` string, `aciklama` localePortableText, `aktif` boolean.
- `page`: `slug` slug (list: hakkimizda, vizyon-misyon, kalite-belgeler), `baslik` localeString, `icerik` localePortableText.

Her dokümanda `preview.select.title` uygun bir `*.tr` alanına bağlanır.

- [ ] **Step 3: Commit**

```bash
git add src/sanity/schemaTypes/documents
git commit -m "feat: Sanity doküman şemaları (11 tip)"
```

### Task 1.4: Şema index + sanity.config + structure

**Files:**
- Create: `src/sanity/schemaTypes/index.ts`, `src/sanity/structure.ts`, `sanity.config.ts`

**Interfaces:**
- Consumes: tüm şema tipleri.
- Produces: `schema.types` listesi; `sanity.config.ts` default export (Studio config).

- [ ] **Step 1: `schemaTypes/index.ts`**

```ts
import { localeString } from './objects/localeString';
import { localeText } from './objects/localeText';
import { localePortableText } from './objects/localePortableText';
import { siteSettings } from './documents/siteSettings';
import { navigation } from './documents/navigation';
import { homePage } from './documents/homePage';
import { service } from './documents/service';
import { product } from './documents/product';
import { project } from './documents/project';
import { reference } from './documents/reference';
import { faq } from './documents/faq';
import { post } from './documents/post';
import { jobPosting } from './documents/jobPosting';
import { page } from './documents/page';

export const schemaTypes = [
  localeString, localeText, localePortableText,
  siteSettings, navigation, homePage, service, product, project,
  reference, faq, post, jobPosting, page,
];
```

- [ ] **Step 2: `src/sanity/structure.ts`** — singleton'ları (siteSettings, navigation, homePage) tekil liste öğesi yapan masa yapısı.

```ts
import type { StructureResolver } from 'sanity/structure';

const SINGLETONS = [
  { id: 'siteSettings', title: 'Site Ayarları' },
  { id: 'navigation', title: 'Navigasyon' },
  { id: 'homePage', title: 'Ana Sayfa' },
];
const COLLECTIONS = ['service', 'product', 'project', 'reference', 'faq', 'post', 'jobPosting', 'page'];

export const structure: StructureResolver = (S) =>
  S.list().title('İçerik').items([
    ...SINGLETONS.map((s) =>
      S.listItem().title(s.title).id(s.id).child(S.document().schemaType(s.id).documentId(s.id))),
    S.divider(),
    ...COLLECTIONS.map((t) => S.documentTypeListItem(t)),
  ]);
```

- [ ] **Step 3: `sanity.config.ts`**

```ts
'use client';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './src/sanity/schemaTypes';
import { structure } from './src/sanity/structure';
import { apiVersion, dataset, projectId } from './src/sanity/env';

export default defineConfig({
  basePath: '/studio',
  projectId: projectId || 'placeholder', dataset,
  schema: { types: schemaTypes },
  plugins: [structureTool({ structure }), visionTool({ defaultApiVersion: apiVersion })],
});
```

- [ ] **Step 4: Commit**

```bash
git add src/sanity/schemaTypes/index.ts src/sanity/structure.ts sanity.config.ts
git commit -m "feat: Sanity şema index, singleton structure ve Studio config"
```

### Task 1.5: Gömülü Studio rotası

**Files:**
- Create: `src/app/studio/[[...tool]]/page.tsx`, `src/app/studio/[[...tool]]/layout.tsx`

**Interfaces:**
- Produces: `/studio` rotası (Sanity Studio).

- [ ] **Step 1: `layout.tsx`** (Studio kendi html/gövdesini yönetir)

```tsx
export const metadata = { title: 'Redwall Studio' };
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

- [ ] **Step 2: `page.tsx`**

```tsx
'use client';
import { NextStudio } from 'next-sanity/studio';
import config from '../../../../sanity.config';

export const dynamic = 'force-static';
export default function StudioPage() {
  return <NextStudio config={config} />;
}
```

- [ ] **Step 3: Derle, doğrula, commit**

Run: `npm run build` → PASS. `npm run dev` → `/studio` Studio'yu yükler (projectId boşsa "configure" uyarısı normal).
```bash
git add src/app/studio
git commit -m "feat: /studio gömülü Sanity Studio rotası"
```

### Task 1.6: GROQ sorguları + tipli, boş-dayanıklı fetch

**Files:**
- Create: `src/sanity/lib/fetch.ts`, `src/sanity/lib/queries.ts`
- Test: `src/sanity/lib/fetch.test.ts`

**Interfaces:**
- Consumes: `client`, `isSanityConfigured`.
- Produces: `sanityFetch<T>(query, params?, fallback)` → Sanity yapılandırılmamışsa/boşsa `fallback` döndürür, asla atmaz; `queries` (GROQ string sabitleri): `HOME_QUERY, SITE_SETTINGS_QUERY, NAV_QUERY, SERVICES_QUERY, SERVICE_QUERY, PRODUCTS_QUERY, PRODUCT_QUERY, PROJECTS_QUERY, PROJECT_QUERY, REFERENCES_QUERY, FAQS_QUERY, POSTS_QUERY, POST_QUERY, JOBS_QUERY, PAGE_QUERY`.

- [ ] **Step 1: Test yaz**

```ts
import { describe, it, expect, vi } from 'vitest';
vi.mock('../env', () => ({ isSanityConfigured: false, projectId: '', dataset: 'x', apiVersion: 'x' }));
import { sanityFetch } from './fetch';

describe('sanityFetch', () => {
  it('Sanity yapılandırılmamışsa fallback döndürür', async () => {
    const res = await sanityFetch('*[_type=="x"]', {}, []);
    expect(res).toEqual([]);
  });
});
```

- [ ] **Step 2: Çalıştır, FAIL gör** — Run: `npm test -- fetch`.

- [ ] **Step 3: `fetch.ts` yaz**

```ts
import { client } from './client';
import { isSanityConfigured } from '../env';

export async function sanityFetch<T>(
  query: string, params: Record<string, unknown> = {}, fallback: T,
): Promise<T> {
  if (!isSanityConfigured) return fallback;
  try {
    const data = await client.fetch<T>(query, params, { next: { revalidate: 60 } });
    return (data ?? fallback) as T;
  } catch {
    return fallback;
  }
}
```

- [ ] **Step 4: `queries.ts` yaz** — GROQ sabitleri. Örnek:

```ts
export const PROJECTS_QUERY = `*[_type=="project"]|order(yil desc){
  "slug": slug.current, baslik, musteri, isKolu, durum, yil, il, ozet,
  "gorsel": gorseller[0], oneCikan }`;
export const PROJECT_QUERY = `*[_type=="project" && slug.current==$slug][0]{
  baslik, musteri, isKolu, durum, yil, il, kapsam, ozet, aciklama, gorseller }`;
export const SERVICES_QUERY = `*[_type=="service"]|order(sira asc){
  isKolu, baslik, ozet, altHizmetler, imzaRengi }`;
export const SERVICE_QUERY = `*[_type=="service" && isKolu==$isKolu][0]{
  isKolu, baslik, ozet, icerik, altHizmetler, imzaRengi }`;
export const PRODUCTS_QUERY = `*[_type=="product"]|order(sira asc){
  "slug": slug.current, ad, slogan, aciklama, ozellikler }`;
export const PRODUCT_QUERY = `*[_type=="product" && slug.current==$slug][0]{
  ad, slogan, aciklama, ozellikler, hedefKitle, ekranGorselleri }`;
export const REFERENCES_QUERY = `*[_type=="reference"]{ ad, logo, gorus }`;
export const FAQS_QUERY = `*[_type=="faq"]|order(sira asc){ kategori, soru, cevap }`;
export const POSTS_QUERY = `*[_type=="post"]|order(tarih desc){ "slug":slug.current, baslik, tarih, kapak, ozet }`;
export const POST_QUERY = `*[_type=="post" && slug.current==$slug][0]{ baslik, tarih, kapak, icerik }`;
export const JOBS_QUERY = `*[_type=="jobPosting" && aktif==true]{ "slug":slug.current, baslik, lokasyon, tip }`;
export const PAGE_QUERY = `*[_type=="page" && slug.current==$slug][0]{ baslik, icerik }`;
export const SITE_SETTINGS_QUERY = `*[_type=="siteSettings"][0]{ sirketAdi, iletisim, sosyal, calismaSaatleri, istatistikler, seo }`;
export const NAV_QUERY = `*[_type=="navigation"][0]{ headerLinks, footerKolonlari }`;
export const HOME_QUERY = `*[_type=="homePage"][0]{ heroBaslik, heroAltMetin, heroBirincilCta, heroIkincilCta, yaklasim, "oneCikanUrun": oneCikanUrun->{ "slug":slug.current, ad, slogan } }`;
export const FEATURED_PROJECTS_QUERY = `*[_type=="project" && oneCikan==true]|order(yil desc)[0..2]{ "slug":slug.current, baslik, musteri, isKolu, durum, "gorsel": gorseller[0] }`;
```

- [ ] **Step 5: Geç, commit**

Run: `npm test -- fetch` → PASS.
```bash
git add src/sanity/lib/fetch.ts src/sanity/lib/queries.ts src/sanity/lib/fetch.test.ts
git commit -m "feat: boş-dayanıklı sanityFetch ve GROQ sorguları"
```

### Task 1.7: Seed dataset (NDJSON) + import betiği

**Files:**
- Create: `sanity/seed/redwall-seed.ndjson`, `scripts/seed-readme.md`

**Interfaces:**
- Produces: `sanity dataset import sanity/seed/redwall-seed.ndjson production` ile yüklenebilir TR/EN taslak içerik (siteSettings, navigation, homePage, 3 service, 2 product, 4 project, 3 reference, 6 faq, 2 post, 1 page-set).

- [ ] **Step 1: NDJSON seed yaz** — her satır bir doküman (`_id`, `_type`, alanlar). Gerçekçi TR/EN taslak metinler (içerik üretimi bu adımda; Milestone 4–7'deki sayfa metinleriyle tutarlı olmalı). Örnek satır:

```
{"_id":"service-yazilim","_type":"service","isKolu":"yazilim","baslik":{"tr":"Yazılım","en":"Software"},"ozet":{"tr":"Fikri mülkiyeti bize ait yangın ve mekanik mühendislik yazılımları.","en":"Fire and mechanical engineering software we own end to end."},"imzaRengi":"primary","sira":1}
```

(Tüm dokümanlar için tam içerik bu adımda yazılır; placeholder bırakılmaz.)

- [ ] **Step 2: `scripts/seed-readme.md`** — import adımları (CLI kurulumu, login, `sanity dataset import ... --replace`).

- [ ] **Step 3: Commit**

```bash
git add sanity/seed scripts/seed-readme.md
git commit -m "feat: TR/EN taslak içerik seed (NDJSON) ve import rehberi"
```

---

## MILESTONE 2 — UI Bileşen Kütüphanesi

Çıktı: Sayfa bölümlerinin üzerine kurulacağı yeniden kullanılabilir, temalı, erişilebilir temel bileşenler. Her bileşen sunum odaklı; mantık taşıyanlar (Accordion aç/kapa) test edilir.

### Task 2.1: Button, Section, PageHeader, Badge, Cta

**Files:**
- Create: `src/components/ui/Button.tsx`, `Section.tsx`, `PageHeader.tsx`, `Badge.tsx`, `Cta.tsx`, `src/components/ui/index.ts`

**Interfaces:**
- Produces:
  - `Button({ href?, variant?: 'primary'|'secondary'|'ghost', children, ...})` — `href` varsa i18n `Link`, yoksa `<button>`.
  - `Section({ children, className?, container?: boolean, tone?: 'default'|'dark'|'muted' })`.
  - `PageHeader({ ust?, baslik, aciklama? })` — sayfa başlığı bloğu.
  - `Badge({ children, tone?: 'primary'|'amber'|'navy'|'green' })`.
  - `Cta({ baslik, aciklama?, buton: {etiket, href} })` — koyu kapanış CTA bandı.

- [ ] **Step 1: `Button.tsx` yaz**

```tsx
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost';
const styles: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark',
  secondary: 'border border-border bg-surface hover:bg-background',
  ghost: 'text-primary hover:underline',
};

export function Button({
  href, variant = 'primary', className, children, ...rest
}: { href?: string; variant?: Variant; className?: string; children: React.ReactNode } &
    React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = cn('inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold transition-colors', styles[variant], className);
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button className={cls} {...rest}>{children}</button>;
}
```

- [ ] **Step 2: `Section.tsx`, `PageHeader.tsx`, `Badge.tsx`, `Cta.tsx` yaz** — her biri token tabanlı, `tone='dark'` → `bg-navy text-white` / `bg-[#141416]`. (Tam kod: aşağıdaki desenlerle; her dosya tek sorumluluk.)

```tsx
// Section.tsx
import { cn } from '@/lib/utils';
export function Section({ children, className, container = true, tone = 'default' }:
  { children: React.ReactNode; className?: string; container?: boolean; tone?: 'default'|'dark'|'muted' }) {
  const tones = { default: 'bg-background', dark: 'bg-[#141416] text-white', muted: 'bg-surface' };
  return (
    <section className={cn('py-20', tones[tone], className)}>
      {container ? <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div> : children}
    </section>
  );
}
```

```tsx
// PageHeader.tsx
export function PageHeader({ ust, baslik, aciklama }: { ust?: string; baslik: string; aciklama?: string }) {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-28 pb-12">
      {ust && <span className="text-sm font-medium uppercase tracking-wider text-primary">{ust}</span>}
      <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">{baslik}</h1>
      {aciklama && <p className="mt-4 max-w-2xl text-lg text-muted">{aciklama}</p>}
    </div>
  );
}
```

```tsx
// Badge.tsx
import { cn } from '@/lib/utils';
export function Badge({ children, tone = 'primary' }: { children: React.ReactNode; tone?: 'primary'|'amber'|'navy'|'green' }) {
  const tones = { primary: 'bg-primary/10 text-primary', amber: 'bg-amber/10 text-amber',
    navy: 'bg-navy/10 text-navy', green: 'bg-green-500/10 text-green-600' };
  return <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone])}>{children}</span>;
}
```

```tsx
// Cta.tsx
import { Button } from './Button';
export function Cta({ baslik, aciklama, buton }: { baslik: string; aciklama?: string; buton: { etiket: string; href: string } }) {
  return (
    <section className="bg-[#141416] text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 text-center">
        <h2 className="font-display text-3xl font-bold">{baslik}</h2>
        {aciklama && <p className="mx-auto mt-3 max-w-xl text-white/70">{aciklama}</p>}
        <div className="mt-8"><Button href={buton.href}>{buton.etiket}</Button></div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: `index.ts` barrel** + derle + commit

```ts
export { Button } from './Button';
export { Section } from './Section';
export { PageHeader } from './PageHeader';
export { Badge } from './Badge';
export { Cta } from './Cta';
```
Run: `npm run build` → PASS.
```bash
git add src/components/ui
git commit -m "feat: temel UI bileşenleri (Button, Section, PageHeader, Badge, Cta)"
```

### Task 2.2: Accordion (test edilir), Breadcrumb, Stat, LogoWall, PortableText

**Files:**
- Create: `src/components/ui/Accordion.tsx`, `Breadcrumb.tsx`, `Stat.tsx`, `LogoWall.tsx`, `PortableText.tsx`
- Test: `src/components/ui/Accordion.test.tsx`
- Modify: `src/components/ui/index.ts`

**Interfaces:**
- Produces:
  - `Accordion({ items: { soru: string; cevap: string }[] })` — tıklanınca açılır/kapanır.
  - `Breadcrumb({ items: { etiket: string; href?: string }[] })`.
  - `Stat({ deger: string; etiket: string })`.
  - `LogoWall({ logos: { ad: string; src?: string }[] })` — `src` yoksa ad-rozeti.
  - `PortableTextRenderer({ value })` — `@portabletext/react` sarmalı.

- [ ] **Step 1: Accordion testi yaz**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Accordion } from './Accordion';

describe('Accordion', () => {
  it('cevap başta gizli, tıklayınca görünür', () => {
    render(<Accordion items={[{ soru: 'S1', cevap: 'C1' }]} />);
    expect(screen.queryByText('C1')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('S1'));
    expect(screen.getByText('C1')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: FAIL gör** — Run: `npm test -- Accordion`.

- [ ] **Step 3: `Accordion.tsx` yaz**

```tsx
'use client';
import { useState } from 'react';
export function Accordion({ items }: { items: { soru: string; cevap: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="divide-y divide-border rounded-xl border border-border">
      {items.map((it, i) => (
        <div key={i}>
          <button onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium">
            <span>{it.soru}</span><span>{open === i ? '−' : '+'}</span>
          </button>
          {open === i && <div className="px-5 pb-4 text-muted">{it.cevap}</div>}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Diğer dört bileşeni yaz** (Breadcrumb, Stat, LogoWall, PortableText). PortableText:

```tsx
import { PortableText, type PortableTextBlock } from '@portabletext/react';
export function PortableTextRenderer({ value }: { value?: PortableTextBlock[] }) {
  if (!value?.length) return null;
  return <div className="prose-redwall space-y-4"><PortableText value={value} /></div>;
}
```
(Breadcrumb/Stat/LogoWall: sunum; token tabanlı basit markup.)

- [ ] **Step 5: index'e ekle, geç, commit**

Run: `npm test -- Accordion` → PASS; `npm run build` → PASS.
```bash
git add src/components/ui
git commit -m "feat: Accordion (test'li), Breadcrumb, Stat, LogoWall, PortableText"
```

---

## MILESTONE 3 — Header & Footer (navigasyon)

Çıktı: Tam işlevsel, açılır menülü, mobil uyumlu, tema + dil + Teklif CTA içeren Header; sütunlu Footer. İçerik `messages` (etiketler) + Sanity `navigation` (varsa) ile beslenir; Sanity yoksa `messages` tabanlı statik menüye düşer.

### Task 3.1: Header (masaüstü + açılır menü)

**Files:**
- Modify: `src/components/layout/Header.tsx`
- Create: `src/components/layout/nav-config.ts`

**Interfaces:**
- Consumes: `useTranslations('nav')`, `Link`, `ThemeToggle`, `LocaleSwitcher`.
- Produces: `NAV_GROUPS` (statik fallback yapı: birincil linkler + "Kurumsal" ve "Daha Fazla" açılırları); `<Header locale/>`.

- [ ] **Step 1: `nav-config.ts`** — i18n anahtarlarına referansla menü yapısı (href + message key).

```ts
export const PRIMARY = [
  { key: 'yazilim', href: '/yazilim',
    children: [{ key: 'yanginpro', href: '/yazilim/yanginpro', label: 'YangınPro' },
               { key: 'mekanikpro', href: '/yazilim/mekanikpro', label: 'MekanikPro' }] },
  { key: 'danismanlik', href: '/danismanlik' },
  { key: 'muhendislik', href: '/muhendislik' },
  { key: 'projeler', href: '/projeler' },
  { key: 'kurumsal', href: '/kurumsal/hakkimizda',
    children: [{ key: 'hakkimizda', href: '/kurumsal/hakkimizda' },
               { key: 'vizyonMisyon', href: '/kurumsal/vizyon-misyon' },
               { key: 'kaliteBelgeler', href: '/kurumsal/kalite-belgeler' }] },
  { key: 'dahaFazla', href: '/referanslar',
    children: [{ key: 'referanslar', href: '/referanslar' },
               { key: 'sss', href: '/sss' }, { key: 'blog', href: '/blog' },
               { key: 'kariyer', href: '/kariyer' }] },
] as const;
```

- [ ] **Step 2: `Header.tsx` yaz** — sticky, logo (`/redwall-logo.svg`), `PRIMARY` üstünde hover/focus açılır menü, sağda ThemeToggle + LocaleSwitcher + `Button href="/teklif"` (Teklif İste) + mobil menü düğmesi. `'use client'`. Erişilebilirlik: açılırlar klavyeyle erişilebilir, `aria-expanded`.

- [ ] **Step 3: Derle, görsel kontrol, commit**

Run: `npm run build` → PASS; `npm run dev` → menü + açılırlar + tema + dil çalışır.
```bash
git add src/components/layout/Header.tsx src/components/layout/nav-config.ts
git commit -m "feat: açılır menülü, tema/dil/CTA içeren Header"
```

### Task 3.2: Mobil menü (MobileNav)

**Files:**
- Create: `src/components/layout/MobileNav.tsx`
- Modify: `src/components/layout/Header.tsx` (mobil düğmeye bağla)

**Interfaces:**
- Produces: `<MobileNav locale/>` — açılır tam ekran/yan panel, `PRIMARY` + alt linkler, tema + dil.

- [ ] **Step 1: `MobileNav.tsx` yaz** — `useState` açık/kapalı, `PRIMARY` linklerini katlanır gruplar olarak listeler, Teklif CTA içerir.
- [ ] **Step 2: Header'a entegre et** — `lg:hidden` düğme, `lg` üstünde gizli.
- [ ] **Step 3: Derle + commit**

```bash
git add src/components/layout/MobileNav.tsx src/components/layout/Header.tsx
git commit -m "feat: mobil navigasyon paneli"
```

### Task 3.3: Footer

**Files:**
- Modify: `src/components/layout/Footer.tsx`

**Interfaces:**
- Consumes: `useTranslations`, `Link`, `PRIMARY`.
- Produces: `<Footer locale/>` — logo + kısa tanım, sütunlu link grupları (iş kolları, kurumsal, daha fazla), iletişim placeholder, telif satırı.

- [ ] **Step 1: `Footer.tsx` yaz** — 4 sütun + alt telif; tüm rotalara linkler; iletişim bilgileri placeholder (`info@redwall.com.tr`, `+90 ...`).
- [ ] **Step 2: Derle + commit**

```bash
git add src/components/layout/Footer.tsx
git commit -m "feat: sütunlu Footer (tüm rotalar + iletişim placeholder)"
```

---

## MILESTONE 4 — Ana Sayfa + İş Kolu Sayfaları

Çıktı: Ana sayfa ve üç iş kolu sayfası Sanity'den (varsa) içerikle, yoksa boş-durum/statik metinle render olur.

### Task 4.1: Hero + ServiceCards bölümleri

**Files:**
- Create: `src/components/sections/Hero.tsx`, `src/components/sections/ServiceCards.tsx`

**Interfaces:**
- Consumes: `pick`, `urlFor`, çekilmiş `home`/`services` verisi.
- Produces: `<Hero data locale/>`, `<ServiceCards services locale/>` (3 iş kolu kartı, her biri kendi sayfasına linkli, imza renkli).

- [ ] **Step 1: `Hero.tsx` yaz** — blueprint-grid arka plan, büyük display başlık (`pick(home.heroBaslik, locale)` ya da fallback metin), iki CTA. Veri `null` ise fallback başlık/metin (Global Constraints'teki marka cümlesi).
- [ ] **Step 2: `ServiceCards.tsx` yaz** — `services` boşsa 3 statik kart (yazilim/danismanlik/muhendislik) fallback; her kart `imzaRengi` ile vurgulanır, `Link href={'/'+isKolu}` (yazilim→/yazilim).
- [ ] **Step 3: Derle + commit**

```bash
git add src/components/sections/Hero.tsx src/components/sections/ServiceCards.tsx
git commit -m "feat: Hero ve iş kolu kartları bölümleri"
```

### Task 4.2: Ana sayfa montajı

**Files:**
- Modify: `src/app/[locale]/page.tsx`
- Create: `src/components/sections/FeaturedProjects.tsx`, `src/components/sections/ReferenceStrip.tsx`

**Interfaces:**
- Consumes: `sanityFetch`, `HOME_QUERY`, `SERVICES_QUERY`, `FEATURED_PROJECTS_QUERY`, `REFERENCES_QUERY`, `SITE_SETTINGS_QUERY`.
- Produces: tam ana sayfa: Hero → ServiceCards → istatistik bandı (Stat) → öne çıkan ürün → FeaturedProjects → ReferenceStrip → Cta.

- [ ] **Step 1: `FeaturedProjects.tsx` + `ReferenceStrip.tsx` yaz** — öne çıkan 3 proje kartı + "Tüm projeler →"; logo şeridi (LogoWall). Boşsa bölüm gizlenir.
- [ ] **Step 2: `page.tsx` yaz** — `setRequestLocale(locale)`, paralel `sanityFetch` çağrıları (her biri fallback `null`/`[]`), bölümleri dizer; `generateMetadata` ile SEO (siteSettings.seo veya fallback).

```tsx
import { setRequestLocale } from 'next-intl/server';
import { sanityFetch } from '@/sanity/lib/fetch';
import { HOME_QUERY, SERVICES_QUERY, FEATURED_PROJECTS_QUERY, REFERENCES_QUERY } from '@/sanity/lib/queries';
import { isLocale } from '@/lib/locales';
import { notFound } from 'next/navigation';
import Hero from '@/components/sections/Hero';
import ServiceCards from '@/components/sections/ServiceCards';
// ... diğer importlar

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const [home, services, featured, refs] = await Promise.all([
    sanityFetch(HOME_QUERY, {}, null),
    sanityFetch(SERVICES_QUERY, {}, []),
    sanityFetch(FEATURED_PROJECTS_QUERY, {}, []),
    sanityFetch(REFERENCES_QUERY, {}, []),
  ]);
  return (<>
    <Hero data={home} locale={locale} />
    <ServiceCards services={services} locale={locale} />
    {/* istatistik, öne çıkan ürün, FeaturedProjects, ReferenceStrip, Cta */}
  </>);
}
```

- [ ] **Step 3: Derle, görsel kontrol, commit**

Run: `npm run build` → PASS; `npm run dev` → `/tr` ve `/en` ana sayfa render olur (Sanity boşken fallback'lerle).
```bash
git add src/app/[locale]/page.tsx src/components/sections/FeaturedProjects.tsx src/components/sections/ReferenceStrip.tsx
git commit -m "feat: ana sayfa montajı (Sanity + fallback)"
```

### Task 4.3: Danışmanlık ve Mühendislik sayfaları

**Files:**
- Create: `src/app/[locale]/danismanlik/page.tsx`, `src/app/[locale]/muhendislik/page.tsx`, `src/components/sections/ServiceDetail.tsx`

**Interfaces:**
- Consumes: `SERVICE_QUERY` (`$isKolu`), `pick`, `PortableTextRenderer`.
- Produces: paylaşılan `<ServiceDetail isKolu locale/>` bölümü; iki sayfa bunu kullanır (farklı `isKolu` ve fallback metin).

- [ ] **Step 1: `ServiceDetail.tsx` yaz** — PageHeader + içerik (PortableText) + altHizmetler grid + süreç/CTA. Veri yoksa iş koluna özel **fallback statik metin** (spec Bölüm 5):
  - Danışmanlık: itfaiye onay süreci, mevzuat uygunluğu, projelendirme, kimlere (müteahhit/mal sahibi/kurum), adım adım süreç.
  - Mühendislik: aktif söndürme, pasif önleme, saha uygulama & taahhüt, sıhhi & kalorifer tesisat, periyodik bakım.
- [ ] **Step 2: İki `page.tsx` yaz** — her biri `ServiceDetail` çağırır + `generateMetadata`.
- [ ] **Step 3: Derle + commit**

```bash
git add src/app/[locale]/danismanlik src/app/[locale]/muhendislik src/components/sections/ServiceDetail.tsx
git commit -m "feat: danışmanlık ve mühendislik iş kolu sayfaları"
```

### Task 4.4: Yazılım iş kolu sayfası

**Files:**
- Create: `src/app/[locale]/yazilim/page.tsx`, `src/components/sections/ProductGrid.tsx`

**Interfaces:**
- Consumes: `PRODUCTS_QUERY`, `SERVICE_QUERY` ($isKolu='yazilim').
- Produces: `<ProductGrid products locale/>` (YangınPro + MekanikPro kartları); yazılım sayfası: iş kolu tanıtımı (fikri mülkiyet, Ar-Ge) + ProductGrid + CTA.

- [ ] **Step 1: `ProductGrid.tsx` yaz** — ürün kartları, `Link href={'/yazilim/'+slug}`; boşsa 2 statik kart (yanginpro/mekanikpro) fallback.
- [ ] **Step 2: `yazilim/page.tsx` yaz** + `generateMetadata`.
- [ ] **Step 3: Derle + commit**

```bash
git add src/app/[locale]/yazilim/page.tsx src/components/sections/ProductGrid.tsx
git commit -m "feat: yazılım iş kolu sayfası ve ürün gridi"
```

---

## MILESTONE 5 — Ürün Sayfaları, Projeler (filtre + detay), Referanslar

### Task 5.1: Ürün detay sayfası (dinamik)

**Files:**
- Create: `src/app/[locale]/yazilim/[urun]/page.tsx`, `src/components/sections/ProductFeatures.tsx`

**Interfaces:**
- Consumes: `PRODUCT_QUERY` ($slug), `PRODUCTS_QUERY` (params için).
- Produces: `generateStaticParams` → her ürün × her locale; ürün hero + ProductFeatures + hedef kitle + demo CTA. Bilinmeyen slug → `notFound()`.

- [ ] **Step 1: `ProductFeatures.tsx` yaz** — özellik gridi (ikon + baslik + aciklama).
- [ ] **Step 2: `[urun]/page.tsx` yaz** — `generateStaticParams` (Sanity yoksa `['yanginpro','mekanikpro']` × locale fallback), veri yoksa ürün-özel statik fallback metin, arayüz mockup (Software bileşenindeki mock dashboard deseni yeniden kullanılabilir).
- [ ] **Step 3: Derle + commit**

```bash
git add src/app/[locale]/yazilim/[urun] src/components/sections/ProductFeatures.tsx
git commit -m "feat: ürün detay sayfaları (YangınPro, MekanikPro)"
```

### Task 5.2: Projeler listesi + filtre (test edilir)

**Files:**
- Create: `src/app/[locale]/projeler/page.tsx`, `src/components/sections/ProjectsExplorer.tsx`, `src/lib/projects.ts`
- Test: `src/lib/projects.test.ts`

**Interfaces:**
- Produces: `filterProjects(projects, { isKolu?, durum? })` → filtrelenmiş dizi; `<ProjectsExplorer projects locale/>` (client; iş kolu + durum filtre çipleri).

- [ ] **Step 1: `projects.test.ts` yaz**

```ts
import { describe, it, expect } from 'vitest';
import { filterProjects } from './projects';
const P = [
  { slug: 'a', isKolu: 'yazilim', durum: 'tamamlandi' },
  { slug: 'b', isKolu: 'muhendislik', durum: 'devam-eden' },
] as any;
describe('filterProjects', () => {
  it('iş koluna göre filtreler', () => {
    expect(filterProjects(P, { isKolu: 'yazilim' }).map((p) => p.slug)).toEqual(['a']);
  });
  it('duruma göre filtreler', () => {
    expect(filterProjects(P, { durum: 'devam-eden' }).map((p) => p.slug)).toEqual(['b']);
  });
  it('filtre yoksa hepsini döndürür', () => {
    expect(filterProjects(P, {})).toHaveLength(2);
  });
});
```

- [ ] **Step 2: FAIL gör** — Run: `npm test -- projects`.
- [ ] **Step 3: `projects.ts` yaz**

```ts
import type { IsKolu, ProjeDurumu } from '@/types';
export interface ProjectCard { slug: string; isKolu: IsKolu; durum: ProjeDurumu; [k: string]: unknown; }
export function filterProjects<T extends { isKolu: IsKolu; durum: ProjeDurumu }>(
  projects: T[], f: { isKolu?: IsKolu; durum?: ProjeDurumu },
): T[] {
  return projects.filter((p) =>
    (!f.isKolu || p.isKolu === f.isKolu) && (!f.durum || p.durum === f.durum));
}
```

- [ ] **Step 4: Geç** — Run: `npm test -- projects` → PASS.
- [ ] **Step 5: `ProjectsExplorer.tsx` yaz** — `'use client'`, filtre state, çipler (iş kolu + durum), `filterProjects` ile süzme, kart gridi (durum rozeti, müşteri, yıl, il), `Link` detaya. Boşsa `common.bosVeri`.
- [ ] **Step 6: `projeler/page.tsx` yaz** — `PROJECTS_QUERY` çek, `ProjectsExplorer`'a geç + PageHeader + `generateMetadata`.
- [ ] **Step 7: Derle + commit**

```bash
git add src/app/[locale]/projeler/page.tsx src/components/sections/ProjectsExplorer.tsx src/lib/projects.ts src/lib/projects.test.ts
git commit -m "feat: projeler listesi, iş kolu/durum filtresi (test'li)"
```

### Task 5.3: Proje detay sayfası (dinamik)

**Files:**
- Create: `src/app/[locale]/projeler/[slug]/page.tsx`

**Interfaces:**
- Consumes: `PROJECT_QUERY` ($slug), `PROJECTS_QUERY` (params).
- Produces: `generateStaticParams` → her proje × locale; proje künyesi (müşteri, iş kolu, durum, yıl, il, kapsam) + açıklama (PortableText) + görsel galeri + ilgili hizmete link. Bilinmeyen slug → `notFound()`.

- [ ] **Step 1: `[slug]/page.tsx` yaz** — Breadcrumb + başlık + künye tablosu + galeri + CTA + `generateMetadata`.
- [ ] **Step 2: Derle + commit**

```bash
git add src/app/[locale]/projeler/[slug]
git commit -m "feat: proje detay sayfası"
```

### Task 5.4: Referanslar sayfası

**Files:**
- Create: `src/app/[locale]/referanslar/page.tsx`

**Interfaces:**
- Consumes: `REFERENCES_QUERY`, `LogoWall`.
- Produces: logo duvarı + müşteri görüşleri (testimonial kartları). Boşsa boş-durum.

- [ ] **Step 1: `page.tsx` yaz** — PageHeader + LogoWall + görüş kartları + `generateMetadata`.
- [ ] **Step 2: Derle + commit**

```bash
git add src/app/[locale]/referanslar
git commit -m "feat: referanslar sayfası (logo duvarı + görüşler)"
```

---

## MILESTONE 6 — Kurumsal, SSS, Blog, Kariyer

### Task 6.1: Kurumsal sayfalar (hakkimizda, vizyon-misyon, kalite-belgeler)

**Files:**
- Create: `src/app/[locale]/kurumsal/hakkimizda/page.tsx`, `vizyon-misyon/page.tsx`, `kalite-belgeler/page.tsx`, `src/components/sections/PageContent.tsx`

**Interfaces:**
- Consumes: `PAGE_QUERY` ($slug), `PortableTextRenderer`.
- Produces: paylaşılan `<PageContent slug locale/>`; üç sayfa bunu farklı slug + fallback metinle kullanır.

- [ ] **Step 1: `PageContent.tsx` yaz** — `PAGE_QUERY` çek; veri yoksa slug'a özel fallback:
  - hakkimizda: şirket hikayesi + üç ayağın bütünlüğü.
  - vizyon-misyon: vizyon, misyon, değerler (kart üçlüsü).
  - kalite-belgeler: kalite yaklaşımı + belge placeholder gridi.
- [ ] **Step 2: Üç `page.tsx` yaz** + `generateMetadata`.
- [ ] **Step 3: Derle + commit**

```bash
git add src/app/[locale]/kurumsal src/components/sections/PageContent.tsx
git commit -m "feat: kurumsal sayfalar (hakkımızda, vizyon-misyon, kalite-belgeler)"
```

### Task 6.2: SSS sayfası

**Files:**
- Create: `src/app/[locale]/sss/page.tsx`

**Interfaces:**
- Consumes: `FAQS_QUERY`, `Accordion`.
- Produces: kategoriye göre gruplanmış akordeon. Boşsa fallback örnek SSS (her kategoriden birkaç soru).

- [ ] **Step 1: `page.tsx` yaz** — kategori başlıkları + `Accordion`; `pick` ile soru/cevap düzleştir; `generateMetadata`.
- [ ] **Step 2: Derle + commit**

```bash
git add src/app/[locale]/sss
git commit -m "feat: SSS sayfası (kategorili akordeon)"
```

### Task 6.3: Blog liste + detay

**Files:**
- Create: `src/app/[locale]/blog/page.tsx`, `src/app/[locale]/blog/[slug]/page.tsx`

**Interfaces:**
- Consumes: `POSTS_QUERY`, `POST_QUERY` ($slug).
- Produces: yazı kart gridi; detay (`generateStaticParams` her yazı × locale, PortableText içerik). Boşsa zarif boş-durum; detayda bilinmeyen slug → `notFound()`.

- [ ] **Step 1: `blog/page.tsx` yaz** — kapak + başlık + tarih + özet kartları; boşsa `common.bosVeri`.
- [ ] **Step 2: `blog/[slug]/page.tsx` yaz** — `generateStaticParams`, başlık + tarih + kapak + içerik + `generateMetadata`.
- [ ] **Step 3: Derle + commit**

```bash
git add src/app/[locale]/blog
git commit -m "feat: blog liste ve detay sayfaları"
```

### Task 6.4: Kariyer sayfası

**Files:**
- Create: `src/app/[locale]/kariyer/page.tsx`

**Interfaces:**
- Consumes: `JOBS_QUERY`.
- Produces: açık pozisyon listesi + genel başvuru çağrısı (Teklif/İletişim'e link veya e-posta placeholder). Boşsa "şu an açık pozisyon yok" boş-durumu.

- [ ] **Step 1: `page.tsx` yaz** + `generateMetadata`.
- [ ] **Step 2: Derle + commit**

```bash
git add src/app/[locale]/kariyer
git commit -m "feat: kariyer sayfası"
```

---

## MILESTONE 7 — Formlar (Teklif + İletişim)

Çıktı: Client-side validasyonlu Teklif ve İletişim formları; gönderim sahte-başarı + console (backend kapsam dışı).

### Task 7.1: Form validasyon yardımcısı (test edilir)

**Files:**
- Create: `src/lib/form.ts`
- Test: `src/lib/form.test.ts`

**Interfaces:**
- Produces: `validateContact(values)` ve `validateQuote(values)` → `Record<string, string>` (alan→hata mesajı anahtarı); `isEmail(s)`.

- [ ] **Step 1: Test yaz**

```ts
import { describe, it, expect } from 'vitest';
import { isEmail, validateContact } from './form';
describe('isEmail', () => {
  it('geçerli/geçersiz', () => { expect(isEmail('a@b.com')).toBe(true); expect(isEmail('x')).toBe(false); });
});
describe('validateContact', () => {
  it('boş ad ve geçersiz email hata verir', () => {
    const e = validateContact({ ad: '', email: 'x', mesaj: 'merhaba' });
    expect(e.ad).toBe('zorunlu'); expect(e.email).toBe('gecersizEmail');
  });
  it('geçerli girişte hata yok', () => {
    expect(validateContact({ ad: 'Ali', email: 'a@b.com', mesaj: 'merhaba' })).toEqual({});
  });
});
```

- [ ] **Step 2: FAIL gör** — Run: `npm test -- form`.
- [ ] **Step 3: `form.ts` yaz**

```ts
export function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
export function validateContact(v: { ad?: string; email?: string; mesaj?: string }): Record<string, string> {
  const e: Record<string, string> = {};
  if (!v.ad?.trim()) e.ad = 'zorunlu';
  if (!v.email?.trim()) e.email = 'zorunlu'; else if (!isEmail(v.email)) e.email = 'gecersizEmail';
  if (!v.mesaj?.trim()) e.mesaj = 'zorunlu';
  return e;
}
export function validateQuote(v: { ad?: string; email?: string; isKolu?: string }): Record<string, string> {
  const e: Record<string, string> = {};
  if (!v.ad?.trim()) e.ad = 'zorunlu';
  if (!v.email?.trim()) e.email = 'zorunlu'; else if (!isEmail(v.email)) e.email = 'gecersizEmail';
  if (!v.isKolu?.trim()) e.isKolu = 'zorunlu';
  return e;
}
```

- [ ] **Step 4: Geç + commit**

Run: `npm test -- form` → PASS.
```bash
git add src/lib/form.ts src/lib/form.test.ts
git commit -m "feat: form validasyon yardımcıları (test'li)"
```

### Task 7.2: ContactForm + İletişim sayfası

**Files:**
- Create: `src/components/sections/ContactForm.tsx`, `src/app/[locale]/iletisim/page.tsx`

**Interfaces:**
- Consumes: `validateContact`, `useTranslations('form')`.
- Produces: `<ContactForm/>` — `useState` değerler/hatalar, submit'te validasyon; geçerliyse `console.log` + başarı mesajı (`form.basarili`).

- [ ] **Step 1: `ContactForm.tsx` yaz** — alanlar (ad, kurum, email, telefon, mesaj), hata gösterimi (mesaj anahtarını `t(...)` ile çevir), başarı durumu.
- [ ] **Step 2: `iletisim/page.tsx` yaz** — PageHeader + iki sütun: form + iletişim bilgileri (siteSettings veya placeholder) + harita placeholder + `generateMetadata`.
- [ ] **Step 3: Derle + commit**

```bash
git add src/components/sections/ContactForm.tsx src/app/[locale]/iletisim
git commit -m "feat: iletişim formu ve sayfası"
```

### Task 7.3: QuoteForm + Teklif sayfası

**Files:**
- Create: `src/components/sections/QuoteForm.tsx`, `src/app/[locale]/teklif/page.tsx`

**Interfaces:**
- Consumes: `validateQuote`, `useTranslations('form')`.
- Produces: `<QuoteForm/>` — iş kolu seçimi, proje/hizmet tipi, il, m², ad, kurum, telefon, email, mesaj; validasyon + sahte gönderim.

- [ ] **Step 1: `QuoteForm.tsx` yaz** — yapılandırılmış alanlar (isKolu `<select>`), validasyon, başarı.
- [ ] **Step 2: `teklif/page.tsx` yaz** + `generateMetadata`.
- [ ] **Step 3: Derle + commit**

```bash
git add src/components/sections/QuoteForm.tsx src/app/[locale]/teklif
git commit -m "feat: teklif iste formu ve sayfası"
```

---

## MILESTONE 8 — SEO, 404, İçerik TODO, Son Doğrulama

### Task 8.1: sitemap + robots

**Files:**
- Create: `src/app/sitemap.ts`, `src/app/robots.ts`

**Interfaces:**
- Produces: her statik rota × her locale için sitemap girdileri + dinamik (proje/blog) slug'lar; robots.

- [ ] **Step 1: `sitemap.ts` yaz** — `LOCALES` × statik yollar + `sanityFetch(PROJECTS_QUERY/POSTS_QUERY,...,[])` slug'ları; `SITE_URL` env (fallback `https://redwall.com.tr`).
- [ ] **Step 2: `robots.ts` yaz** — `/studio` disallow, sitemap referansı.
- [ ] **Step 3: Derle + commit**

```bash
git add src/app/sitemap.ts src/app/robots.ts
git commit -m "feat: çok dilli sitemap ve robots"
```

### Task 8.2: 404 (not-found) ve hreflang metadata yardımcısı

**Files:**
- Create: `src/app/[locale]/not-found.tsx`, `src/lib/metadata.ts`

**Interfaces:**
- Produces: marka uyumlu 404; `buildMetadata({ baslik, aciklama, locale, path })` → `Metadata` (title/description/openGraph + `alternates.languages` hreflang).

- [ ] **Step 1: `metadata.ts` yaz** — `alternates.languages` her locale için `/{l}{path}`.
- [ ] **Step 2: `not-found.tsx` yaz** — basit, linkli 404.
- [ ] **Step 3: Sayfalardaki `generateMetadata`'ları `buildMetadata`'ya bağla** (ana sayfa + iş kolu + ürün + projeler + kurumsal + diğerleri). Her sayfada tek satır değişiklik.
- [ ] **Step 4: Derle + commit**

```bash
git add src/lib/metadata.ts src/app/[locale]/not-found.tsx src/app/[locale]
git commit -m "feat: hreflang metadata yardımcısı ve 404 sayfası"
```

### Task 8.3: `<html lang>` locale'e bağlama

**Files:**
- Modify: `src/app/layout.tsx`, `src/app/[locale]/layout.tsx`

**Interfaces:**
- Produces: `<html lang={locale}>` doğru dil koduyla.

- [ ] **Step 1: Uygula** — kök layout `headers()` üzerinden `x-next-intl-locale`'i okur ya da next-intl önerdiği desenle `[locale]/layout`'ta `<html lang>` ayarlanır. (next-intl dokümanı: kök layout'u `[locale]` altına taşıyıp tek `<html lang={locale}>` kullanmak en temizi — bu adımda kök `app/layout.tsx` yalnızca `children` döndürür, `<html>`/`<body>` `[locale]/layout`'a taşınır; `studio` rotası kendi layout'unda `<html>` sağlar.)
- [ ] **Step 2: Derle, doğrula** — `/tr` → `lang="tr"`, `/en` → `lang="en"` (tarayıcı incelemesi).
- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx src/app/[locale]/layout.tsx
git commit -m "fix: <html lang> aktif locale'e bağlandı"
```

### Task 8.4: ICERIK-TODO.md ve README güncelleme

**Files:**
- Create: `ICERIK-TODO.md`
- Modify: `README.md`

**Interfaces:**
- Produces: kullanıcı kurulum/doldurma rehberi.

- [ ] **Step 1: `ICERIK-TODO.md` yaz** — (1) Sanity projesi açma + `.env.local`, (2) `sanity dataset import` seed, (3) `/studio`'dan doldurulacaklar: iletişim (tel/email/adres), vergi/ticaret bilgisi, gerçek referans logoları, proje görselleri, ürün ekran görüntüleri, kalite belgeleri, blog/kariyer içerikleri.
- [ ] **Step 2: `README.md`** — kurulum, `npm run dev`, `/studio`, env, test komutları.
- [ ] **Step 3: Commit**

```bash
git add ICERIK-TODO.md README.md
git commit -m "docs: içerik doldurma rehberi ve README"
```

### Task 8.5: Son doğrulama

- [ ] **Step 1: Tüm testler** — Run: `npm test` → Expected: tüm testler PASS.
- [ ] **Step 2: Lint** — Run: `npm run lint` → Expected: temiz (0 hata).
- [ ] **Step 3: Üretim derlemesi** — Run: `npm run build` → Expected: tüm rotalar (`/tr/*`, `/en/*`, `/studio`, `sitemap`, `robots`) üretilir, hata yok.
- [ ] **Step 4: Manuel duman testi** — `npm run dev`: her birincil rota TR/EN açılır; tema toggle; dil değiştirici sayfayı korur; projeler filtresi; formlar validasyon + başarı; 404.
- [ ] **Step 5: Final commit** (varsa düzeltmeler)

```bash
git add -A
git commit -m "chore: son doğrulama düzeltmeleri"
```

---

## Self-Review Notları (yazım sonrası)

- **Spec kapsamı:** Tüm rotalar (ana, 3 iş kolu, 2 ürün, projeler+detay, referanslar, 3 kurumsal, sss, blog+detay, kariyer, teklif, iletişim, studio) → Milestone 4–7 + 1.5. TR/EN → M0. Tema → M0. Sanity/CMS → M1. Formlar → M7. SEO/sitemap/hreflang/404 → M8. Boş-dayanıklılık → 1.6 + her sayfa fallback'i.
- **Mantık testleri:** locale `pick`, `filterProjects`, form validasyon, `sanityFetch` fallback, LocaleSwitcher, Accordion → Vitest'li.
- **Tip tutarlılığı:** `Locale`, `IsKolu`, `ProjeDurumu` `lib/locales`+`types`'tan; GROQ alan adları (`isKolu`, `durum`, `slug.current→slug`) sayfa tüketicileriyle aynı.
- **Placeholder:** İçerik placeholder'ları kasıtlı (kullanıcı kararı) ve `ICERIK-TODO.md`'de listeli; plan adımlarında "TBD" yok.
- **Açık karar (uygulama anında netleşir):** `<html lang>` için kök layout'un `[locale]` altına taşınması (Task 8.3) — next-intl güncel dokümanına göre en temiz desen uygulanır.
