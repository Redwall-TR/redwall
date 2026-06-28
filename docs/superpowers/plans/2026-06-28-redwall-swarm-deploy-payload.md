# Redwall — Docker Swarm Yayın + Payload CMS Göçü Uygulama Planı

> **For agentic workers:** Bu plan iki fazlıdır. **Faz 1 (Yayın altyapısı)** bu oturumda inline uygulanır. **Faz 2 (Sanity → Payload göçü)** ayrı bir oturumda, kendi alt-planıyla yürütülür. Adımlar checkbox (`- [ ]`) ile takip edilir.

**Goal:** Redwall sitesini, sıfırdan kurulan yeni bir VDS üzerinde Docker Swarm + Traefik ile yayına almak; GitHub Actions ile Docker Hub'a build/push edip SSH ile otomatik deploy etmek. Ardından CMS'i Sanity (SaaS) yerine self-hosted Payload CMS'e taşımak.

**Architecture:** Tek bağımsız VDS, tek-düğüm (gerekirse çok-düğüm) Docker Swarm. Tüm servisler bu projenin stack'inde: `traefik` (ingress + Let's Encrypt), `web` (Next.js standalone), Faz 2'de `payload` + `postgres` + `minio`. CI: `main`'e push → imaj build → Docker Hub → SSH ile `docker stack deploy`. NEXT_PUBLIC_* build-arg ile imaja gömülür; sırlar runtime env/Docker secret ile verilir.

**Tech Stack:** Next.js 16.1.1 (standalone output, Node 22-alpine), Docker Swarm, Traefik v3, Docker Hub registry, GitHub Actions (`docker/build-push-action`, `appleboy/ssh-action`). Faz 2: Payload CMS 3 (Postgres adapter), PostgreSQL 16, MinIO (S3 uyumlu asset deposu).

## Global Constraints

- **NEXT_PUBLIC_\* build zamanı:** `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`, `NEXT_PUBLIC_SITE_URL` `next build` sırasında bundle'a gömülür → Dockerfile build-arg + CI `vars.*` ile geçilir. Sır değiller (tarayıcıya da gider) → GitHub **Variables**.
- **Sunucu-yalnızı sırlar:** `SANITY_API_READ_TOKEN` (ve Faz 2: `PAYLOAD_SECRET`, `DATABASE_URI`, MinIO anahtarları) yalnız runtime'da okunur → GitHub **Secrets** + sunucuda env/Docker secret. Asla imaja gömülmez.
- **Registry:** Docker Hub (`<DOCKERHUB_USERNAME>/redwall-web`). Swarm node'ları private imajı `--with-registry-auth` ile çeker.
- **Domain:** site `redwall.tr` + `www.redwall.tr` → apex'e 301. Faz 2 CMS: `cms.redwall.tr`.
- **Node:** 22 (Next 16 için ≥ 20.9; 22 LTS kullanılır).
- **Traefik provider:** v3 `--providers.swarm` (eski `docker.swarmMode` değil).
- **Compose değişkeni kaçışı:** Traefik label'larındaki regex `$1` → stack dosyasında `$${1}` yazılır (Compose interpolasyonundan kaçış).

---

## Dosya Yapısı

| Dosya | Sorumluluk | Faz |
|---|---|---|
| `next.config.ts` (mod.) | `output: 'standalone'` + Sanity CDN remotePattern | 1 |
| `Dockerfile` | Çok aşamalı Next standalone imajı (deps→builder→runner, non-root) | 1 |
| `.dockerignore` | Build context'i küçült, sır/`.env` hariç tut | 1 |
| `deploy/stack.yml` | Swarm stack: `traefik` + `web` (+ www→apex, TLS) | 1 |
| `deploy/.env.example` | Tüm değişken/sır şablonu (dokümantasyon) | 1 |
| `.github/workflows/deploy.yml` | CI/CD: build→Docker Hub→SSH→`stack deploy` | 1 |
| `docs/DEPLOY-SWARM.md` | Sunucu bootstrap + DNS + GitHub secret/var + ilk deploy runbook'u | 1 |
| `deploy/stack.cms.yml` | Faz 2: `postgres` + `minio` + `payload` servis tanımları (şablon) | 2 |

---

## FAZ 1 — Yayın Altyapısı (bu oturumda inline)

### Task 1: Next.js standalone çıktısı
**Files:** Modify `next.config.ts`
**Verify:** `npm run build` → `.next/standalone/server.js` üretilir.

- [ ] `output: 'standalone'` ekle; `images.remotePatterns`'e `cdn.sanity.io` ekle (referans logoları Sanity'den).
- [ ] `npm run build` çalıştır, `.next/standalone/server.js` oluştuğunu doğrula.

### Task 2: Dockerfile (multi-stage)
**Files:** Create `Dockerfile`, `.dockerignore`
**Verify:** `docker build` başarılı, imaj `node server.js` ile :3000'de ayağa kalkar.

- [ ] `Dockerfile`: `node:22-alpine` base; `deps` (npm ci) → `builder` (build-arg NEXT_PUBLIC_*, npm run build) → `runner` (non-root nextjs, standalone+static+public kopya, HEALTHCHECK `/tr`).
- [ ] `.dockerignore`: `node_modules`, `.next`, `.git`, `.env*`, `docs`, `deploy`, md dosyaları.
- [ ] Lokal doğrulama: `docker build --build-arg NEXT_PUBLIC_SANITY_PROJECT_ID=22ukr7s6 ... -t redwall-web:test .` → `docker run -p 3000:3000 -e SANITY_API_READ_TOKEN=... redwall-web:test`.

