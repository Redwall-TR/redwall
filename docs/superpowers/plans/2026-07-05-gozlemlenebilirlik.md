# Gözlemlenebilirlik (/api/health + GlitchTip) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** `/api/health` endpoint (DB pingli) + env-gated GlitchTip hata takibi (@sentry/nextjs, client+server) + ops GlitchTip docker-compose.

**Architecture:** health = küçük route (DB SELECT 1). Sentry = @sentry/nextjs config dosyaları (DSN yoksa init atlanır → inert) + next.config `withSentryConfig` sarma + env plumbing (build-time NEXT_PUBLIC_SENTRY_DSN + runtime SENTRY_DSN). Ops teslimatı `deploy/glitchtip/`. Env boşken tamamen inert.

**Tech Stack:** Next.js 16 (App Router, instrumentation), `@sentry/nextjs` v10, Payload 3.85, TypeScript, Docker.

## Global Constraints

- Lint: `@typescript-eslint/no-explicit-any` ERROR → `unknown`/gerçek tipler.
- **Env-gating ZORUNLU:** her `Sentry.init` `if (process.env.<DSN>)` guard'ı içinde; DSN yoksa init ATLANIR (inert). Health hariç hiçbir şey env yokken davranış değiştirmez.
- Sentry: `tracesSampleRate: 0` (yalnız hata, APM yok); kaynak-harita YÜKLENMEZ (`withSentryConfig(..., { sourcemaps: { disable: true }, silent: true })` — auth token gerekmez).
- **@sentry/nextjs v10 kurulum sürüm-özeldir:** implementer dosya adları/konumları (src/ setup → `src/instrumentation.ts`, `src/instrumentation-client.ts`; `sentry.server.config.ts`/`sentry.edge.config.ts`) ve `onRequestError`/`onRouterTransitionStart` export'larını KURULU SÜRÜMÜN dokümanına/`node_modules/@sentry/nextjs` tiplerine göre doğrular; aşağıdaki kod v10 desenidir, gerekirse uyarlanır. Build'in geçmesi ŞART.
- Runtime env deseni: `stack.yml` `environment: ${VAR}` + deploy.yml `env:` + `envs:` listesi. Build-time: Dockerfile ARG/ENV + deploy build-args (web+tools).
- Her task `npx tsc --noEmit && npm run lint && npm run build` yeşil. Migration YOK.

---

### Task 1: `/api/health` endpoint

**Files:**
- Create: `src/app/api/health/route.ts`

**Interfaces:** (yok)

- [ ] **Step 1: route yaz** — `src/app/api/health/route.ts`:

```ts
import { getPayloadClient } from '@/lib/cms/client';
import { sql } from '@payloadcms/db-postgres';

export const dynamic = 'force-dynamic';

/** Sağlık kontrolü: uygulama + DB. Uptime Kuma bu URL'i izler. */
export async function GET() {
  const ts = new Date().toISOString();
  try {
    const payload = await getPayloadClient();
    await payload.db.drizzle.execute(sql`SELECT 1`);
    return Response.json({ status: 'ok', db: 'ok', ts }, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[health] DB ping başarısız:', err);
    return Response.json({ status: 'degraded', db: 'error', ts }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
```

- [ ] **Step 2: Doğrula** — `npx tsc --noEmit && npm run lint && npm run build` (0 error). Preview: dev başlat,
  `curl -s -w "\n%{http_code}" http://localhost:3000/api/health` → `{"status":"ok","db":"ok","ts":...}` + `200`.
  Dev sunucuyu durdur.

- [ ] **Step 3: Commit**
```bash
git add src/app/api/health/route.ts
git commit -m "feat: /api/health endpoint (DB pingli, Uptime Kuma için)"
```

---

### Task 2: @sentry/nextjs kurulumu + env-gated config + next.config sarma

**Files:**
- Create: `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation.ts`, `src/instrumentation-client.ts`
- Modify: `package.json` (+`@sentry/nextjs`), `next.config.ts`

**Interfaces:** (yok — SDK config)

