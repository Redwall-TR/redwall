# Referans Detay Sayfası + Projeler↔Referanslar İlişkisi — Tasarım

**Tarih:** 2026-06-30 · **Durum:** Onaylandı (kullanıcı), uygulanacak

## Amaç
Referanslar listesinde bir referansa tıklayınca **o referansla yapılan projeleri**
gösteren bir detay sayfası açmak; projeleri referanslara ilişkilendirmek ve proje
detayından referansa, referans detayından projelere iki yönlü gezinme sağlamak.

## Onaylanan kararlar
1. **İlişki modeli:** Project'e **opsiyonel** `referans` ilişki alanı eklenir;
   mevcut serbest-metin `musteri` alanı **fallback olarak kalır**.
2. **Tıklanabilirlik:** Yalnızca **en az bir ilişkili projesi olan** referanslar
   tıklanabilir ve detay sayfası alır. Projesi olmayan logolar statik kalır.
3. **Detay içeriği (minimal):** logo + ad + (varsa) müşteri görüşü + bu referansla
   yapılan projelerin kart listesi. Referans'a yeni açıklama/web/sektör alanı
   **eklenmez**.
4. **Slug backfill:** Mevcut referans satırlarına slug, **migration içinde** otomatik
   doldurulur (prod'da otomatik çalışır).
5. **Mevcut projelerin bağlanması:** Elle, `/admin` panelinden yapılır. `musteri`
   metnine göre otomatik eşleştirme **yapılmaz** (yanlış eşleşme riski).

## Mevcut durum (referans)
- `src/collections/Referans.ts`: `ad`, `logo`, `anasayfada`, `gorus{metin,kisi,unvan}`.
  **slug yok.**
- `src/collections/Project.ts`: `slug`, `baslik`, `musteri` (serbest metin), `isKolu`,
  `durum`, `yil`, `il`, `kapsam`, `ozet`, `aciklama`, `gorseller[]`, `oneCikan`.
  Detay sayfası `/projeler/[slug]` mevcut.
- `/referanslar` listesi: `PaginatedLogoWall` (logo duvarı) + müşteri görüşleri;
  tıklanabilir değil.
- Adaptörler (`src/lib/cms/queries.ts`): `getReferences()` (ad/logo/gorus),
  `getProjects()`, `getProject(slug)` (musteri döner, referans dönmez).

## Veri modeli değişiklikleri

### Referans (`src/collections/Referans.ts`)
- Yeni alan: `slug` — `type: 'text'`, `unique: true`, `required: true`,
  `index: true`. `admin.position: 'sidebar'`.
- `beforeValidate` **field hook**: değer boşsa `ad`'dan slugify üret. Türkçe-duyarlı
  (`ı→i, İ→i, ş→s, ğ→g, ç→c, ö→o, ü→u`), küçük harf, alfanümerik dışı → `-`,
  baştaki/sondaki ve tekrarlı `-` temizlenir.

### Project (`src/collections/Project.ts`)
- Yeni alan: `referans` — `type: 'relationship'`, `relationTo: 'referans'`,
  `hasMany: false`, **opsiyonel**. `admin.description`: "Bu proje bir referans
  (müşteri) kaydına bağlanırsa, referans detay sayfasında listelenir."
- `musteri` alanı korunur (fallback gösterim).

## Slugify yardımcı modülü (`src/lib/slug.ts`)
Saf, test edilebilir fonksiyon:
```
slugify(input: string): string
```
- Türkçe karakter haritası uygulanır → ASCII'ye indirgenir.
- Küçük harfe çevrilir, alfanümerik olmayan karakter dizileri tek `-` olur,
  baş/son `-` kırpılır.
- Boş girdi → `''` döner (hook bu durumda zorunluluk validasyonuna bırakır).

## Query adaptörleri (`src/lib/cms/queries.ts`)
- `getReferences()` → çıktıya `id` ve `slug` eklenir (mevcut alanlar korunur).
- **Yeni** `getReferenceProjectCounts(): Promise<Record<string, number>>` →
  tüm projeleri `depth: 0`, `locale` gerekmeden çeker; her projenin `referans`
  alanını (id) sayar, `{ [referansId]: adet }` döner. (N+1 yok.)
- **Yeni** `getReference(slug: string)` → tek referans (`id, ad, slug, logo, gorus`),
  bulunamazsa `null`. (`safe(..., null)`)
- **Yeni** `getProjectsByReference(refId: string)` → `where: { referans: { equals: refId } }`,
  `sort: '-yil'`, `locale: 'all'`, `depth: 2`. Proje kartı alanlarını döner
  (`slug, baslik, isKolu, durum, yil, il, ozet, gorsel`). (`safe(..., [])`)
- `getProject(slug)` → çıktıya populate edilmiş `referans` eklenir: ilişki varsa
  `{ ad, slug }`, yoksa `null`. (`depth: 2` zaten relationship'i populate eder.)

Tüm yeni adaptörler mevcut `safe(fn, fallback)` desenini ve `export const dynamic`
gerektiren çağrı noktalarını izler.

## Sayfalar / UX

### Yeni: `/referanslar/[slug]/page.tsx`
- `export const dynamic = 'force-dynamic'` (CMS okur).
- `getReference(slug)` `null` ise `notFound()`.
- İçerik:
  - `PageHero` — eyebrow "Referans", title = `ad`, glyph: logo varsa logo görseli,
    yoksa `building` ikonu.
  - Görüş bloğu — `gorus` varsa, mevcut liste sayfasındaki `figure` stiliyle
    tutarlı tek bir alıntı kartı.
  - "Bu referansla yapılan projeler" — `getProjectsByReference(id)` kartları,
    `/projeler` listesindeki proje kartı görünümüyle tutarlı grid; her kart
    `/projeler/[slug]` linki. (Proje yoksa bu sayfaya zaten erişilemez, yine de
    boş-durum metni savunma amaçlı bulunur.)
  - `Cta` + "Referanslara Dön" linki.
- `generateMetadata`: başlık `"{ad} | Referanslar | Redwall"`.

### Değişir: `/referanslar/page.tsx`
- `getReferences()` + `getReferenceProjectCounts()` çağrılır.
- Her referans için `href`: `count > 0` ise `/referanslar/{slug}`, değilse `undefined`.
- `logoItems` artık `{ ad, src, href? }` taşır.

### Değişir: `PaginatedLogoWall` + `LogoWall`
- Öğe tipi `{ ad: string; src?: string; href?: string }` olur.
- `href` varsa logo `next-intl` `Link` ile sarılır (hover ipucu); yoksa mevcut
  statik render korunur. Erişilebilirlik: link `aria-label = ad`.

### Değişir: `/projeler/[slug]/page.tsx`
- Müşteri satırı: `data.referans` set ise `ad` referans detayına (`/referanslar/{slug}`)
  link; değilse mevcut `musteri` düz metni. (Hiçbiri yoksa satır gizli.)

## Migration + backfill
- Şema değişiklikleri (Referans.slug, Project.referans) için Payload Postgres
  migration dosyası üretilir (`payload migrate:create`). CI deploy'da
  `payload migrate` otomatik uygular.
- **Slug backfill** aynı migration'ın `up` adımında: `slug` boş/null olan tüm
  referans satırları için `ad`'dan slugify edilmiş değer yazılır; çakışma olursa
  sonek (`-2`, `-3` …) eklenir. Migration `src/lib/slug.ts`'teki `slugify`'ı
  **import eder** (Payload migration'ları TS'tir, `src`'ten import edilebilir) —
  mantık tek yerde kalır.
- `down`: eklenen sütunlar düşürülür.

## Hata yönetimi
- Tüm CMS okumaları `safe()` ile sarılır → DB hatasında sayfa boş-durumla ayakta kalır.
- Geçersiz slug → `notFound()` (404).
- `referans` ilişkisi silinmiş/erişilemez olursa proje detayı `musteri` metnine düşer.

## Test
- **Unit (`src/lib/slug.test.ts`):** slugify — Türkçe karakterler (ı,İ,ş,ğ,ç,ö,ü),
  boşluk→tire, çoklu boşluk/sembol→tek tire, baş/son tire kırpma, boş girdi.
- **Unit:** tıklanabilirlik eşlemesi — `referansHref(referans, projectCounts)` saf
  yardımcısına çıkarılır (`count > 0` → `/referanslar/{slug}`, değilse `undefined`)
  ve test edilir.
- **Doğrulama:** `npm run lint`, `npm test`, `npm run build` yeşil. Preview'da:
  (a) ilişkili projesi olan referans logosu tıklanır → detay render (logo+ad+görüş+projeler),
  (b) ilişkisiz logo tıklanamaz,
  (c) proje detayında referans linki referans detayına gider,
  (d) TR + EN.

## Deploy
- Branch → main; CI build + `payload migrate` (slug + relationship + backfill otomatik).
- Prod doğrulaması: bir referansı /admin'den birkaç projeye bağla, canlıda detay
  sayfasını ve proje detayındaki linki kontrol et.

## Kapsam dışı (YAGNI)
- Referans'a açıklama/web/sektör alanları.
- `musteri` metninden otomatik proje↔referans eşleştirme.
- Referans bazlı filtre/arama, sayfalama (proje sayısı az).