### Task 3: Swarm stack (Traefik + web)
**Files:** Create `deploy/stack.yml`, `deploy/.env.example`
**Verify:** `docker stack deploy` sonrası `redwall_web` + `redwall_traefik` çalışır, TLS sertifikası alınır, `https://redwall.tr` açılır.

- [ ] `traefik` v3: 80/443 (mode host), `--providers.swarm`, Let's Encrypt TLS-challenge, acme volume, manager constraint, web→websecure redirect.
- [ ] `web`: `${WEB_IMAGE}`, `SANITY_API_READ_TOKEN` env, `traefik-public` ağı, 2 replica start-first; Traefik label'ları (Host apex+www, TLS certresolver, port 3000, www→apex redirectregex).
- [ ] `traefik-public` external overlay ağı; `traefik-acme` volume.
- [ ] `.env.example`: `WEB_IMAGE`, `SITE_HOST`, `ACME_EMAIL`, `SANITY_API_READ_TOKEN`.

### Task 4: GitHub Actions CI/CD
**Files:** Create `.github/workflows/deploy.yml`
**Verify:** `main`'e push → Actions imaj build+push (Docker Hub) → SSH ile `stack deploy`. `workflow_dispatch` ile manuel tetikleme.

- [ ] `build` job: Docker Hub login, `docker/build-push-action` (build-args `vars.*`, tags `:latest` + `:${sha7}`, gha cache).
- [ ] `deploy` job (needs build): `appleboy/scp-action` ile `stack.yml` → `/opt/redwall`; `appleboy/ssh-action` ile env (secrets/vars) geçir, `docker login`, `traefik-public` ağını oluştur, `docker stack deploy --with-registry-auth`.
- [ ] Gerekli GitHub **Secrets**: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `SSH_HOST`, `SSH_USER`, `SSH_KEY`, `SANITY_API_READ_TOKEN`. **Variables**: `NEXT_PUBLIC_*`, `SITE_HOST`, `ACME_EMAIL`.

### Task 5: Yayın runbook'u
**Files:** Create `docs/DEPLOY-SWARM.md`
**Verify:** Doküman, sıfır-context bir operatörün VDS'i hazırlayıp ilk deploy'u yapmasına yetecek netlikte.

- [ ] Sunucu bootstrap: Docker kur, `docker swarm init`, `docker network create --driver overlay --attachable traefik-public`, `/opt/redwall` dizini, firewall (80/443/22).
- [ ] DNS: `redwall.tr` + `www` A kaydı → VDS IP. ACME için 80 açık olmalı.
- [ ] GitHub secret/var listesi + nasıl eklenir.
- [ ] İlk deploy + doğrulama (`/tr`, `/en`, `/studio`, TLS, www→apex).
- [ ] Sırların Docker secret ile sıkılaştırılması (opsiyonel hardening).

---

## FAZ 2 — Sanity → Payload CMS Göçü (ayrı oturum)

> Faz 1 yayını çalıştıktan sonra. Site geçici olarak Sanity bulutundan okumaya devam eder; Payload hazır olunca veri katmanı değiştirilir. Aşağısı üst-düzey adımlar; uygulanırken kendi detaylı planına (TDD) açılır.

### A. Payload servisini ayağa kaldır
- `payload` (Payload 3, Postgres adapter) + `postgres:16-alpine` + `minio` servisleri `deploy/stack.cms.yml`'de; `cms.redwall.tr` Traefik route'u.
- Sırlar: `PAYLOAD_SECRET`, `DATABASE_URI=postgres://...`, MinIO `ACCESS_KEY/SECRET_KEY` (Docker secret).
- Asset deposu: MinIO bucket `redwall-media` (Payload S3 storage plugin).

### B. İçerik modelini taşı
- Sanity şemalarını (`service`/`product`/`page`/`referans`/`faq`/`post`/`job`/`siteSettings`/`navigation`) Payload koleksiyonlarına çevir (TS, `defineConfig`).
- Çift dil: Payload `localization` (locales: `tr` default, `en`) → mevcut `localeString/localeText` deseninin karşılığı.
- Zengin metin: Sanity Portable Text → Payload Lexical editör.

### C. Veriyi göç ettir
- Sanity dataset export (NDJSON + asset'ler) → dönüştürme scripti → Payload REST/Local API ile import.
- Asset'ler MinIO'ya yüklenir; referanslar yeni id'lere eşlenir.

### D. Next.js veri katmanını değiştir
- `src/sanity/lib/fetch.ts` + GROQ sorguları → Payload sorgu katmanı (REST/GraphQL veya Local API).
- `urlFor` → MinIO/Payload asset URL üreteci.
- Boş-dayanıklı `payloadFetch<T>(query, fallback)` deseni korunur (mevcut fallback'ler baseline kalır).
- `/studio` route'u kaldırılır; Sanity bağımlılıkları (`sanity`, `next-sanity`, `@sanity/*`) sökülür.

### E. CI/CD genişlet
- İkinci imaj `redwall-cms` (Payload) build+push; `stack.cms.yml` deploy adımı eklenir.

---

## Self-Review (Faz 1)

- **Spec coverage:** Kullanıcının 4 kararı (Docker Hub / yeni Traefik / stack-içi Postgres / SSH deploy) → Task 3–4'te birebir karşılanıyor. ✔
- **Placeholder:** Faz 1 tasklarında somut dosya+komut var; Faz 2 bilinçli üst-düzey (kendi planına açılacak). ✔
- **Tutarlılık:** `WEB_IMAGE`/`SITE_HOST`/`ACME_EMAIL`/`SANITY_API_READ_TOKEN` adları stack.yml ↔ workflow ↔ .env.example ↔ runbook arasında aynı. ✔