- [ ] **Step 1: Kur** — Run: `npm install @sentry/nextjs`
  Expected: package.json'a eklenir.

- [ ] **Step 2: Config dosyaları (env-gated)** — KURULU SÜRÜMÜN desenini doğrula (`node_modules/@sentry/nextjs`),
  aşağıdaki v10 kalıbını uyarla. Konum: src/ projesi → `src/instrumentation.ts` + `src/instrumentation-client.ts`;
  server/edge config proje kökünde (`sentry.server.config.ts`, `sentry.edge.config.ts`) ya da src/ — build'in
  bulacağı yere koy (instrumentation import'u ona göre).

`sentry.server.config.ts`:
```ts
import * as Sentry from '@sentry/nextjs';
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0 });
}
```
`sentry.edge.config.ts`:
```ts
import * as Sentry from '@sentry/nextjs';
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0 });
}
```
`src/instrumentation.ts`:
```ts
import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
```
`src/instrumentation-client.ts`:
```ts
import * as Sentry from '@sentry/nextjs';
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, tracesSampleRate: 0 });
}
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
```
  NOT: import yolları (`../sentry.server.config`) config dosyalarının gerçek konumuna göre ayarlanır.
  `onRequestError`/`onRouterTransitionStart` export adları v10'da bunlar; kurulu sürümde farklıysa uyarla.

- [ ] **Step 3: next.config sarma** — `next.config.ts`: `import { withSentryConfig } from '@sentry/nextjs';`
  en dıştaki export'u sar:
```ts
export default withSentryConfig(withPayload(withNextIntl(nextConfig)), {
  silent: true,
  sourcemaps: { disable: true },
  disableLogger: true,
});
```
  (Mevcut `withPayload(withNextIntl(nextConfig))` korunur, en dışa `withSentryConfig` gelir.)

- [ ] **Step 4: Doğrula (env YOK — inert)** — `npx tsc --noEmit && npm run lint && npm run build` (0 error).
  Build `withSentryConfig` ile kırılmamalı (auth token/DSN olmadan sourcemaps kapalı → uyarı olabilir ama hata YOK).
  Preview: dev başlat, herhangi bir sayfa 200; `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` yokken Sentry init edilmez
  (config guard). Dev'i durdur. (Env-var senaryosu Task 3 sonrası/kullanıcı DSN'iyle.)

- [ ] **Step 5: Commit**
```bash
git add package.json package-lock.json next.config.ts sentry.server.config.ts sentry.edge.config.ts src/instrumentation.ts src/instrumentation-client.ts
git commit -m "feat: @sentry/nextjs env-gated hata takibi (client+server, DSN yoksa inert)"
```

---

### Task 3: Env plumbing — NEXT_PUBLIC_SENTRY_DSN (build) + SENTRY_DSN (runtime)

**Files:**
- Modify: `Dockerfile`, `.github/workflows/deploy.yml`, `deploy/stack.yml`

**Interfaces:** (yok)

