# Faz 2 — Sanity → Payload CMS Göçü (Tasarım / Spec)

**Tarih:** 2026-06-28
**Durum:** Onaylandı (brainstorming) → writing-plans'a hazır
**Bağlam:** Site canlı (https://redwall.tr, Docker Swarm + Traefik, Sanity bulut CMS). Bu spec, CMS'i self-hosted **Payload CMS 3**'e taşır. İlgili: [`../plans/2026-06-28-redwall-swarm-deploy-payload.md`](../plans/2026-06-28-redwall-swarm-deploy-payload.md) (Faz 1).

---

## 1. Amaç ve kapsam

Sanity (SaaS, bulut Content Lake) yerine **Payload CMS 3'ü mevcut Next.js uygulamasına entegre** ederek self-hosted, veri-sahipliği bizde olan bir CMS kurmak. Veri PostgreSQL'de, medya MinIO'da, hepsi projenin Swarm stack'inde.

**Kapsam dışı:** Yeni içerik tipleri/sayfalar; tasarım değişiklikleri; YANGINPRO/diğer projeler.

---

## 2. Mimari kararlar (onaylı)

| Karar | Seçim | Gerekçe |
|---|---|---|
| Konumlandırma | **Entegre** (Payload, Next app içinde) | Şema+tüketici atomik deploy → version-skew penceresi yok (veri bütünlüğü). Local API = HTTP/CORS yok, en hızlı. Tek imaj/deploy. |
| Veritabanı | **PostgreSQL 16** (stack içi, iç ağ) | Payload Postgres adapter; YANGINPRO Postgres deneyimi. |
| Medya deposu | **MinIO (S3)** | Web ×2 replika arası paylaşımlı obje deposu (yerel disk replikalar arası paylaşılamaz). |
| i18n | Payload yerleşik **localization** (`tr` default + `en`) | Mevcut `{tr,en}` alan-bazlı desenine birebir. |
| İçerik göçü | **Sıfırdan seed** (kod) | Sanity'de ağırlıkla placeholder; gerçek içerik Payload admin'de girilecek. |
| Zengin metin | Portable Text → **Lexical** | Payload varsayılan editörü. |

---

## 3. Sistem mimarisi

```
                 Cloudflare (Full) → redwall.tr
                          │
                    Traefik (443)
                          │
            ┌─────────────┴─────────────┐
            │   web ×2 (Next + Payload)  │   redwall.tr        → site (SSR/SSG)
            │   - site (Local API ile)   │   redwall.tr/admin  → Payload paneli
            └───────┬───────────┬────────┘
        Local API   │           │  S3 SDK
                    ▼           ▼
              postgres:16     minio          (ikisi de yalnız iç overlay ağında)
              (payload DB)    (media bucket)
```

- **Tek imaj:** `redwall-web` artık hem siteyi hem Payload'ı (admin + Local API) içerir.
- `postgres` ve `minio` **dışa publish edilmez**; sadece `app-internal` adlı (yeni) iç overlay ağında. Web her iki ağda (`traefik-public` + `app-internal`).
- MinIO konsolu gerekiyorsa ayrı korumalı bir Traefik route ile (opsiyonel, sonradan).

---

## 4. Veri modeli

### Koleksiyonlar (Sanity belge tiplerinden)
`service`, `product`, `page`, `referans`, `faq`, `post`, `job`, `media`. Her biri mevcut Sanity şema alanlarını karşılar (localized alanlar Payload `localized: true`).

### Globals (tekil belgeler)
`siteSettings`, `navigation` — Payload **globals** olarak (tek kayıt).

### i18n
- Payload config: `localization: { locales: ['tr','en'], defaultLocale: 'tr' }`.
- Mevcut `localeString`/`localeText`/`localePortableText` alanları → Payload alanında `localized: true` (string/textarea/richText).
- Frontend okurken `locale` parametresi Local API'ye geçirilir; mevcut `pick()` benzeri seçim Payload'ın locale çözümüne devredilir.

### Medya
- `media` koleksiyonu `upload` tipinde, MinIO S3 storage plugin (`@payloadcms/storage-s3`).
- `urlFor()` (Sanity image-url) yerine Payload upload URL'leri; `next/image` `remotePatterns`'a MinIO/asset hostu eklenir (Sanity `cdn.sanity.io` kaldırılır).

---

## 5. Veri bütünlüğü ve güvenlik

- **Migration'lar:** Payload Postgres migration dosyaları (`payload migrate:create`), repo'da versiyonlu. Production'da `push: false` — şema yalnızca denetlenmiş migration'larla değişir. CI deploy adımı `payload migrate` çalıştırır.
- **Expand-contract:** Alan tipi değişiminde ekle→doldur→kaldır (sıfır kesinti, geri alınabilir).
- **Yedek:** Her migration öncesi otomatik `pg_dump` → MinIO'ya (CI deploy adımında veya cron).
- **Güvenlik:** Postgres/MinIO iç ağda, dışa kapalı. `/admin` Payload kimlik doğrulamasıyla korumalı (ilk admin seed'de oluşturulur). Sırlar **Docker secret**: `PAYLOAD_SECRET`, `DATABASE_URI`, `MINIO_ROOT_USER/PASSWORD`, S3 anahtarları.
- Mevcut kod-içi boş-dayanıklı fallback'ler korunur (Payload erişilemezse site fallback gösterir).

---

## 6. Alt-fazlar (uygulama sırası)

### Faz 2a — Payload temeli (canlı site etkilenmez)
1. Payload'ı Next app'e entegre et (`payload.config.ts`, `/admin` route, `/(payload)` grubu).
2. `postgres` + `minio` servislerini stack'e ekle (`app-internal` ağı, Docker secret'lar).
3. Koleksiyonlar + globals + i18n + media (S3) tanımla.
4. İlk migration + seed (placeholder içerik + ilk admin kullanıcı).
5. CI: deploy adımına `payload migrate` (+ migration öncesi pg yedeği) ekle.
6. Deploy → `redwall.tr/admin` çalışır; **site hâlâ Sanity'den okur.**

**Bitince:** Çalışan, seed'li, Swarm'da Payload CMS. Site davranışı değişmemiş.

### Faz 2b — Cutover (Sanity → Payload veri katmanı)
1. `sanityFetch`/GROQ → Payload Local API saran ince katman (`payloadFetch`/sorgu fonksiyonları), boş-dayanıklı.
2. Komponentleri/sayfaları tek tek Payload'a bağla (her biri build + görsel doğrulama).
3. `urlFor` → Payload asset URL üreteci; `next.config` `remotePatterns` güncelle.
4. Hepsi geçince Sanity'yi kaldır: `/studio`, `src/sanity/*`, `sanity`/`next-sanity`/`@sanity/*` paketleri, `SANITY_*` env/secret.
5. Gerçek içerik girişi Payload admin'de (kullanıcı; ayrı/sürekli iş).

**Bitince:** Site Payload'dan okur; Sanity bağımlılığı sıfır.

---

## 7. Etkilenen başlıca dosyalar (üst düzey; detay plan'da)

- **Yeni:** `src/payload.config.ts`, `src/collections/*`, `src/globals/*`, `src/app/(payload)/admin/*`, `deploy/` (postgres/minio servis tanımları + secret'lar), seed script, migration'lar.
- **Değişen:** `next.config.ts` (Payload plugin, remotePatterns), `package.json` (payload paketleri ekle / Sanity'leri 2b'de çıkar), `.github/workflows/deploy.yml` (migrate adımı), veri okuyan tüm Server Component'ler (2b).
- **Kaldırılan (2b):** `src/sanity/*`, `/studio` route, Sanity paketleri.

---

## 8. Başarı kriterleri

- **2a:** `redwall.tr/admin` açılır, giriş yapılır, koleksiyonlar görünür, seed içerik var, medya MinIO'ya yüklenir; canlı site (Sanity'den) etkilenmemiştir; CI migration'ı çalıştırır.
- **2b:** Tüm sayfalar (TR/EN) Payload verisiyle 200 döner ve doğru içerik render eder; `/studio` ve Sanity bağımlılıkları kaldırılmıştır; build+lint temiz; canlı doğrulama (origin + Cloudflare) yeşil.

---

## 9. Riskler / açık noktalar

- **Bellek:** Sunucu 5.8 GB; web ×2 + Payload + Postgres + MinIO sığmalı (Faz 1'de ownpilot kaldırıldı, alan açıldı). 2a deploy'da kaynak izlenecek; gerekirse web ×1'e veya limitlere çekilir.
- **Lexical ↔ Portable Text:** Zengin metin alanlarının yapısı farklı; seed'de Lexical formatında üretilecek (mevcut blog/portable text içeriği placeholder olduğundan dönüştürme gerekmez).
- **Payload sürümü:** En güncel Payload 3.x; Next 16 + React 19 uyumu plan başında doğrulanacak (uyum sorunu çıkarsa sürüm sabitlenir).
