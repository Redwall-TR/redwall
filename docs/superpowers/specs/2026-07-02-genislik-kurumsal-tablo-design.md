# İçerik Genişliği + Kurumsal richText + Tablo Desteği — Tasarım

**Tarih:** 2026-07-02 · **Durum:** Onaylandı (kullanıcı), uygulanacak

## Amaç
Üç iyileştirme: (A) uzun-metin içerik gövdelerini tam sayfa genişliğine açmak;
(B) kurumsal sayfaların (Page koleksiyonu) düz-metin içerik alanlarını richText'e
çevirmek; (C) tüm zengin editörlere **tablo** desteği + Word/web'den tablolu içerik
kopyala-yapıştır eklemek. Hepsi mevcut zengin-içerik altyapısını kullanır
(`RichContent`, `plainToLexical`, veri-koruyan migration deseni).

## Onaylanan kararlar
- **A) Genişlik:** içerik gövdeleri **tam sayfa genişliği** (Section'ın `max-w-6xl`'i),
  sola dayalı; `max-w-3xl` (+`mx-auto`) kısıtları kaldırılır.
- **B) Kurumsal alanlar (hepsi):** `girisLead`, `girisParagraflar[].paragraf`,
  `vizyonMetin`, `misyonMetin`, `kartlar[].aciklama` → richText (localized korunur).
