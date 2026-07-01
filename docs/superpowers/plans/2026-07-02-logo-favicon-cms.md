# CMS'ten Logo & Favicon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Navbar (açık/koyu), footer (açık/koyu) logolarını ve favicon'u `/admin`'den (siteSettings global) yüklenebilir yapmak; hepsi mevcut statik dosyalara fallback'li.

**Architecture:** `siteSettings` global'ine `marka` grubu (5 upload) eklenir. `getSiteSettings` bu upload objelerini döndürür. Site layout'u (`[locale]/layout.tsx`) `mediaUrl` ile URL'e çevirip Header/Footer'a prop geçer; her logo CMS'te varsa CMS, yoksa statik SVG. Favicon: `(site)/layout.tsx` `generateMetadata`'sı `siteSettings.marka.favicon`'dan `icons` üretir (yoksa statik). Yeni alanlar opsiyonel → migration yalnızca şema (nullable FK), veri taşıma yok.

**Tech Stack:** Payload 3.85 (global + upload/media), Next.js 16 (App Router, metadata), Postgres, TypeScript.

## Global Constraints

- Lint: `@typescript-eslint/no-explicit-any` ERROR → `as unknown as <T>` cast.
- Alanlar opsiyonel (required yok), localize DEĞİL. `relationTo: 'media'`.
- Fallback statikler: navbar açık `/redwall-logo-light.svg`, navbar koyu `/redwall-logo-dark.svg`, footer (her iki) `/redwall-logo-footer-dark.svg`, favicon `/favicon.ico`.
- Header/Footer 'use client' — veriyi sunucu layout'undan prop alır.
- Next `<Image>` mevcut `/api/media` (aynı origin) URL'lerini kullanıyor; remote pattern zaten çalışıyor (referans logoları böyle render ediliyor).
- getSiteSettings `safe(fn, null)` ile sarılı kalır.
- Migration: `siteSettings` tablosuna 5 nullable FK sütunu; raw DDL; backfill YOK.
- Bu özellikte birim-test edilebilir mantık yok (config + wiring + `?? fallback`); doğrulama build + preview (gözlem) ile yapılır.

---

### Task 1: siteSettings'e marka grubu + getSiteSettings + migration

**Files:**
- Modify: `src/globals/SiteSettings.ts`
- Modify: `src/lib/cms/queries.ts` (`getSiteSettings`)
- Create: `src/migrations/<ts>_sitesettings_marka.ts`

**Interfaces:**
- Produces: `getSiteSettings()` dönüşünde `marka: { navbarLogoAcik, navbarLogoKoyu, footerLogoAcik, footerLogoKoyu, favicon } | null` (her biri ham Payload upload objesi veya null).

- [ ] **Step 1: SiteSettings.ts'e marka grubu ekle**

