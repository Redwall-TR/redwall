# SOLID / Kod Kalitesi / Mimari Denetim Raporu

**Tarih:** 2026-07-04
**Kapsam:** `src/` (Next.js 16 App Router + Payload CMS 3.85 + TypeScript)
**Yöntem:** Statik kod okuma, `grep`/`wc` taramaları, `tsc --noEmit`, `npm run lint`, test dosyası envanteri. Hiçbir kaynak dosya değiştirilmedi.

---

## 1. Özet

Toplam **13 bulgu**: **3 Yüksek**, **6 Orta**, **4 Düşük** etkili.

Projenin mimari iskeleti sağlam: Payload Local API'ye erişim tek katmanda (`src/lib/cms/`) toplanmış, bileşenler ve sayfa route'ları Payload'un kendisine değil bu adaptöre bağımlı (DIP açısından temiz — `getPayload`/`getPayloadClient` çağrısı `src/lib/cms/` dışında hiçbir yerde bulunamadı). Hata yönetimi merkezi `safe()` sarmalayıcısı ile tutarlı biçimde uygulanmış, `generateMetadata` kalıpları `buildMetadata()` yardımcı fonksiyonunda toplanmış, `RichPageView` gibi bazı bileşenler config-driven tasarımla kopya-yapıştır sayfaları başarıyla önlemiş. `tsc --noEmit` sıfır hata ile temiz, `npm run lint` 70 uyarı veriyor ve bunların **tamamı** migration dosyalarında (`payload`/`req` parametreleri kullanılmıyor) — kullanıcının "bilinen/kabul edilmiş" dediği kategoriyle birebir örtüşüyor, başka bir uyarı kategorisi (ör. `react-hooks/exhaustive-deps`, component'lerde `no-unused-vars`) çıkmadı.

Buna karşın en büyük mimari borç, "sayfa + fallback içerik" kalıbının tekrar etmesi: `ServiceDetail.tsx` (511 satır) ve `yazilim/[urun]/page.tsx` (559 satır) gibi dosyalar, CMS'ten veri çekme/dönüştürme mantığıyla yüzlerce satırlık iki dilli (tr/en) statik metin bloklarını aynı dosyada barındırıyor — SRP açısından net bir ihlal ve bu dosyaları okunabilir/test edilebilir tutmayı zorlaştırıyor. Ayrıca `#e63950` accent rengi merkezi bir sabit yerine 21 dosyada tekrar tekrar hardcode edilmiş, `TeamMember` koleksiyonu tanımlı olmasına rağmen hiçbir sorgu/route'tan kullanılmıyor (dormant kod), ve `src/lib/cms/queries.ts` içinde 11 yerde `as unknown as X` kaçışı var — bunların bir kısmı gerçekten adaptör sınırında meşru (payload-types şemasında olmayan alanlar için), ama bazıları payload-types.ts güncellenerek ortadan kaldırılabilir.

Test kapsamı iddia edilen sayıyla (53) birebir doğrulandı, ancak testler ağırlıklı olarak saf yardımcı fonksiyonlarda (`slug`, `labels`, `locales`, `sanitizeSvg`, `plainToLexical`) yoğunlaşmış; adaptör katmanının (`queries.ts`) asıl veri-dönüştürme mantığı (`getProject`, `getService`, vb. içindeki map/unwrap dönüşümleri) ve migration'lar test edilmiyor — bu, riskli bir boşluk çünkü şema değişince bu dönüşümler sessizce bozulabilir.

---

## 2. Yüksek etkili bulgular (mimari borç)

### Y1 — `ServiceDetail.tsx`: CMS-render mantığı + yüzlerce satır hardcoded çift-dilli fallback içerik aynı dosyada (SRP ihlali)

**Dosya:** `src/components/sections/ServiceDetail.tsx:54-314` (fallback veri sabitleri), `:318-511` (render mantığı)

