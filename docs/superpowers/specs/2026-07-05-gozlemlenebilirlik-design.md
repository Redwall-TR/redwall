# Gözlemlenebilirlik — /api/health + GlitchTip Hata Takibi — Tasarım

**Tarih:** 2026-07-05 · **Durum:** Kararlar alındı (tam @sentry/nextjs); tasarım onayı bekliyor

## Amaç
İki gözlemlenebilirlik yeteneği: (A) `/api/health` endpoint — dış monitör (Uptime Kuma)
uygulamanın + DB'nin sağlığını izlesin (disk-dolma gibi sessiz çökmeleri yakalasın);
(B) **GlitchTip** hata takibi (@sentry/nextjs, client+server, env-gated) — prod runtime
hataları görünür olsun. Ops yol haritasının 3. alt-projesi. GlitchTip **ops sunucusunda**
(kullanıcı kuruyor); web tarafı env yoksa inert.

## Onaylanan kararlar (kullanıcı)
- Hata takibi: **tam @sentry/nextjs** (client + server + edge), env-gated (DSN yoksa inert).
- Kaynak-harita (source map) yükleme YOK → build-time auth token gerekmez, deploy basit.
- GlitchTip ops sunucusunda (Umami/Uptime Kuma ile birlikte).

## Mevcut durum (doğrulandı)
- Özel /api rotası yok (yalnız Payload). @sentry/nextjs yok, instrumentation yok.
- DB erişimi: `getPayloadClient()` → `payload.db.drizzle.execute(sql\`...\`)` (rate-limit'te kanıtlı).
- `next.config.ts`: `withPayload(withNextIntl(nextConfig))`. `@sentry/nextjs` v10.63.
- Runtime env deseni: `stack.yml` `environment: ${VAR}` + deploy.yml `env:` bloğu + `envs:` listesi
  (PAYLOAD_SECRET/SMTP/TURNSTILE gibi). Build-time env: Dockerfile ARG/ENV + deploy build-args (Umami gibi).

## A) `/api/health` endpoint
- **`src/app/api/health/route.ts`**: `export const dynamic = 'force-dynamic'`. GET handler:
  `getPayloadClient()` → `payload.db.drizzle.execute(sql\`SELECT 1\`)`. Başarılıysa
  `Response.json({ status: 'ok', db: 'ok', ts }, { status: 200 })`; hata → `{ status: 'degraded', db: 'error', ts }` `503`.
  Cache-Control: no-store. MinIO kontrolü YOK (YAGNI — kritik yol app+DB).
- Uptime Kuma bu URL'i (`https://redwall.tr/api/health`) HTTP(s) monitörüyle izler; 200 bekler.
- **Birim test edilebilir kısım:** DB ping mantığı fetch/DB gerektirir → route testi yerine
  gözlem (curl). Saf mantık yok; entegrasyon curl ile doğrulanır.

## B) GlitchTip / @sentry/nextjs (env-gated)
- **Kurulum:** `@sentry/nextjs` (v10) devDependency+dependency (npm install).
- **Config dosyaları (env-gated — DSN yoksa init ATLANIR → inert):**
  - `sentry.server.config.ts`: `if (process.env.SENTRY_DSN) Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0 })`.
  - `sentry.edge.config.ts`: aynı (edge runtime).
  - `instrumentation-client.ts`: `if (process.env.NEXT_PUBLIC_SENTRY_DSN) Sentry.init({ dsn: ..., tracesSampleRate: 0 })` + `onRouterTransitionStart` export (v10 gereği).
  - `instrumentation.ts`: `register()` → runtime'a göre server/edge config import; `onRequestError` = `Sentry.captureRequestError` (server hata yakalama).
- **next.config:** `withSentryConfig(withPayload(withNextIntl(nextConfig)), { silent: true, sourcemaps: { disable: true }, disableLogger: true })` — kaynak-harita kapalı (auth token gerekmez), sessiz. DSN yokken de sarma zararsız (yalnız runtime init gated).
- **Env plumbing:**
  - Client: `NEXT_PUBLIC_SENTRY_DSN` — Dockerfile ARG/ENV + deploy.yml build-args (web+tools).
  - Server: `SENTRY_DSN` — `stack.yml` web `environment: SENTRY_DSN: ${SENTRY_DSN}` + deploy.yml `env:` (`SENTRY_DSN: ${{ secrets.SENTRY_DSN }}`) + `envs:` listesine `SENTRY_DSN` eklenir.
  - Var'lar boşsa: build çalışır, init atlanır, inert.
- **Ops teslimatı:** `deploy/glitchtip/docker-compose.yml` (GlitchTip web + worker/celery + Postgres + Redis;
  resmi `glitchtip/glitchtip` imajı) + `.env.example` (SECRET_KEY, DATABASE_URL, EMAIL vb.) + `README.md`
  (kurulum, ilk kullanıcı, proje oluştur → DSN al → GitHub Variables/Secrets'a `NEXT_PUBLIC_SENTRY_DSN` +
  `SENTRY_DSN` gir → redwall redeploy → hata takibi başlar).

## Güvenlik / gizlilik
- Sentry client DSN public (NEXT_PUBLIC) — normal (DSN gizli değil). Server DSN runtime secret.
- `tracesSampleRate: 0` → performans izleme kapalı (yalnız hata; hafif, gizlilik).
- Env boşken hiçbir veri gönderilmez (inert). CSP: `connect-src` yok → Sentry beacon (ops sunucuna) serbest.
  GlitchTip self-hosted → veri sende.

## Test
- **Health:** dev'de `curl -s /api/health` → `{status:'ok',db:'ok'}` 200; DB pingi çalışır. (DB düşükse 503 —
  gözlemle; ana senaryo 200.)
- **Sentry env yok:** `npm run build` temiz; `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` yokken `Sentry.init` çağrılmaz
  (config'te guard) → runtime'da Sentry aktif değil (inert). `withSentryConfig` sarması build'i kırmamalı.
- **Sentry env var:** (yerel geçici DSN ile) init edilir; test hatası GlitchTip'e düşer (kullanıcı ops kurunca).
- `npx tsc --noEmit && npm run lint && npm run build` (0 error) her fazda.

## Kapsam dışı (YAGNI)
- Performans/APM izleme (tracesSampleRate 0).
- Kaynak-harita yükleme (auth token + build karmaşası).
- MinIO health kontrolü (app+DB yeter).
- Log toplama (Loki vb.) — ayrı iş.
- Yedek geri-yükleme provası — 4. alt-proje (ayrı, sonra).
