# Faz D — Redwall / SaaS (Uygulama Planı)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Spec'in (`../specs/2026-06-29-redwall-eksik-kurumsal-sayfalar-design.md`) **Faz D**'si. Faz A + Faz C bitti. Faz D bitince TEK deploy (A+C+D birlikte main'e merge + push) — **deploy öncesi kullanıcı onayı alınır.**

**Goal:** SaaS/Redwall tarafı: 4 bilgi sayfası (richPage), demo talep formu, müşteri portalı dış linki.

**Architecture:** richPage adaptörü (`getRichPage`) ve koleksiyonu ZATEN var (Faz A). Yeni sistem yok; sadece seed + sabit-path rotalar + 1 form + 1 dış link. Demo form `QuoteForm`/`KvkkBasvuruForm` desenini izler. Portal URL `siteSettings`'e opsiyonel alan.

**Tech Stack:** Payload 3.85, Next 16.2.9, cms adaptör katmanı, next-intl.

## Global Constraints
- İçerik rotaları `export const dynamic = 'force-dynamic'`. i18n `pick()`. Boş-dayanıklı `safe()`. Lint `no-explicit-any` ERROR → `as unknown as ...` deseni. RichText render: `yasal/[slug]` deseni. Form: `QuoteForm` + `validateX` (form.ts) + `// TODO(Resend)` (e-posta ayrı iş). richPage kategori='redwall'. Deploy YAPILMAZ — Task 5 sonunda kullanıcı onayı.

---

## Dosya Yapısı
| Dosya | Sorumluluk |
|---|---|
| `src/payload/seed-redwall.ts` (+ package.json script) | 4 richPage (redwall) TR+EN taslak |
| `src/app/(site)/[locale]/mevzuat/page.tsx` | Mevzuat Uyumluluğu (slug: mevzuat) |
| `src/app/(site)/[locale]/guvenlik/page.tsx` | Güvenlik & Veri Koruma (slug: guvenlik) |
| `src/app/(site)/[locale]/yazilim/nasil-calisir/page.tsx` | Nasıl Çalışır (slug: nasil-calisir) |
| `src/app/(site)/[locale]/destek/page.tsx` | Destek (slug: destek) |
| `src/components/sections/DemoForm.tsx` + `src/app/(site)/[locale]/yazilim/demo/page.tsx` | Demo talep formu |
| `src/lib/form.ts` (mod.) | `validateDemo` |
| `src/globals/SiteSettings.ts` (mod.) + migration | `musteriPortalUrl` (opsiyonel text) |
| `src/components/layout/nav-config.ts` + `Footer.tsx` + Header (mod.) | Müşteri Girişi dış linki |
| `src/messages/{tr,en}.json` (mod.) | yeni nav/sayfa anahtarları |

---

### Task 1: seed-redwall (4 richPage)
**Files:** Create `src/payload/seed-redwall.ts`; Modify `package.json`
- [ ] **Step 1:** `seed-legal.ts` desenini izle (lexical helper + idempotent create-tr/update-en). 4 sayfa: `mevzuat` (Mevzuat Uyumluluğu — BYKHY/standartlar), `guvenlik` (Güvenlik & Veri Koruma — KVKK/altyapı), `nasil-calisir` (Nasıl Çalışır — YangınPro/MekanikPro akışı), `destek` (Destek — kanallar/SLA). kategori='redwall', TR+EN, hafif taslak şerhi (legal kadar sıkı değil). `sonGuncelleme` set.
- [ ] **Step 2:** package.json `"payload:seed-redwall"`. Çalıştır (richPage tablosu ZATEN var, SQL gerekmez).
- [ ] **Step 3: Doğrula:** seed çıktısı 4 sayfa TR+EN.
- [ ] **Step 4: Commit** `feat(cms): redwall bilgi sayfaları seed (mevzuat/güvenlik/nasıl-çalışır/destek)`.

