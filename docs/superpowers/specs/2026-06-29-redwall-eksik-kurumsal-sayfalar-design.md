# Redwall — Eksik Kurumsal/Yasal Sayfalar (Tasarım / Spec)

**Tarih:** 2026-06-29
**Durum:** Onaylandı (brainstorming) → writing-plans'a hazır
**Bağlam:** Site canlı (https://redwall.tr), tamamen Payload CMS'ten okuyor (Faz 2b bitti). 4 AI aracının ortak çıkardığı "resmi şirket web sitesi sayfaları" listesi mevcut siteyle karşılaştırıldı; eksikler 3 alt-faza bölündü. Hepsi sırayla uygulanacak.

## Amaç ve kapsam
Eksik sayfaları ve sistemleri kurmak: yasal uyum (A), kurumsal güven (C), Redwall/SaaS (D). Mevcut mantıksal karşılığı olanlar yeniden yapılmaz. **Kapsam dışı:** B grubu (mesafeli satış, ETBİS, İYS — e-ticaret/e-posta pazarlama yok); TTK 1524 (denetim eşiği aşılmıyor).

## Onaylı kararlar
| Karar | Seçim |
|---|---|
| Uygulama | **Hepsi Payload** (admin'den düzenlenebilir koleksiyonlar) |
| Yasal metin | **Türkçe taslak üret** + "KVKK danışmanına kontrol ettirin" şerhi |
| Künye verisi | **`[DOLDURULACAK: ...]` placeholder** (gerçek MERSİS/sicil/KEP sonra) |
| Çerez | **Hafif onay bandı** (kabul/ret, localStorage) + Çerez Politikası sayfası |

## Mimari (ortak)
Mevcut dinamik `src/app/(site)/[locale]` rotaları + `src/lib/cms` adaptör katmanı. Yeni Payload koleksiyonları (+ adaptör fonksiyonları + boş-dayanıklı). Tüm yeni içerik sayfaları `export const dynamic = 'force-dynamic'` (Payload Local API headers() okur — Faz 2b dersi). i18n: `locale:'all'` → `{tr,en}`.

### Yeni koleksiyonlar
- **`richPage`**: `slug`(unique), `baslik`(localized), `icerik`(richText/Lexical localized), `kategori`(select: legal|kurumsal|redwall), `sonGuncelleme`(date). Genel prose sayfaları.
- **`solution`**: `slug`(unique), `baslik`(localized), `ozet`(localized text), `icerik`(richText localized), `ikon`(select, iconOptions), `hedefKitle`(localized text), `sira`(number). Sektörler/Çözümler (kamu/müteahhit dahil).
- **`teamMember`**: `ad`(text), `unvan`(localized), `foto`(upload media), `bio`(localized textarea), `linkedin`(text), `sira`(number).
- **`document`**: `baslik`(localized), `aciklama`(localized textarea), `dosya`(upload media), `kategori`(localized text), `sira`(number).
- **`siteSettings` (global) genişletme:** `mersisNo`, `ticaretSicilNo`, `kepAdresi` (text; künye için).

Adaptör (`src/lib/cms/queries.ts`): `getRichPage(slug)`, `getRichPagesByCategory(cat)`, `getSolutions()`, `getSolution(slug)`, `getTeam()`, `getDocuments()` — hepsi `locale:'all'`, `safe()` sarmalı, legacy-uyumlu şekil.

---

## Faz A — Yasal uyum

### Sayfalar/sistemler
1. **4 yasal richPage** (kategori=legal), rota `/(site)/[locale]/yasal/[slug]/page.tsx` (force-dynamic, `getRichPage(slug)`):
   - `kvkk-aydinlatma` — 6698 m.10 aydınlatma metni
   - `gizlilik-politikasi` — veri işleme/saklama/aktarım/güvenlik
   - `cerez-politikasi` — çerez türleri + onay mekanizması açıklaması
   - `kullanim-kosullari` — sorumluluk reddi, fikri mülkiyet, kurallar
   - Her birinde üstte **uyarı bandı**: "Bu taslak metindir; yürürlük öncesi KVKK danışmanına kontrol ettirin." + içerikte `[DOLDURULACAK: MERSİS no]` vb.
2. **KVKK Başvuru Formu** `/(site)/[locale]/yasal/kvkk-basvuru/page.tsx`: form (adSoyad, TC/iletişim, başvuru sahibi sıfatı, talep türü [select], açıklama [textarea], KVKK onay checkbox). Mevcut form deseni (`ContactForm`/`QuoteForm`) — client validasyon + başarı durumu. **E-posta gönderimi:** mevcut formlar gibi henüz göndermez; Resend entegrasyonu ayrı iş (roadmap). Not düşülür.
3. **Künye:** `siteSettings`'e mersisNo/ticaretSicilNo/kepAdresi ekle (placeholder). `/iletisim` sayfasına **tam künye bloğu** (ticaret unvanı, açık adres, tel, e-posta, KEP, MERSİS, sicil no). Footer'da künye linki/özeti.
4. **Çerez onay bandı:** `src/components/layout/CookieConsent.tsx` (client) — ilk ziyarette gösterilir, Kabul/Reddet, tercihi `localStorage`'da saklar, kapanır. Çerez Politikası linki. Root layout'a eklenir. Şu an izleme çerezi yok; ileride analytics eklenirse gate altyapısı.
5. **Footer:** yasal linkler satırı (KVKK Aydınlatma | Gizlilik | Çerez | Kullanım Koşulları | Künye).

### Seed
`richPage` 4 yasal doc (TR+EN taslak) + siteSettings künye placeholder'ları.

---

## Faz C — Kurumsal

1. **Çözümler/Sektörler** — `solution` koleksiyonu. `/cozumler` (liste) + `/cozumler/[slug]` (detay, force-dynamic). Seed: birkaç sektör (kamu, müteahhit/inşaat, sağlık, sanayi) + çözüm açıklamaları.
2. **Ekibimiz** — `teamMember` koleksiyonu. `/kurumsal/ekibimiz` (kart grid: foto/ad/unvan/bio/linkedin). Seed placeholder.
3. **İndirilebilir Dokümanlar** — `document` koleksiyonu. `/dokumanlar` (kategori bazlı liste, indirme linki). Seed placeholder (katalog/broşür).

---

## Faz D — Redwall/SaaS (yalın)

1. **Mevzuat Uyumluluğu** `/mevzuat`, **Güvenlik & Veri Koruma** `/guvenlik`, **Nasıl Çalışır** `/yazilim/nasil-calisir`, **Destek** `/destek` — `richPage` (kategori=redwall), taslak içerik.
2. **Kamu/Müteahhit Çözümleri** → Faz C `solution` koleksiyonunda kayıt (ayrı sistem değil).
3. **Demo Talebi** `/yazilim/demo` — form (teklif deseni; ürün, ad, kurum, mesaj). E-posta ayrı iş.
4. **Müşteri Girişi/Portal** → YangınPro uygulamasına **dış link** (nav + footer; ayrı sayfa değil). URL `siteSettings`'e opsiyonel alan veya sabit.

### Menü/footer (her faz kendi linklerini ekler)
Üst menü: **Çözümler** eklenir. Footer: yasal linkler + Künye + Dokümanlar + Müşteri Girişi + (mevcut sütunlar).

---

## Uygulama sırası
Faz A → Faz C → Faz D, her biri kendi writing-plans planı + subagent-driven build + review. Her faz sonunda build/lint/test yeşil. Hepsi bitince tek deploy (main'e merge + push).

## Başarı kriterleri
- Tüm yeni rotalar TR/EN 200, içerik Payload'dan render.
- Yasal sayfalar danışman-şerhli taslak + künye placeholder'lı; çerez bandı çalışır (kabul/ret kalıcı).
- build/lint/test yeşil; mevcut sayfalar regresyonsuz.
- Footer/menü yeni sayfaları sergiliyor.

## Riskler / açık noktalar
- **Form e-posta gönderimi yok** (Resend ayrı iş) — KVKK başvuru + demo formları toplar ama göndermez; net not düşülür (yasal başvuru teslimatı için Resend gerekecek).
- **Yasal metinler taslaktır** — yürürlük öncesi KVKK danışmanı onayı şart (sayfada şerh + spec'te vurgu).
- Künye placeholder'ları gerçek MERSİS/sicil/KEP ile doldurulmalı (yasal erişilebilirlik).
