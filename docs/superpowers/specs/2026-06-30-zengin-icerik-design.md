# Düz Metin → Zengin İçerik (richText/Lexical) — Tasarım

**Tarih:** 2026-06-30 · **Durum:** Onaylandı (kullanıcı), uygulanacak

## Amaç
Seçili düz-metin (`textarea`) içerik alanlarını Payload **richText (Lexical)**
alanlarına çevirerek editörlerin (/admin) kalın/italik, link, liste (ve uzun
alanlarda başlık/alıntı) ile zengin içerik üretmesini sağlamak. Mevcut içerik
kaybolmadan Lexical'e taşınır; site render'ı RichText'e geçer.

## Onaylanan kararlar
1. **Kapsam — çevrilecek alanlar:**
   - Sade editör: `Service.altHizmetler[].aciklama`, `Service.surec[].aciklama`,
     `Service.girisLead`, `Product.ozellikler[].aciklama`, `Referans.gorus.metin`
   - Tam editör: `Service.girisParagraflar[].paragraf`, `Product.aciklama`, `Faq.cevap`
   - Not: hedef alanların tamamı `localized: true` (doğrulandı) → backfill hem `tr`
     hem `en` locale için yapılır.
2. **Hariç (düz metin kalır):** `Service.ozet`, `Project.ozet`, `Product.slogan`
   (SEO meta description + PageHero tek-satır string olarak kullanılıyor; richText
   HTML/blok üretir, meta düz metin ister), `Project.kapsam` (künye'de kısa değer).
3. **İki editör profili:**
   - **Lite:** bold, italic, link, madde/numaralı liste. Başlık YOK.
   - **Full:** lite + h2/h3 başlık + blockquote.
4. **Migration backfill'de `req` MUTLAKA geçilir** (bkz. daha önceki deadlock).
5. **Fazlı rollout:** koleksiyon başına ayrı faz + ayrı deploy.

## Mimari / yapı taşları

### `src/payload/lexical.ts` (yeni)
İki paylaşılan editör tanımı, `@payloadcms/richtext-lexical`'ın
`lexicalEditor({ features })` API'siyle:
- `liteEditor`: `BoldFeature, ItalicFeature, LinkFeature, UnorderedListFeature,
  OrderedListFeature, ParagraphFeature` (+ align yok, heading yok).
- `fullEditor`: lite özellikleri + `HeadingFeature({ enabledHeadingSizes: ['h2','h3'] })`,
  `BlockquoteFeature`.
Payload sürümüne göre feature import adları doğrulanacak (payloadcms 3.85).

### `src/lib/lexical/plainToLexical.ts` (yeni, saf + test)
```
plainToLexical(text: string | null | undefined): SerializedEditorState
```
- Boş/whitespace → boş root (children: []).
- Dolu → her satırı (`\n\n` veya `\n`) bir `paragraph` node'una saran kök state.
- Lexical'in beklediği düğüm şekli (type/version/format/direction/indent alanları),
  mevcut `seed-kurumsal.ts`'teki `lex()` helper'ıyla tutarlı üretilir.

### `src/components/ui/RichContent.tsx` (yeni)
```
<RichContent value={LexicalState | string | null | undefined} className? />
```
- `value` bir **string** ise `plainToLexical(value)` ile sarılıp render edilir
  (koddaki düz-string fallback'ler ve henüz taşınmamış içerik çalışmaya devam eder).
- `value` Lexical state (obje, `root` alanı var) ise doğrudan `<RichText>`.
- Boş/null → `null` döner (hiçbir şey render etmez).
- `@payloadcms/richtext-lexical/react`'ın `RichText`'ini kullanır; cast deseni
  mevcut kullanımdaki gibi (`as unknown as Parameters<typeof RichText>[0]['data']`).

## Şema + migration (koleksiyon başına)
Her hedef alan: `type: 'textarea'` → `type: 'richText'`, `editor: liteEditor|fullEditor`,
`localized: true` korunur.

Her koleksiyon için bir Payload migration:
1. `payload migrate:create <ad>` ile üret.
2. Şema ALTER'ları (Payload richText'i jsonb sütun olarak modelleyebilir; üretilen
   SQL olduğu gibi bırakılır).
3. `up({ payload, req })` içinde **backfill**: eski düz-metin değerleri okunur,
   `plainToLexical` ile çevrilir, `payload.update({ ..., req })` ile yazılır.
   - **`req` MUTLAKA geçilir** → backfill migration transaction'ında çalışır,
     ALTER/CREATE kilidiyle deadlock olmaz.
   - Lokalize alanlar: hem `tr` hem `en` locale için (locale:'all' oku → her locale yaz).
   - Lokalize DİZİ alanlar (`altHizmetler`, `surec`, `girisParagraflar`, `ozellikler`):
     localized-array deseni — önce `tr` tüm yapı (satır id'leri korunur), id'ler
     okunur, sonra `en` aynı id'lerle. `seed-danismanlik.ts`'teki desenin aynısı.
   - İdempotent: zaten Lexical (obje) olan değer atlanır.
- `down()`: üretildiği gibi (tip geri alma).

> NOT: textarea→richText sütun tipi dönüşümünde mevcut metin verisi migration
> backfill ile taşınır; ham SQL tip değişimi veriyi düşürebileceğinden backfill
> şema değişiminden sonra çalışır ve değerleri yeniden yazar.

## Render değişiklikleri
Düz `{metin}` / `<p>{metin}</p>` yerine `<RichContent value={pick(field, locale)} />`:
- **ServiceDetail.tsx**: `altHizmetler[].aciklama`, `surec[].aciklama`, `girisLead`,
  `girisParagraflar[].paragraf`. Koddaki `DANISMANLIK_FALLBACK` / mühendislik
  fallback'leri düz string kalabilir (RichContent string'i işler).
- **Ürün görünümü** (`/yazilim/[urun]`): `aciklama`, `ozellikler[].aciklama`.
- **Referans**: liste/detay + ana sayfa görüş bloğu → `gorus.metin`.
- **SSS bileşeni**: `cevap`.
Sade alanlar için dar/inline prose (`prose prose-sm max-w-none`), tam alanlar için
blok `prose prose-neutral dark:prose-invert`.

## Fazlama (uygulama sırası)
Her faz kendi build/lint/test + deploy + prod doğrulaması ile:
1. **Yapı taşları:** lexical.ts + plainToLexical (+test) + RichContent (+test). Deploy yok (koda hazırlık).
2. **Referans.gorus.metin** (tek alan, lokalize, dizi değil) — en basit; deseni doğrular.
3. **Faq.cevap** (tek alan, `localized: true`, dizi değil; tam editör).
4. **Product** (`aciklama` tam + `ozellikler[].aciklama` sade dizi).
5. **Service** (en karmaşık: `girisLead`, `girisParagraflar[].paragraf`, `altHizmetler[].aciklama`, `surec[].aciklama` — lokalize diziler).
6. **Uçtan uca doğrulama** (TR+EN tüm etkilenen sayfalar, /admin'de bir alanı zengin düzenleyip render kontrolü).

## Hata yönetimi
- CMS okumaları mevcut `safe()` ile sarılı kalır.
- `RichContent` null/boş/malformed değerde `null` döner (sayfa çökmemeli).
- Migration backfill idempotent; başarısız faz sonraki fazları bloklamaz (bağımsız).

## Test
- **Unit:** `plainToLexical` (boş, tek paragraf, çok paragraf, sadece boşluk);
  `RichContent` (string girdi → paragraf render, Lexical girdi → doğrudan, null → boş).
- **Doğrulama:** her faz `npm test && npm run lint && npm run build` yeşil; preview'da
  ilgili sayfada içerik render + /admin'de zengin biçim (bold/liste) girip kontrol; TR+EN.

## Kapsam dışı (YAGNI)
- `ozet`/`slogan`/`kapsam` dönüşümü + meta için Lexical→plaintext çıkarıcı.
- Görsel/embed/tablo gibi ileri Lexical blokları (şimdilik metin biçimlendirme yeter).
- Zaten richText olan alanlar (`Project.aciklama`, `RichPage.icerik`, Post, Job).
