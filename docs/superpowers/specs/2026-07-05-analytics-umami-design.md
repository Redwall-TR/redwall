# Analytics (Umami, self-hosted) — Tasarım

**Tarih:** 2026-07-05 · **Durum:** Yol haritası kararları alındı (Umami + ops sunucu); tasarım onayı bekliyor

## Amaç
redwall.tr'ye gizlilik-dostu, self-hosted **Umami** analytics eklemek. Web tarafı
**env-gated**: ilgili env değişkenleri tanımlı değilse sitede hiçbir şey basılmaz
(dev'de ve ops sunucu hazır olana kadar tamamen inert). Ops/monitör sunucusu için
hazır `docker-compose` + kurulum notu verilir. Ops yol haritasının 2. alt-projesi.

## Onaylanan kararlar (kullanıcı)
- Araç: **Umami** (hafif, çerezsiz → KVKK dostu, çerez banner'ı gerekmez).
- Yer: **yeni ops/monitör sunucusu** (kullanıcı kuruyor; Uptime Kuma + GlitchTip ile birlikte).
- Web tarafı env-gated; sunucu URL + website ID env ile bağlanır.

## Mevcut durum (doğrulandı)
- deploy.yml `NEXT_PUBLIC_*=${{ vars.* }}` build-arg deseni (web + tools hedefi).
- Dockerfile `ARG`/`ENV NEXT_PUBLIC_*` deseni.
- `src/app/(site)/[locale]/layout.tsx` public site'ı sarar (JsonLd burada); `/admin` ayrı
  route-group (izlenmez — istenen). `next/script` henüz kullanılmıyor.
- CSP'de `script-src` YOK (bilinçli) → dış Umami script'i varsayılan olarak serbest,
  **CSP değişikliği gerekmez**. Umami çerezsiz olduğu için consent/banner gerekmez.

## Mimari / bileşenler

### 1. Web tarafı (bu repo)
- **`src/components/analytics/Analytics.tsx`** (server component): env okur —
  `NEXT_PUBLIC_UMAMI_URL` + `NEXT_PUBLIC_UMAMI_WEBSITE_ID`. İkisi de doluysa
  `next/script` ile Umami izleme script'ini basar:
  `<Script defer src="${UMAMI_URL}/script.js" data-website-id="${WEBSITE_ID}" strategy="afterInteractive" />`.
  Biri boşsa `null` döner (inert). Trailing slash normalize edilir.
- **Layout bağlama:** `src/app/(site)/[locale]/layout.tsx` içine `<Analytics />` eklenir
  (public site geneli; /admin izlenmez).
- **Env plumbing:** `Dockerfile`'a `ARG`/`ENV NEXT_PUBLIC_UMAMI_URL` + `NEXT_PUBLIC_UMAMI_WEBSITE_ID`;
  `deploy.yml` web + tools build-args'ına `${{ vars.NEXT_PUBLIC_UMAMI_URL }}` +
  `${{ vars.NEXT_PUBLIC_UMAMI_WEBSITE_ID }}`. Var'lar BOŞ kalırsa build çalışır, script inert.

### 2. Ops sunucu teslimatı (bu repo'da doküman, kullanıcı kaldırır)
- **`deploy/umami/docker-compose.yml`**: Umami (resmi imaj `ghcr.io/umami-software/umami:postgresql-latest`)
  + kendi Postgres'i (ayrı DB; redwall Postgres'inden bağımsız). `APP_SECRET`, `DATABASE_URL` env.
- **`deploy/umami/README.md`**: kurulum adımları — compose up, ilk admin (admin/umami → parola değiştir),
  panelde "Add website" (domain redwall.tr) → üretilen **Website ID**'yi al → GitHub Variables'a
  `NEXT_PUBLIC_UMAMI_WEBSITE_ID` + `NEXT_PUBLIC_UMAMI_URL` (ör. https://analytics.redwall.tr) gir →
  redwall yeniden deploy → izleme başlar. Traefik/TLS notu (ops sunucu ingress'ine göre).

## Faz 2 (opsiyonel, sonra) — dönüşüm izleme
Form gönderimi başarılı olunca Umami custom event (`umami.track('form', {tur})`). Bu spec'te
kapsam dışı; temel sayfa-görüntüleme izleme yeterli. Ayrı küçük iş.

## Test
- **Env yok:** `npm run build` temiz; render'da Umami script YOK (Analytics null döner) — birim/gözlem.
- **Env var (yerel `.env.local`):** `NEXT_PUBLIC_UMAMI_URL` + `_WEBSITE_ID` set → sayfada
  `<script ... data-website-id=...>` belirir (curl/view-source).
- **Birim test:** Analytics saf-mantık kısmı (env → script basılır mı) test edilebilirse; değilse gözlem.
- Ops compose: `docker compose config` ile yml geçerliliği (kullanıcı sunucuda `up` eder).

## Hata yönetimi / güvenlik
- Env yoksa inert (site etkilenmez).
- Umami script dış kaynak ama çerezsiz + PII toplamaz (IP anonim); CSP script-src eklenmediğinden serbest.
- `NEXT_PUBLIC_*` istemciye açık (public); Umami URL + website ID zaten public bilgi (sorun değil).

## Kapsam dışı (YAGNI)
- Umami'yi redwall web VDS'ine kurmak (ayrı ops sunucu kararı verildi).
- GA/GTM, çerez banner'ı, consent yönetimi (Umami çerezsiz).
- Dönüşüm event'leri (faz 2).
- Uptime izleme (ayrı monitör sunucu — kullanıcı, Uptime Kuma).