`DANISMANLIK_FALLBACK`, `MUHENDISLIK_FALLBACK` ve `DANISMANLIK_SURECLER` sabitleri toplam ~260 satır tr/en metin içeriyor (satır 54-314), ardından aynı dosyanın `ServiceDetail` fonksiyonu (satır 318-511) hem CMS verisini okuyup normalize ediyor hem de JSX render ediyor. Dosya tek başına 511 satır ve üç farklı sorumluluğu (içerik verisi, veri-birleştirme/fallback mantığı, sunum) taşıyor.

```ts
// satır 54-56
const DANISMANLIK_FALLBACK = {
  accent: '#38bdf8',
  eyebrow: { tr: 'Danışmanlık', en: 'Consulting' },
  ...
```

**Öneri:** Fallback içerik sabitlerini `src/content/service-fallbacks.ts` (veya benzeri) ayrı bir veri dosyasına taşı; `ServiceDetail.tsx` sadece veri-birleştirme + render sorumluluğunu üstlensin. `DANISMANLIK_SURECLER` gibi büyük bloklar ayrı dosyalara bölünebilir.
**Efor:** M

### Y2 — `yazilim/[urun]/page.tsx`: aynı kalıp — route dosyası + gömülü ürün içeriği (559 satır)

**Dosya:** `src/app/(site)/[locale]/yazilim/[urun]/page.tsx:59-186` (FALLBACK sabiti, ~130 satır ürün metni), tüm dosya 559 satır