- **C) Tablo:** config-seviye `lexicalEditor()`'a `EXPERIMENTAL_TableFeature()` eklenir
  (tüm alanlar bu default'u miras alır); render + Word/web yapıştırma canlı doğrulanır.

## Mevcut durum (inceleme)
- **A render noktaları (max-w-3xl):** `blog/[slug]/page.tsx:139` (aciklama, `mx-auto max-w-3xl`),
  `yazilim/[urun]/page.tsx:446` (ürün aciklama, `mx-auto max-w-3xl`), `projeler/[slug]/page.tsx:220`
  ("Proje Hakkında", `max-w-3xl` — mx-auto YOK → sola dayalı), `RichPageView.tsx:81` (`max-w-3xl`,
  yasal/RichPage). IntroLead zaten genişletildi (önceki iş).
- **B:** kurumsal sayfalar `PageContent.tsx` → `getPage(slug)` (Page koleksiyonu: hakkimizda /
  vizyon-misyon / kalite-belgeler). Hedef alanlar `LocaleString` (düz metin), localized.
- **C:** `@payloadcms/richtext-lexical` 3.85'te `EXPERIMENTAL_TableFeature` **mevcut**. Config:
  `payload.config.ts:30` `editor: lexicalEditor()` (özelliksiz default → önceki işte tüm alanlar
  bunu miras alacak şekilde ayarlandı). Render: `RichContent` → `RichText` (@payloadcms/richtext-lexical/react).

## A) Genişlik (CSS)
Yukarıdaki 4 render noktasında `max-w-3xl` (ve varsa `mx-auto`) kaldırılır; `prose ...`
sınıfları kalır ama genişlik kısıtı gitmez → içerik Section'ın `max-w-6xl` kapsayıcısında
tam genişlik. `prose` varsayılan `max-width`'i de override edilmeli (`max-w-none` eklenir),
yoksa Tailwind Typography 65ch ile daraltır. Şema/CMS değişmez. Migration YOK.

## B) Kurumsal Page alanları → richText
`src/collections/Page.ts`: `girisLead`, `girisParagraflar[].paragraf`, `vizyonMetin`,
`misyonMetin`, `kartlar[].aciklama` alanları `textarea`→`richText` (localized korunur; alan-seviye
`editor` prop VERİLMEZ → config default'u kullanır, böylece tablo da gelir).

`getPage` adaptörü bu alanları döndürüyorsa değişmez (ham değer döner); `PageContent.tsx`
render'ında bu alanlar `{metin}` yerine `<RichContent value={pick(...)} />` ile basılır.
Kod/fallback düz metinler `RichContent` sayesinde çalışmaya devam eder.

**Migration (veri-koruyan, kanıtlanmış desen):** her alan için `up()`: (1) ALTER'dan ÖNCE ham
`SELECT` ile eski düz metni yakala; (2) `ALTER COLUMN ... TYPE jsonb USING NULL`; (3) `plainToLexical`
JSON'u ile ham `UPDATE` geri-yaz. Hepsi migration'ın kendi `db`'sinde (tek transaction), raw SQL,
`payload.*` YOK (deadlock dersi). Lokalize DİZİ alanları (`girisParagraflar`, `kartlar`) için
dizi-locale tabloları (`page_giris_paragraflar_locales.paragraf`, `page_kartlar_locales.aciklama`);
tekil lokalize alanlar `page_locales.*`. Kesin tablo/kolon adları üretilen migration SQL'inden
doğrulanır. `_parent_id` dizi tablolarında varchar olabilir → capture tipi ona göre.
seed.ts Page bu alanları seed'liyorsa `plainToLexical`'e sarılır.

## C) Tablo desteği + yapıştırma
- **Editör:** `payload.config.ts` `editor: lexicalEditor()` →
  `editor: lexicalEditor({ features: ({ defaultFeatures }) => [...defaultFeatures, EXPERIMENTAL_TableFeature()] })`.
  Import: `EXPERIMENTAL_TableFeature` from `@payloadcms/richtext-lexical`. Tüm richText alanları
  config default'unu miras aldığından hepsinde tablo aracı çıkar. **Şema değişmez** (tablo düğümleri
  mevcut jsonb'da saklanır) → **migration YOK**.
- **Render:** `RichContent`'in `RichText`'i tablo düğümlerini render etmeli. Payload'ın varsayılan
  jsxConverter'ları tabloyu basmıyorsa, `RichContent`'e tablo için jsxConverters eklenir
  (TableNode/RowNode/CellNode → `<table>/<tr>/<td>`), + tablo stilleri (border, hücre padding, başlık)
  global CSS veya prose ile verilir. Kesin converter ihtiyacı preview'da tabloyla doğrulanır.
- **Yapıştırma:** Lexical'in HTML-paste'i TableNode kayıtlıyken Word/web `<table>`'larını içe aktarır.
  Bu davranış **preview'da gerçek Word/web içeriğiyle test edilir** (experimental → düğüm/attribute
  eşlemesinde eksik çıkarsa converter/feature ayarı ile giderilir).

## Fazlama (uygulama sırası, risk artan)
1. **Faz A** — 4 render noktasında genişlik (CSS). Deploy edilebilir tek başına.
2. **Faz B** — Page 5 alanı richText + PageContent render + migration + seed.
3. **Faz C** — config tablo feature + render converter + preview'da tablo/paste doğrulama.
Her faz kendi build/lint/test + deploy + prod doğrulaması ile (fazlar bağımsız).

## Hata yönetimi
- CMS okumaları `safe()` ile sarılı kalır; `RichContent` boş/null'da null döner.
- B migration idempotent (zaten jsonb olanı atlar), tek-transaction (deadlock yok).
- C experimental → render/paste'te eksik çıkarsa Faz C içinde giderilir; A ve B'yi etkilemez.

## Test
- **A:** build + preview'da 4 sayfada içerik tam genişlik (TR+EN).
- **B:** `getPage` alanları döner; migration dev'de hızlı; preview'da kurumsal 3 sayfada
  içerik RichContent ile render (TR+EN); /admin'de bir alanı zengin düzenle.
- **C:** config sonrası preview'da /admin editöründe **tablo ekle** + **Word/web'den tablo yapıştır**
  → editörde ve sitede tablo doğru görünür. Unit: (yeni saf mantık yok; doğrulama gözlemle).

## Kapsam dışı (YAGNI)
- Tablo hücre birleştirme / gelişmiş biçim (temel tablo yeter).
- Blocks/embed gibi diğer experimental özellikler.
- `ozet`/`slogan`/`kapsam` (SEO/hero — önceki kararla düz kalır).