`src/globals/SiteSettings.ts` `fields` dizisine (ör. `sirketAdi`'dan sonra) ekle:

```ts
    {
      name: 'marka',
      type: 'group',
      label: 'Logo & Favicon',
      admin: { description: 'Boş bırakılan görsel için sitedeki mevcut varsayılan logo/favicon kullanılır.' },
      fields: [
        { name: 'navbarLogoAcik', type: 'upload', relationTo: 'media', label: 'Navbar logosu (açık tema)' },
        { name: 'navbarLogoKoyu', type: 'upload', relationTo: 'media', label: 'Navbar logosu (koyu tema)' },
        { name: 'footerLogoAcik', type: 'upload', relationTo: 'media', label: 'Footer logosu (açık tema)' },
        { name: 'footerLogoKoyu', type: 'upload', relationTo: 'media', label: 'Footer logosu (koyu tema)' },
        { name: 'favicon', type: 'upload', relationTo: 'media', label: 'Favicon (PNG/SVG önerilir)' },
      ],
    },
```

- [ ] **Step 2: getSiteSettings dönüşüne marka ekle**

`src/lib/cms/queries.ts` `getSiteSettings` return objesine ekle (kunye'den önce/sonra):

```ts
      marka: (r as unknown as { marka?: Record<string, unknown> }).marka
        ? {
            navbarLogoAcik: (r as unknown as { marka: Record<string, unknown> }).marka.navbarLogoAcik ?? null,
            navbarLogoKoyu: (r as unknown as { marka: Record<string, unknown> }).marka.navbarLogoKoyu ?? null,
            footerLogoAcik: (r as unknown as { marka: Record<string, unknown> }).marka.footerLogoAcik ?? null,
            footerLogoKoyu: (r as unknown as { marka: Record<string, unknown> }).marka.footerLogoKoyu ?? null,
            favicon: (r as unknown as { marka: Record<string, unknown> }).marka.favicon ?? null,
          }
        : null,
```

- [ ] **Step 3: Migration üret**

Run: `npx payload migrate:create sitesettings_marka`
Expected: `src/migrations/` altında dosya; `up()` içinde `site_settings` tablosuna 5 nullable FK sütunu (`marka_navbar_logo_acik_id` vb.) + FK constraint. Backfill/veri değişikliği YOK — üretilen SQL olduğu gibi kalır (kolonlar nullable). `down()` sütunları düşürür.

- [ ] **Step 4: Doğrula**

Run: `npx tsc --noEmit && npm run lint`
Expected: 0 error.
Run: `npx payload migrate` (dev; dev-push prompt'u için gerekirse `y` gönder)
Expected: migration hızlı çalışır (yalnızca DDL, backfill yok), asılmaz.

- [ ] **Step 5: Commit**

```bash
git add src/globals/SiteSettings.ts src/lib/cms/queries.ts src/migrations/ src/payload-types.ts
git commit -m "feat: siteSettings'e logo & favicon (marka) alanları + migration"
```

---

### Task 2: Header & Footer logolarını CMS'ten (tema-duyarlı, fallback)

**Files:**
- Modify: `src/app/(site)/[locale]/layout.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/Footer.tsx`

**Interfaces:**
- Consumes: `getSiteSettings().marka` (Task 1), `mediaUrl` (`@/lib/cms/image`)
- Produces: `Header`/`Footer` props: `logoAcik?: string | null`, `logoKoyu?: string | null`.

- [ ] **Step 1: layout.tsx — siteSettings çek, logo URL'lerini prop geç**

`src/app/(site)/[locale]/layout.tsx` importlarına ekle:

```tsx
import { getSiteSettings } from '@/lib/cms/queries';
import { mediaUrl } from '@/lib/cms/image';
```

`setRequestLocale(locale)` sonrasına ekle ve Header/Footer çağrılarını güncelle:

```tsx
  const settings = await getSiteSettings();
  const marka = (settings as unknown as { marka?: Record<string, unknown> } | null)?.marka ?? null;
  const navbarLogoAcik = marka ? mediaUrl(marka.navbarLogoAcik) ?? null : null;
  const navbarLogoKoyu = marka ? mediaUrl(marka.navbarLogoKoyu) ?? null : null;
  const footerLogoAcik = marka ? mediaUrl(marka.footerLogoAcik) ?? null : null;
  const footerLogoKoyu = marka ? mediaUrl(marka.footerLogoKoyu) ?? null : null;
```

Header/Footer:

```tsx
        <Header locale={locale} logoAcik={navbarLogoAcik} logoKoyu={navbarLogoKoyu} />
```
```tsx
        <Footer locale={locale} logoAcik={footerLogoAcik} logoKoyu={footerLogoKoyu} />
```

- [ ] **Step 2: Header — props + fallback'li logo**

`src/components/layout/Header.tsx` default export imzasını genişlet:

```tsx
export default function Header({
  locale,
  logoAcik,
  logoKoyu,
}: {
  locale: string;
  logoAcik?: string | null;
  logoKoyu?: string | null;
}) {
```

Logo bloğundaki iki `<Image>`'ın `src`'ini değiştir:

```tsx
          <Image
            src={logoAcik ?? '/redwall-logo-light.svg'}
            alt="Redwall"
            width={111}
            height={36}
            priority
            className="h-9 w-auto block dark:hidden"
          />
          <Image
            src={logoKoyu ?? '/redwall-logo-dark.svg'}
            alt="Redwall"
            width={111}
            height={36}
            priority
            className="h-9 w-auto hidden dark:block"
          />
```

- [ ] **Step 3: Footer — props + tema-duyarlı iki logo (fallback)**

`src/components/layout/Footer.tsx` default export imzasına `logoAcik`/`logoKoyu` ekle (Header'daki tiple aynı). Tek `<Image>`'lı logo bloğunu iki tema-duyarlı `<Image>` ile değiştir:

```tsx
              <Image
                src={logoAcik ?? '/redwall-logo-footer-dark.svg'}
                alt="Redwall"
                width={130}
                height={42}
                className="h-24 w-auto block dark:hidden"
              />
              <Image
                src={logoKoyu ?? '/redwall-logo-footer-dark.svg'}
                alt="Redwall"
                width={130}
                height={42}
                className="h-24 w-auto hidden dark:block"
              />
```

- [ ] **Step 4: Doğrula (fallback + build)**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: 0 error; build OK.
Preview (`preview_start` veya mevcut): CMS boşken navbar/footer bugünkü statik logolarla görünür (açık+koyu tema), sayfa 200. (CMS yükleme testi Task 4 preview'unda.)

- [ ] **Step 5: Commit**

```bash
git add "src/app/(site)/[locale]/layout.tsx" src/components/layout/Header.tsx src/components/layout/Footer.tsx
git commit -m "feat: navbar & footer logolarını CMS'ten oku (tema-duyarlı, statik fallback)"
```

---

### Task 3: Favicon'u CMS'ten (site layout metadata)

**Files:**
- Modify: `src/app/(site)/layout.tsx`

**Interfaces:**
- Consumes: `getSiteSettings().marka.favicon` (Task 1), `mediaUrl`

- [ ] **Step 1: static `metadata`'yı `generateMetadata`'ya çevir + favicon icons**

`src/app/(site)/layout.tsx`: importlara ekle:

```tsx
import { getSiteSettings } from '@/lib/cms/queries';
import { mediaUrl } from '@/lib/cms/image';
```

`export const metadata: Metadata = {...}` bloğunu şununla değiştir:

```tsx
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const marka = (settings as unknown as { marka?: Record<string, unknown> } | null)?.marka ?? null;
  const faviconUrl = marka ? mediaUrl(marka.favicon) ?? null : null;
  return {
    title: { default: 'Redwall', template: '%s | Redwall' },
    description: 'Redwall Yangın Danışmanlık, Yazılım ve Mühendislik Hizmetleri',
    icons: { icon: faviconUrl ?? '/favicon.ico' },
  };
}
```

> `src/app/favicon.ico` statik dosya olarak KALIR (fallback; `icons.icon` CMS boşken ona işaret eder). CMS favicon varsa `<link rel="icon">` onu gösterir.

- [ ] **Step 2: Doğrula**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: 0 error; build OK.
Preview: sayfa `<head>`'inde `<link rel="icon" href="...">` var (CMS boşken `/favicon.ico`). `curl -s <preview>/tr | grep 'rel="icon"'` ile doğrula.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(site)/layout.tsx"
git commit -m "feat: favicon'u siteSettings'ten oku (statik /favicon.ico fallback)"
```

---

### Task 4: Doğrulama + deploy

**Files:** (yok)

- [ ] **Step 1: Tam suite**

Run: `npm test && npm run lint && npm run build`
Expected: testler PASS, 0 lint error, build OK.

- [ ] **Step 2: Preview — uçtan uca CMS testi**

`preview_start` → `/admin` → Site Ayarları → marka grubuna bir test görseli yükle (navbar açık + favicon) → kaydet. Doğrula:
- Navbar/footer logosu yüklenen görsele döner (açık+koyu tema); boş bırakılan alanlarda statik logo kalır.
- `<head>` favicon linki yüklenen görsele döner.
- Diğer sayfalar 200, konsol hatası yok.

- [ ] **Step 3: Deploy**

```bash
git checkout main && git merge --no-ff <branch> -m "Merge: CMS'ten logo & favicon"
git push origin main
```
CI: build + `payload migrate` (sitesettings_marka; yalnızca DDL, hızlı). `gh run watch` ile izle.

- [ ] **Step 4: Prod doğrulama**
- Migration `payload_migrations`'da kayıtlı; `site_settings` tablosunda 5 yeni FK sütunu.
- `redwall.tr/admin` → Site Ayarları → marka grubu görünür, logo/favicon yüklenebilir.
- CMS boşken navbar/footer/favicon bugünkü statiklerle görünür (regresyon yok); yükleyince değişir. Bağlantı sağlıklı.

---

## Self-Review Notları
- **Spec kapsamı:** 5 upload alanı (T1) ✓, adaptör (T1) ✓, migration nullable/backfill-siz (T1) ✓, Header/Footer tema-duyarlı + fallback (T2) ✓, favicon metadata + fallback (T3) ✓, deploy (T4) ✓.
- **Fallback:** her logo `?? statik`, favicon `?? '/favicon.ico'`; CMS boşsa site bugünkü haliyle çalışır (regresyon yok).
- **Tip tutarlılığı:** Header/Footer props `logoAcik?/logoKoyu?: string|null`; layout `mediaUrl(...) ?? null` ile aynı tipi üretir; getSiteSettings.marka ham upload objeleri döner, mediaUrl consumer'da uygulanır (mevcut getReferences deseni).
- **Test:** birim-test edilebilir saf mantık yok (config/wiring/`??`); doğrulama build + preview.
- **Migration güvenliği:** yalnızca nullable FK sütun ekleme (DDL), backfill yok → geçmişteki richText veri-taşıma/deadlock riski burada geçerli değil.