### Task 2: 4 sabit-path richPage rotası
**Files:** Create 4 route dosyası (yukarıdaki tablo).
**Interfaces:** Consumes: `getRichPage(slug)`.
- [ ] **Step 1:** Her rota `force-dynamic`, `getRichPage(<slug>)`, null→notFound, PageHero + `<RichText data={pick(icerik,locale)} />`. `yasal/[slug]` desenini izle ama legal taslak bandı YERİNE hafif "bilgilendirme" notu (veya nötr). Sabit slug her dosyada gömülü.
- [ ] **Step 2: Doğrula:** build yeşil; 4 rota TR/EN 200 + içerik.
- [ ] **Step 3: Commit** `feat: /mevzuat, /guvenlik, /yazilim/nasil-calisir, /destek rotaları`.

### Task 3: Demo talep formu
**Files:** Create `src/components/sections/DemoForm.tsx`, `src/app/(site)/[locale]/yazilim/demo/page.tsx`; Modify `src/lib/form.ts`
- [ ] **Step 1:** `validateDemo({ad,email,kurum?,urun?})` ekle (validateQuote deseni). DemoForm: ürün (YangınPro/MekanikPro select), ad, kurum, email, mesaj; `QuoteForm`/`KvkkBasvuruForm` UI desenini izle; submit `// TODO(Resend)` (e-posta yok, başarı mesajı göster). Sayfa: PageHero + DemoForm.
- [ ] **Step 2: Doğrula:** build yeşil, lint 0; /yazilim/demo TR/EN 200, doğrulama çalışır.
- [ ] **Step 3: Commit** `feat: /yazilim/demo talep formu`.

### Task 4: Müşteri Girişi dış linki
**Files:** Modify `src/globals/SiteSettings.ts` (+ migration), `nav-config.ts`, `Header.tsx`, `Footer.tsx`, `messages/{tr,en}.json`
- [ ] **Step 1:** siteSettings'e `musteriPortalUrl` (text, opsiyonel, admin description: YangınPro uygulama URL'si). `migrate:create` (dosya prod için; dev'de kolon SQL ile — `site_settings` tablosuna `musteri_portal_url varchar`).
- [ ] **Step 2:** Footer'a "Müşteri Girişi" dış link (`<a target="_blank" rel="noopener">`) — URL siteSettings'ten; boşsa gizle/placeholder. Header'a (Teklif İste yanına) opsiyonel dış link veya nav-config'e `external:true` bayraklı öğe. i18n `musteriGirisi`.
- [ ] **Step 3: Doğrula:** build yeşil, lint 0; footer/nav linki görünür (URL set ise) veya zarif gizli.
- [ ] **Step 4: Commit** `feat: Müşteri Girişi (YangınPro portalı) dış linki + siteSettings alanı`.

### Task 5: Faz D doğrulama + DEPLOY (onaylı)
- [ ] `npm run build` (yeşil), `npm run lint` (0 error), `npx vitest run` (yeşil). Preview: 4 richPage rotası + /yazilim/demo TR/EN 200; Müşteri Girişi linki; regresyon yok.
- [ ] **DEPLOY:** Faz A+C+D birlikte. **Kullanıcıya onay sor** (prod canlı site). Onay sonrası: prod migration'ları çalıştırılacak (product_yayinda, kurumsal_koleksiyonlar, musteri_portal_url, varsa diğerleri); feat/kurumsal-sayfalar → main merge + push (CI/CD deploy); canlı doğrula; prod seed (legal + kurumsal + redwall) çalıştır.

---

## Self-Review (Faz D)
- **Spec coverage:** 4 richPage (T1,T2) ✔, Demo (T3) ✔, Müşteri Portalı dış link (T4) ✔, Çözümler=Faz C ✔.
- **Yeni sistem yok:** richPage altyapısı Faz A'dan; sadece içerik+rota+form+link.
- **Deploy:** prod migration listesi T5'te; kullanıcı onayı zorunlu (canlı site).