`FALLBACK: Record<KnownSlug, {...}>` sabiti (satır 59'dan başlıyor) YangınPro/MekanikPro için özellik listeleri, açıklamalar, hedef kitle metinlerini kodun içine gömüyor. Bu, route dosyasının (page component) tek sorumluluğu olması gereken "veri çek + sayfayı oluştur" görevini aşıyor; aynı zamanda `generateMetadata` (satır 191) ve sayfa bileşeni aynı dosyada, veri modelleme (`ProductData`, `FEATURE_ICONS`) da yine burada.

**Öneri:** Y1 ile aynı desen — ürün fallback verisini `src/content/product-fallbacks.ts` içine çıkar, sayfa dosyasını render+metadata'ya indirge. `FEATURE_ICONS` haritası da içerikle birlikte taşınabilir.
**Efor:** M

### Y3 — Accent renk sabiti (`#e63950` ve türevleri) merkezi bir kaynak yerine 21 dosyada hardcode

**Dosya:** `src/components/sections/PageContent.tsx:43`, `src/components/sections/ServiceDetail.tsx:55,206` (farklı accent'ler), `src/app/(site)/[locale]/yazilim/[urun]/page.tsx:39`, ve 17 dosya daha (`grep -rln "#e63950" src` ile doğrulandı, 21 dosya).

Örnek:
```ts
// PageContent.tsx:43
const ACCENT = '#e63950';
// yazilim/[urun]/page.tsx:39
const ACCENT = '#e63950';
```
Her dosya kendi yerel `ACCENT` sabitini tanımlıyor; marka rengi değişirse 21 dosyada eşzamanlı güncelleme gerekir. `ServiceDetail.tsx` içinde iş koluna göre farklı accent'ler (`#38bdf8`, `#f59e0b`) de aynı şekilde kod içine gömülü — bunlar tasarım kararı olabilir ama merkezi bir `theme`/`constants` dosyasından türetilmeli.

**Öneri:** `src/lib/theme.ts` (veya `src/lib/constants.ts`) içinde `ACCENT_DEFAULT`, `ACCENT_BY_ISKOLU` gibi merkezi sabitler tanımla, tüm dosyalar oradan import etsin.
**Efor:** S

---

## 3. Orta etkili bulgular

### O1 — `src/lib/cms/queries.ts` içinde 11 adet `as unknown as X` kaçışı, payload-types şemasıyla senkron değil

**Dosya:** `src/lib/cms/queries.ts:53, 113, 208, 229, 246, 271, 441, 475-477, 508-514`

Örnek:
```ts
// satır 208
slug: (r as unknown as { slug?: string }).slug,
```
`referans` koleksiyonunun `slug` alanı, `document` koleksiyonunun `aciklama`/`dosya`/`kategori` alanları ve `siteSettings.marka` alt-nesnesi payload-types.ts'te tip olarak yoksa/eksikse bu kaçışlar kullanılıyor. Bu genelde payload-types.ts'in migration sonrası yeniden üretilmemesinden kaynaklanıyor (schema güncellemesi var ama tip dosyası eski).

**Öneri:** `npx payload generate:types` çalıştırılarak payload-types.ts güncellensin; güncel tipte alan varsa bu cast'lerin çoğu kalkar. Kalanlar (gerçekten dinamik/opsiyonel alanlar) için tip yardımcı fonksiyonları (`getSlug(r)`) yazılabilir.
**Efor:** S

### O2 — `src/app/(site)/[locale]/page.tsx`: 6 adet `as any` kullanımı, adaptör katmanı içinde tip güvenliği tamamen terk edilmiş

**Dosya:** `src/app/(site)/[locale]/page.tsx:44, 89, 93, 105, 163, 167`

```ts
const seo = settings?.seo as any;
...
<Hero data={home as any} locale={locale} />
<ServiceCards services={services as any} locale={locale} />
(istatistikler as any[]).map((stat, i) => (...))
<FeaturedProjects projects={featured as any} locale={locale} />
<ReferenceStrip references={refs as any} counts={refCounts} locale={locale} />
```
Bu dosya `grep -rn ": any\|<any>\|as any" src` taramasında bulunan **tek** `any` kaynağı (6 eşleşme, hepsi bu dosyada) — diğer tüm kod tabanında `any` yok, bu da anasayfanın diğer sayfalara göre daha az tip-disiplinli olduğunu gösteriyor.

**Öneri:** `getHome()`, `getServices()` vb. dönüş tiplerini `queries.ts` içinde adlandırılmış interface'lere bağla (`HomeData`, `ServiceSummary[]`), `page.tsx` bu tipleri import edip `any` yerine kullansın.
**Efor:** S/M

### O3 — `TeamMember` koleksiyonu tanımlı ama tamamen dormant (kullanılmıyor)

**Dosya:** `src/collections/TeamMember.ts:3` (koleksiyon tanımı), `src/payload-types.ts:82,104,780,901,1229` (üretilmiş tipler)

`grep -rn "TeamMember" src` sonucu koleksiyon tanımı ve otomatik üretilmiş `payload-types.ts` dışında hiçbir eşleşme vermedi. `src/lib/cms/queries.ts` içinde `getTeamMembers` gibi bir fonksiyon yok, hiçbir sayfa/route bu koleksiyonu sorgulamıyor. `queries.ts:454-457` içinde de "Team" başlıklı boş bir bölüm var (yorum satırları var, kod yok):
```ts
// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------
```
Bu, koleksiyonun ya kullanılmayı bekleyen yarım bir özellik ya da kaldırılmayı bekleyen ölü kod olduğunu gösteriyor.

**Öneri:** Ürün/iş kararı gerekiyor — ekip sayfası planlanıyorsa `getTeamMembers()` sorgusu + route eklenmeli; planlanmıyorsa koleksiyon ve ilişkili migration/admin konfigürasyonu temizlenmeli.
**Efor:** S (karar) / M (temizlik ya da entegrasyon)

### O4 — `force-dynamic` 10 route'ta kullanılıyor, hiçbirinde gerekçe yorumu yok

**Dosya:** `src/app/(site)/[locale]/referanslar/[slug]/page.tsx:18`, `dokumanlar/page.tsx:30`, `mevzuat/page.tsx:5`, `yazilim/[urun]/page.tsx:187`, `yazilim/nasil-calisir/page.tsx:5`, `yasal/[slug]/page.tsx:31`, `blog/[slug]/page.tsx:33`, `destek/page.tsx:5`, `projeler/[slug]/page.tsx:42`, `guvenlik/page.tsx:5`

`grep -rn "force-dynamic" src/app/` taraması 10 sonuç verdi; hiçbirinin bitişiğinde neden statik render'ın uygun olmadığını açıklayan bir yorum yok. Özellikle `yazilim/[urun]/page.tsx` hem `generateStaticParams` (bilinen slug'lar için, satır civarı) hem `force-dynamic` (satır 187) birlikte kullanıyor — bu iki kalıbın birlikteliği kafa karıştırıcı olabilir (statik + dinamik parametre karışımı, muhtemelen CMS'ten gelen ek/silinen slug'ları desteklemek için bilinçli ama yorumsuz).

**Öneri:** Her `force-dynamic` satırının üstüne tek satırlık gerekçe eklenmeli (ör. "CMS içeriği admin panelinden anlık güncellenebildiği için ISR yerine her istekte taze veri çekilir"). Gerçekten gerekmiyorsa (ör. `revalidate` ile aynı sonucu alacak sayfalarda) kaldırılıp ISR'a geçilmesi değerlendirilmeli.
**Efor:** S

### O5 — `unwrap()` yardımcı fonksiyonu ile manuel `.map((row) => row?.gorsel ?? null)` kalıpları arasında tutarsızlık

**Dosya:** `src/lib/cms/transform.ts:5-9` (`unwrap` tanımı), `src/lib/cms/queries.ts:35, 65-67` (manuel eşdeğer kod, `unwrap` kullanılmıyor), `queries.ts:134, 136, 185-186, 411, 413` (`unwrap` kullanılıyor)

`unwrap<T>(arr, key)` fonksiyonu tam olarak "`[{[key]:v}] → [v], filter(Boolean)`" işini yapıyor, ama `getProjects()` (satır 35) ve `getProject()` (satır 65-67) bu işi elle tekrar yazıyor:
```ts
// satır 35 — unwrap kullanmıyor
gorsel: Array.isArray(r.gorseller) && r.gorseller.length > 0 ? (r.gorseller[0] as Record<string, unknown>)?.gorsel ?? null : null,
// satır 65-67 — unwrap kullanmıyor
gorseller: Array.isArray(r.gorseller)
  ? r.gorseller.map((row: Record<string, unknown>) => row?.gorsel ?? null).filter(Boolean)
  : [],
```
oysa `getService()` (satır 134, 136) ve `getPage()` (satır 411, 413) aynı deseni `unwrap(r.chips, 'etiket')` şeklinde merkezi fonksiyonla çözüyor. Bu DRY açısından küçük ama gerçek bir tutarsızlık — aynı sorunun iki farklı çözümü kod tabanında yan yana yaşıyor.

**Öneri:** `getProjects`/`getProject` içindeki manuel `gorseller` dönüşümünü `unwrap(r.gorseller, 'gorsel')` çağrısına indirge (tek fark: `getProjects` sadece ilk elemanı istiyor, `unwrap(...)[0] ?? null` ile çözülebilir).
**Efor:** S

### O6 — Adaptör katmanında test kapsamı yok: `queries.ts`'in 22 fonksiyonundan hiçbiri doğrudan test edilmiyor

**Dosya:** `src/lib/cms/queries.ts` (22 export edilen fonksiyon), test dosyaları: `src/lib/cms/client.test.ts` (yalnızca `safe()` sarmalayıcısını test ediyor, 2 test), `src/lib/cms/transform.test.ts` (yalnızca `unwrap()`'ı test ediyor, 5 test)

`client.test.ts` ve `transform.test.ts` sadece yardımcı fonksiyonları (`safe`, `unwrap`) test ediyor; `getProjects`, `getProject`, `getService`, `getPage`, `getRichPage`, `getSiteSettings` gibi asıl veri-dönüştürme mantığını içeren 22 fonksiyonun hiçbiri (mock Payload client ile) test edilmiyor. Bu fonksiyonlar `as unknown as X` kaçışları içeriyor (bkz. O1) ve payload şeması değiştiğinde (migration sonrası alan adı/tipi değişince) sessizce yanlış veri döndürebilirler — `safe()` prod'da hatayı yutup fallback döndüreceği için bu regresyon fark edilmeyebilir.

**Öneri:** En azından `getProjects`/`getProject`/`getReference` gibi ilişki-ağırlıklı fonksiyonlar için Payload client'ı mock'layan birkaç birim testi eklenmeli; özellikle `unwrap`/`pick` zincirlerinin doğru alan adlarını okuduğunu doğrulayan testler.
**Efor:** M

---

## 4. Düşük etkili / stil bulguları

### D1 — Migration dosyalarında 70 adet `no-unused-vars` uyarısı (bilinen/kabul edilmiş)

**Dosya:** `src/migrations/*.ts` (18 dosya, her birinde `up`/`down` fonksiyon imzalarında kullanılmayan `payload`/`req` parametreleri)

`npm run lint` çıktısının tamamı (70 uyarı, 0 hata) bu kategoriye ait. Payload'ın migration imza kalıbı (`up({ payload, req })`) gereği bu parametreler her zaman mevcut ama çoğu migration sadece `db` kullanıyor. Kullanıcı tarafından zaten bilinen/kabul edilmiş bir durum olarak belirtilmiş; ek aksiyon önerilmiyor, sadece bu kategorinin **lint çıktısının tamamını** oluşturduğu (yeni/anlamlı başka bir uyarı kategorisi çıkmadığı) teyit edildi.
**Efor:** — (aksiyon gerekmez)

### D2 — `!.` non-null assertion kullanımı sınırlı ve büyük ölçüde güvenli görünüyor, ama bir örnek riskli

**Dosya:** `src/components/sections/PageContent.tsx:468`, `src/app/(site)/[locale]/referanslar/page.tsx:127,148,151`

```ts
// PageContent.tsx:468 — hasKartlar kontrolünden hemen sonra, güvenli
{data.kartlar!.map((k, i) => (
// referanslar/page.tsx:127,148,151 — ref.gorus opsiyonel alan, ! ile zorlanıyor
const unvan = pick(ref.gorus!.unvan, loc) ?? '';
```
`PageContent.tsx:468`'deki kullanım `hasKartlar` kontrolünden hemen sonra geldiği için güvenli (TS daraltması elle yapılmış). `referanslar/page.tsx`'deki 3 kullanım ise `ref.gorus` alanının CMS'te her zaman dolu olduğu varsayımına dayanıyor — `gorus` opsiyonel bir alan olduğundan (bkz. `queries.ts:210` `gorus: r.gorus`) admin panelinden boş bırakılırsa çalışma zamanı hatası riski var.

**Öneri:** `referanslar/page.tsx`'de render öncesi `if (!ref.gorus) return null` gibi bir koruma eklenmesi (veya opsiyonel zincirleme `ref.gorus?.unvan`) daha güvenli olur.
**Efor:** S

### D3 — `'use client'` kullanımı ölçülü ve gerekçeli, gereksiz client bileşeni bulunamadı

**Dosya:** 14 dosya (`grep -rl "'use client'" src` ile listelendi: `Accordion.tsx`, `KvkkBasvuruForm.tsx`, `QuoteForm.tsx`, `PaginatedLogoWall.tsx`, `ContactForm.tsx`, `MobileNav.tsx`, `DemoForm.tsx`, `ThemeProvider.tsx`, `FormFields.tsx`, `ProjectsExplorer.tsx`, `LocaleSwitcher.tsx`, `ThemeToggle.tsx`, `CookieConsent.tsx`, `Header.tsx`)

Tüm 14 dosya incelendiğinde her biri gerçek etkileşim (form state, tema değiştirme, mobil menü açma/kapama, sayfalama, cookie consent) gerektiriyor; salt statik içerik render eden ama gereksiz yere `'use client'` işaretlenmiş bir dosya bulunamadı. Bu olumlu bir bulgu (D bölümüne, negatif bir bulgu olmadığı için düşük öncelik olarak not edildi).
**Efor:** — (aksiyon gerekmez, doğrulama amaçlı not)

### D4 — Boş durum (empty state) kontrolleri tutarlı ama iki farklı üslupla yazılmış

**Dosya:** `src/app/(site)/[locale]/dokumanlar/page.tsx:96` (`documents.length === 0 ?`), `src/app/(site)/[locale]/blog/page.tsx:79` (`posts.length === 0 ?`) vs. `src/app/(site)/[locale]/referanslar/page.tsx:112` (`references.length > 0 ?`), `kariyer/page.tsx:137` (`jobs.length > 0 ?`)

Bazı sayfalar `length === 0 ? <Empty/> : <List/>` sırasıyla yazarken bazıları `length > 0 ? <List/> : <Empty/>` sırasıyla yazıyor. İşlevsel bir hata yok, sadece okunabilirlik/tutarlılık açısından küçük bir stil farkı.
**Öneri:** Ekip içi bir konvansiyon belirlenip (ör. her zaman "pozitif" koşul önce) yeni sayfalarda uygulanabilir; mevcut kodun değiştirilmesi zorunlu değil.
**Efor:** S (yalnızca yeni kod için konvansiyon)

---

## 5. Güçlü yanlar

- **Tutarlı adaptör katmanı / DIP disiplini:** `getPayload`/`getPayloadClient` çağrısı yalnızca `src/lib/cms/client.ts` içinde bulunuyor; `src/components/` ve `src/app/` hiçbir yerde doğrudan Payload Local API'sine bağımlı değil, hepsi `src/lib/cms/queries.ts` üzerinden geçiyor. `@payloadcms/richtext-lexical/react`'ın `RichText` bileşeni bazı sayfalarda doğrudan import edilse de bu, Payload'ın kendi sunum bileşeni olduğu için adaptör sızıntısı sayılmaz.
- **Merkezi hata yönetimi:** `safe()` sarmalayıcısı (`src/lib/cms/client.ts:15-25`) tutarlı biçimde 24 yerde kullanılıyor; prod'da fallback dönüp geliştirmede hatayı fırlatma stratejisi (satır 20-23) bilinçli ve dokümante edilmiş bir tasarım kararı.
- **TypeScript sağlığı genel olarak iyi:** `tsc --noEmit` sıfır hata veriyor; `any` kullanımı kod tabanının tamamında yalnızca tek bir dosyada (`src/app/(site)/[locale]/page.tsx`, 6 kullanım) yoğunlaşmış, bu da disiplinin genel olarak korunduğunu gösteriyor.
- **OCP'ye uygun config-driven tasarım örneği:** `RichPageView.tsx` (`src/components/sections/RichPageView.tsx`), `mevzuat`/`guvenlik`/`destek`/`yazilim/nasil-calisir` gibi 4-5 benzer sayfanın render+metadata mantığını tek yerde topluyor ve dosya içi yorum (satır 13-15) bu kararın gerekçesini açıkça belirtiyor — kopyala-yapıştır sayfa çoğaltmasının nasıl önlenmesi gerektiğine dair iyi bir emsal.
- **Merkezi metadata yardımcı fonksiyonu:** `buildMetadata()` (`src/lib/metadata.ts`) 26 sayfada tekrarlanan `generateMetadata` kalıbının SEO/hreflang mantığını tek yerde topluyor.
- **Lint temizliği:** `npm run lint` yalnızca migration dosyalarında (kabul edilmiş) 70 uyarı veriyor, sıfır hata; component/sayfa kodunda yeni/anlamlı bir uyarı kategorisi yok.
- **Test sayısı doğrulandı:** 53 test (`it`/`test` çağrısı toplamı, 13 test dosyasında) — kullanıcının iddiasıyla birebir örtüşüyor.