- [ ] **Step 1: Dockerfile (client DSN, build-time)** — NEXT_PUBLIC ARG/ENV bloğuna ekle:
  `ARG NEXT_PUBLIC_SENTRY_DSN`; ENV zincirine `    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN` (mevcut
  son ENV satırının `\` biçimini koru; yeni sonuncu `\`'siz — zincir bozulmasın).

- [ ] **Step 2: deploy.yml build-args (client DSN)** — HER İKİ `build-args:` bloğuna (web + tools):
```yaml
            NEXT_PUBLIC_SENTRY_DSN=${{ vars.NEXT_PUBLIC_SENTRY_DSN }}
```

- [ ] **Step 3: deploy.yml runtime env (server DSN)** — SSH deploy adımının `env:` bloğuna
  `SENTRY_DSN: ${{ secrets.SENTRY_DSN }}` ekle; `envs:` listesine `SENTRY_DSN` ekle (mevcut virgüllü listeye).

- [ ] **Step 4: stack.yml (server DSN → container)** — `deploy/stack.yml` web servisi `environment:` bloğuna
  `SENTRY_DSN: ${SENTRY_DSN}` ekle (PAYLOAD_SECRET/TURNSTILE_SECRET_KEY deseniyle aynı).

- [ ] **Step 5: Doğrula** — `npx tsc --noEmit && npm run lint && npm run build` (0 error; bu değişiklikler CI/deploy
  config'i, uygulama build'ini kırmaz). YAML geçerliliği: `python3 -c "import yaml;
  yaml.safe_load(open('deploy/stack.yml')); yaml.safe_load(open('.github/workflows/deploy.yml'))"`. Var'lar
  GitHub'da tanımsızsa boş string → build çalışır, inert (Task 2 guard).

- [ ] **Step 6: Commit**
```bash
git add Dockerfile .github/workflows/deploy.yml deploy/stack.yml
git commit -m "feat: Sentry DSN env plumbing (NEXT_PUBLIC_SENTRY_DSN build + SENTRY_DSN runtime)"
```

---

### Task 4: Ops sunucu — GlitchTip docker-compose + README

**Files:**
- Create: `deploy/glitchtip/docker-compose.yml`, `deploy/glitchtip/.env.example`, `deploy/glitchtip/README.md`

**Interfaces:** (yok — ops teslimatı)

- [ ] **Step 1: docker-compose** — `deploy/glitchtip/docker-compose.yml` (GlitchTip resmi deseni: web + worker + Postgres + Redis):

```yaml
x-environment: &env
  SECRET_KEY: ${GLITCHTIP_SECRET_KEY}
  DATABASE_URL: postgresql://glitchtip:${GLITCHTIP_DB_PASSWORD}@glitchtip-db:5432/glitchtip
  REDIS_URL: redis://glitchtip-redis:6379/0
  PORT: "8000"
  GLITCHTIP_DOMAIN: ${GLITCHTIP_DOMAIN}
  DEFAULT_FROM_EMAIL: ${GLITCHTIP_FROM_EMAIL}
  CELERY_WORKER_AUTOSCALE: "1,3"

services:
  glitchtip-web:
    image: glitchtip/glitchtip:latest
    depends_on:
      glitchtip-db: { condition: service_healthy }
      glitchtip-redis: { condition: service_started }
    environment: *env
    ports:
      - "8000:8000"
    restart: unless-stopped
  glitchtip-worker:
    image: glitchtip/glitchtip:latest
    command: ./bin/run-celery-with-beat.sh
    depends_on:
      glitchtip-db: { condition: service_healthy }
      glitchtip-redis: { condition: service_started }
    environment: *env
    restart: unless-stopped
  glitchtip-migrate:
    image: glitchtip/glitchtip:latest
    command: ./manage.py migrate
    depends_on:
      glitchtip-db: { condition: service_healthy }
    environment: *env
    restart: on-failure
  glitchtip-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: glitchtip
      POSTGRES_USER: glitchtip
      POSTGRES_PASSWORD: ${GLITCHTIP_DB_PASSWORD}
    volumes:
      - glitchtip-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U glitchtip -d glitchtip"]
      interval: 5s
      timeout: 5s
      retries: 10
    restart: unless-stopped
  glitchtip-redis:
    image: redis:7-alpine
    restart: unless-stopped
volumes:
  glitchtip-db-data:
```

- [ ] **Step 2: .env.example** — `deploy/glitchtip/.env.example`:
```
# GlitchTip ops kurulumu — kopyalayıp .env yapın, doldurun
GLITCHTIP_SECRET_KEY=uzun-rastgele-secret-uret-openssl-rand-hex-32
GLITCHTIP_DB_PASSWORD=guclu-bir-parola
GLITCHTIP_DOMAIN=https://hata.redwall.tr
GLITCHTIP_FROM_EMAIL=glitchtip@redwall.tr
```

- [ ] **Step 3: README** — `deploy/glitchtip/README.md`:
```markdown
# GlitchTip Hata Takibi — Ops Sunucu Kurulumu

Redwall için self-hosted, Sentry-uyumlu hata takibi. **Ops/monitör sunucusunda** çalışır
(Umami / Uptime Kuma ile birlikte) — redwall web VDS'inde DEĞİL.

## Kurulum
1. `cp .env.example .env` → `GLITCHTIP_SECRET_KEY` (`openssl rand -hex 32`), `GLITCHTIP_DB_PASSWORD`,
   `GLITCHTIP_DOMAIN` (ör. `https://hata.redwall.tr`) doldur.
2. `docker compose up -d` (ilk açılışta `glitchtip-migrate` DB şemasını kurar).
3. Panele git: `http://<ops-sunucu>:8000` (ya da Traefik/ingress ile GLITCHTIP_DOMAIN). İlk kayıt olan
   kullanıcı admin olur → **güçlü parola** kullan.
4. Organization → **Create Project** (platform: Next.js) → üretilen **DSN**'i kopyala.

## redwall sitesine bağlama
GitHub repo → Settings:
- **Variables**: `NEXT_PUBLIC_SENTRY_DSN` = DSN (client; public — sorun değil)
- **Secrets**: `SENTRY_DSN` = aynı DSN (server; secret olarak)
Sonra redwall'ı yeniden deploy et. Prod runtime hataları GlitchTip'e düşer.
Bu var'lar boşken site sorunsuz çalışır (Sentry init atlanır, inert).

## TLS / ingress
`hata.redwall.tr`'yi glitchtip-web:8000'e Traefik/nginx ile yönlendir (TLS önerilir).
```

- [ ] **Step 4: Doğrula** — YAML geçerliliği: `docker compose -f deploy/glitchtip/docker-compose.yml config`
  (Docker varsa) veya `python3 -c "import yaml; yaml.safe_load(open('deploy/glitchtip/docker-compose.yml'))"`.
  `npx tsc --noEmit` yine 0 (uygulama build'ini etkilemez).

- [ ] **Step 5: Commit**
```bash
git add deploy/glitchtip/
git commit -m "feat: GlitchTip ops sunucu docker-compose + README (self-hosted hata takibi)"
```

---

### Task 5: Doğrulama + deploy

**Files:** (yok)

- [ ] **Step 1: Tam suite** — `npm test && npm run lint && npm run build` → PASS, 0 error.
- [ ] **Step 2: Preview** — `/api/health` → `{status:ok,db:ok}` 200; env yokken Sentry inert (site 200, hata yok).
- [ ] **Step 3: Deploy** — `git checkout main && git merge --no-ff <branch> -m "Merge: gözlemlenebilirlik (health + GlitchTip)"`;
  `git push origin main`. CI: build (SENTRY var'ları BOŞ → inert). `gh run watch`.
- [ ] **Step 4: Prod doğrulama** — `curl -s https://redwall.tr/api/health` → `{status:ok,db:ok}` 200; diğer sayfalar 200;
  view-source'ta Sentry client script YOK (NEXT_PUBLIC_SENTRY_DSN boş — inert, beklenen). Site sağlıklı.
  (GlitchTip sunucu + DSN kullanıcı tarafından kurulunca hata takibi otomatik başlar.)

---

## Self-Review Notları
- **Spec kapsamı:** health endpoint (T1) ✓; @sentry/nextjs env-gated config + next.config (T2) ✓; env plumbing build+runtime (T3) ✓; ops GlitchTip compose+README (T4) ✓; deploy (T5) ✓. MinIO health / source-map / APM kapsam dışı (spec).
- **Env-gated:** her Sentry.init DSN guard'lı → env boşken inert; prod'a boş deploy edilir, kullanıcı DSN kurunca aktif.
- **Risk:** T2 `withSentryConfig(withPayload(...))` sarma + instrumentation v10 sürüm-özel → implementer build'i doğrular, kurulu sürüme uyarlar; kırılırsa BLOCKED (controller'a).
- **Tip tutarlılığı:** health route bağımsız; Sentry config dosyaları DSN env adlarıyla (SENTRY_DSN server / NEXT_PUBLIC_SENTRY_DSN client) T3 plumbing'iyle eşleşir.
- **Health force-dynamic:** DB'yi istek anında pingler (sitemap dersi — DB okuyan route dinamik olmalı).
