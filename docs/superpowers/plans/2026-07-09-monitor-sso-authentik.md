# SSO/RBAC — Authentik (Tur 2-C) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Monitör kutusundaki 4 insan paneline tek kimlik (Authentik SSO: Grafana+GlitchTip OIDC, Kuma+Umami forward-auth) + TOTP + RBAC iskeleti + 2-katman break-glass.

**Architecture:** Authentik yığını (server+worker+pg+redis) `/opt/authentik`'e Umami/GlitchTip deseniyle kurulur; `auth.redwall.tr` (CF orange, cloudflare-ips, tls=true). Grafana/GlitchTip native OIDC; Kuma/Umami önüne Traefik `forwardAuth` (Authentik embedded outpost). Authentik yapılandırması bootstrap API token'ıyla otomatize edilir; 2FA-gerektiren Kuma adımları kullanıcı-UI'lıdır.

**Tech Stack:** Authentik (en son kararlı — kurulumda doğrulanır) · postgres:16-alpine · redis · Traefik v3.7.6 (mevcut) · Grafana 13 generic_oauth

**Spec:** `docs/superpowers/specs/2026-07-09-monitor-sso-authentik-design.md`

## Global Constraints

- **Sürüm:** Authentik en son KARARLI; `curl -s https://api.github.com/repos/goauthentik/authentik/releases/latest` ile doğrula — tahmin etme. İmaj: `ghcr.io/goauthentik/server:<sürüm>`.
- **Sıfır dokunuş:** yalnız monitör kutusu (194.62.52.22). SSH deseni hafızada (`redwall-sunucu-erisim.md`); parolalar repoya/rapora yazılmaz.
- **Secrets:** sunucu `/opt/authentik/.env` (600); repoda `.env.example`. `AUTHENTIK_SECRET_KEY`/parolalar `openssl rand -base64 36` ile.
- **Bilinen tuzaklar uygulanır:** tek-dosya rsync → `--inplace`; compose'da `$`→`$$` (bu planda bcrypt yok ama secret'larda `$` çıkarsa geçerli); Grafana-13 sabit-uid yasak; monitör kutusunda elle `docker compose` kullanılır (envsubst'lı deploy.sh YOK — bu kutunun deseni düz compose+.env'dir, license'la karıştırma).
- **Kullanıcı-UI kapıları:** Kuma ayarları (2FA'lı) ve Kuma'ya monitör ekleme KULLANICIDAN istenir; TOTP zorunlaması API ile olmuyorsa UI adımı raporlanır.
- **Break-glass sıra şartı:** Kuma iç girişi, SSH-tünel yolu CANLI test edilmeden kapatılMAZ (Task 5 içinde sıralı).
- **Geri alınabilirlik:** her panel entegrasyonu tek env-bloğu/label-satırı — bozulursa o blok geri alınır, panel eski girişine döner.
- Türkçe yorumlar; branch `ops/monitor-sso-tur2c`; her task commit'li.

---

### Task 1: Authentik IaC (deploy/authentik)

**Files:**
- Create: `deploy/authentik/docker-compose.yml`, `deploy/authentik/.env.example`, `deploy/authentik/README.md` (iskelet — runbook Task 8'de dolar)

**Interfaces:**
- Produces: `auth.redwall.tr` router'ı; `authentik-server` servisi (monitor_monitor-net'te, :9000); `authentik-fa` forwardAuth middleware'i (Task 5-6 referanslar); bootstrap admin `akadmin` + API token deseni.

- [ ] **Step 1: Sürüm doğrula**

```bash
curl -s https://api.github.com/repos/goauthentik/authentik/releases/latest | python3 -c 'import sys,json;print(json.load(sys.stdin)["tag_name"])'
```
Expected: `version/20XX.X.X` benzeri — compose'taki `SURUM` yerine (imaj etiketi `20XX.X.X` biçimi).

- [ ] **Step 2: docker-compose.yml yaz** (Umami deseni: internal ağ + monitor-net dış, healthcheck'li pg)

```yaml
# Authentik SSO — monitör Traefik'ine bağlı (auth.redwall.tr). Umami/GlitchTip deseniyle:
# düz compose, /opt/authentik, secrets .env'de (600). TLS: CF-Full → tls=true, ACME yok.
# forwardAuth middleware BURADA tanımlı (sahibi auth'un kendisi — authentik çökmüşse
# forward-auth'un da çökmesi davranış değiştirmez; break-glass runbook'ta).
name: authentik

networks:
  internal:
  monitor-net:
    external: true
    name: monitor_monitor-net

volumes:
  authentik-db-data:
  authentik-media:

services:
  authentik-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: authentik
      POSTGRES_USER: authentik
      POSTGRES_PASSWORD: ${AUTHENTIK_PG_PASSWORD}
    volumes:
      - authentik-db-data:/var/lib/postgresql/data
    networks: [internal]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U authentik -d authentik"]
      interval: 5s
      timeout: 5s
      retries: 10
    restart: unless-stopped

  authentik-redis:
    image: redis:alpine
    command: --save 60 1 --loglevel warning
    networks: [internal]
    healthcheck:
      test: ["CMD-SHELL", "redis-cli ping | grep PONG"]
      interval: 5s
      timeout: 3s
      retries: 10
    restart: unless-stopped

  authentik-server:
    image: ghcr.io/goauthentik/server:SURUM_ADIM1
    command: server
    environment:
      AUTHENTIK_SECRET_KEY: ${AUTHENTIK_SECRET_KEY}
      AUTHENTIK_POSTGRESQL__HOST: authentik-db
      AUTHENTIK_POSTGRESQL__NAME: authentik
      AUTHENTIK_POSTGRESQL__USER: authentik
      AUTHENTIK_POSTGRESQL__PASSWORD: ${AUTHENTIK_PG_PASSWORD}
      AUTHENTIK_REDIS__HOST: authentik-redis
      # İlk kurulum: akadmin parolası + API token (otomasyon için) — yalnız İLK boot'ta işlenir
      AUTHENTIK_BOOTSTRAP_PASSWORD: ${AUTHENTIK_BOOTSTRAP_PASSWORD}
      AUTHENTIK_BOOTSTRAP_TOKEN: ${AUTHENTIK_BOOTSTRAP_TOKEN}
      AUTHENTIK_ERROR_REPORTING__ENABLED: "false"
    depends_on:
      authentik-db: { condition: service_healthy }
      authentik-redis: { condition: service_healthy }
    volumes:
      - authentik-media:/media
    networks: [internal, monitor-net]
    restart: unless-stopped
    labels:
      - traefik.enable=true
      - traefik.docker.network=monitor_monitor-net
      - traefik.http.routers.authentik.rule=Host(`auth.redwall.tr`)
      - traefik.http.routers.authentik.entrypoints=websecure
      - traefik.http.routers.authentik.tls=true
      - traefik.http.routers.authentik.middlewares=cloudflare-ips
      - traefik.http.services.authentik.loadbalancer.server.port=9000
      # forwardAuth middleware (Kuma/Umami router'ları referanslar — Task 5/6):
      - traefik.http.middlewares.authentik-fa.forwardauth.address=http://authentik-server:9000/outpost.goauthentik.io/auth/traefik
      - traefik.http.middlewares.authentik-fa.forwardauth.trustForwardHeader=true
      - traefik.http.middlewares.authentik-fa.forwardauth.authResponseHeaders=X-authentik-username,X-authentik-groups,X-authentik-email,X-authentik-name,X-authentik-uid

  authentik-worker:
    image: ghcr.io/goauthentik/server:SURUM_ADIM1
    command: worker
    environment:
      AUTHENTIK_SECRET_KEY: ${AUTHENTIK_SECRET_KEY}
      AUTHENTIK_POSTGRESQL__HOST: authentik-db
      AUTHENTIK_POSTGRESQL__NAME: authentik
      AUTHENTIK_POSTGRESQL__USER: authentik
      AUTHENTIK_POSTGRESQL__PASSWORD: ${AUTHENTIK_PG_PASSWORD}
      AUTHENTIK_REDIS__HOST: authentik-redis
      AUTHENTIK_ERROR_REPORTING__ENABLED: "false"
    depends_on:
      authentik-db: { condition: service_healthy }
      authentik-redis: { condition: service_healthy }
    volumes:
      - authentik-media:/media
    networks: [internal]
    restart: unless-stopped
```

- [ ] **Step 3: .env.example yaz**

```
# Authentik (deploy/authentik) — cp .env.example .env → doldur. COMMIT EDİLMEZ.
# Üretim: openssl rand -base64 36
AUTHENTIK_SECRET_KEY=degistir
AUTHENTIK_PG_PASSWORD=degistir
# İlk boot'ta akadmin parolası + API otomasyon token'ı (sonradan değiştirilebilir)
AUTHENTIK_BOOTSTRAP_PASSWORD=degistir
AUTHENTIK_BOOTSTRAP_TOKEN=degistir
```

- [ ] **Step 4: README iskeleti** (kurulum: DNS ön-koşul, /opt/authentik, compose up; runbook bölüm başlıkları boş — Task 8 doldurur — başlıklar: Break-glass, Yeni kullanıcı, Oturum öldürme, Panel entegrasyon envanteri).

- [ ] **Step 5: Yerel doğrulama + commit**

```bash
docker run --rm -v "$PWD/deploy/authentik:/w" mikefarah/yq -e '.services | keys' /w/docker-compose.yml
git add deploy/authentik && git commit -m "feat(sso): Authentik IaC — compose+env iskeleti (auth.redwall.tr, forwardAuth mw dahil)"
```
Expected: 4 servis listelenir; commit OK. (`Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` eklenir — tüm task'lerde geçerli.)

---

### Task 2: Deploy — auth.redwall.tr canlı + bootstrap + gruplar + TOTP

**Files:** (repo değişikliği yok — sunucu; öğrenilen sapmalar varsa Task 8'de README'ye)

**Interfaces:**
- Consumes: Task 1 IaC; kullanıcının açtığı DNS kaydı.
- Produces: çalışan Authentik; `akadmin` + API token; `monitor-admins`/`monitor-viewers` grupları; kullanıcının gerçek hesabı; TOTP zorunlu.

- [ ] **Step 1: Ön koşullar — DNS + kaynak ölçümü**

```bash
dig +short auth.redwall.tr   # Expected: CF IP'leri (orange). Boşsa kullanıcıya sor, DURMA yok.
ssh root@194.62.52.22 'free -m | head -2 && df -h / | tail -1'
```
Expected: RAM'de ≥1.5GB boş, disk %80 altı. Değilse BLOCKED + rapor (zorla kurma — spec §4 kaynak bütçesi).

- [ ] **Step 2: Sunucuya kur**

```bash
rsync -av deploy/authentik root@194.62.52.22:/opt/ --exclude .env
ssh root@194.62.52.22 'cd /opt/authentik && cp .env.example .env && python3 - <<PY
import secrets, base64, os
vals = {k: base64.b64encode(secrets.token_bytes(36)).decode() for k in ["AUTHENTIK_SECRET_KEY","AUTHENTIK_PG_PASSWORD","AUTHENTIK_BOOTSTRAP_PASSWORD","AUTHENTIK_BOOTSTRAP_TOKEN"]}
open(".env","w").write("".join(f"{k}={v}\n" for k,v in vals.items()))
os.chmod(".env",0o600); print("env OK")
PY
docker compose up -d && sleep 60 && docker compose ps --format "{{.Name}} {{.Status}}"'
```
Expected: 4 servis Up (server healthcheck'i `healthy` olana dek +60s gerekebilir — bekle/yeniden bak).

- [ ] **Step 3: Dışarıdan doğrula**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://auth.redwall.tr/if/flow/initial-setup/ ; curl -s -o /dev/null -w "%{http_code}\n" https://auth.redwall.tr/
```
Expected: 200/302'ler (404 DEĞİL — router kayıtlı). Doğrudan-IP erişimi 403 (cloudflare-ips çalışıyor).

- [ ] **Step 4: API ile gruplar + kullanıcı hesabı**

Bootstrap token ile (`Authorization: Bearer $TOKEN`, uç `https://auth.redwall.tr/api/v3/`):
- `POST core/groups/` → `monitor-admins`, `monitor-viewers`.
- `POST core/users/` → kullanıcı `hamdi` (gerçek e-posta: kullanıcıya sor/hafıza admin@redwall.tr) + `monitor-admins`a ekle + parola-belirleme linki üret (`POST core/users/<id>/recovery/`) → linki KULLANICIYA ilet (parola repoya/rapora yazılmaz).
Expected: API 2xx yanıtları rapora (ham); kullanıcıya iki iş düşer: parolasını belirle + TOTP kaydet.

- [ ] **Step 5: TOTP zorunlaması**

Authentik'te varsayılan giriş akışına MFA doğrulama aşaması bağlanır. API ile dene: `stages/authenticator_validate/` mevcut stage'i bul → default-authentication-flow'a binding ekle (`flows/bindings/`). API'yle netleşmiyorsa: kullanıcı-UI adımı olarak raporla (Admin → Flows → default-authentication-flow → MFA stage ekleme — adım adım talimatla) ve DONE_WITH_CONCERNS verme, kullanıcı onayı sonrası doğrula: parolayla girişte TOTP soruluyor mu.

- [ ] **Step 6: Kullanıcı doğrulaması (kontrolör aracılığıyla)**
Kullanıcı `auth.redwall.tr`'ye kendi hesabıyla girip TOTP kaydettiğini teyit eder. akadmin PAROLASI .env'de kalır (break-glass hesabı — runbook'a).

---

### Task 3: Grafana OIDC (+ fallback korunur)

**Files:**
- Modify: `deploy/monitor/docker-compose.yml` (grafana environment bloğu)
- Modify: `deploy/monitor/.env.example` (+3 satır)

**Interfaces:**
- Consumes: Authentik API (provider/app oluşturma), Task 2 grupları.
- Produces: Grafana'da "Authentik ile giriş" + grup→rol eşleme; yerel form fallback.

- [ ] **Step 1: Authentik'te OAuth2 provider + application (API)**

`POST providers/oauth2/` → name `grafana`, redirect `https://monitor.redwall.tr/login/generic_oauth`, client_id üret; `POST core/applications/` → slug `grafana`, provider bağla. client_id/secret'ı yakala (sunucu .env'ine gider, rapora YAZMA).
Expected: 201'ler; `https://auth.redwall.tr/application/o/grafana/.well-known/openid-configuration` 200 döner (keşif belgesi — auth/token/userinfo uçlarını BURADAN al, tahmin etme).

- [ ] **Step 2: Grafana env bloğu (repo)** — grafana `environment:` içine:

```yaml
      # SSO (Authentik OIDC) — yerel admin formu FALLBACK olarak açık kalır (break-glass §6).
      - GF_AUTH_GENERIC_OAUTH_ENABLED=true
      - GF_AUTH_GENERIC_OAUTH_NAME=Authentik
      - GF_AUTH_GENERIC_OAUTH_CLIENT_ID=${GF_OAUTH_CLIENT_ID}
      - GF_AUTH_GENERIC_OAUTH_CLIENT_SECRET=${GF_OAUTH_CLIENT_SECRET}
      - GF_AUTH_GENERIC_OAUTH_SCOPES=openid profile email
      - GF_AUTH_GENERIC_OAUTH_AUTH_URL=https://auth.redwall.tr/application/o/authorize/
      - GF_AUTH_GENERIC_OAUTH_TOKEN_URL=https://auth.redwall.tr/application/o/token/
      - GF_AUTH_GENERIC_OAUTH_API_URL=https://auth.redwall.tr/application/o/userinfo/
      - GF_AUTH_GENERIC_OAUTH_ALLOW_SIGN_UP=true
      - GF_AUTH_GENERIC_OAUTH_AUTO_LOGIN=false
      - GF_AUTH_GENERIC_OAUTH_ROLE_ATTRIBUTE_PATH=contains(groups[*], 'monitor-admins') && 'Admin' || contains(groups[*], 'monitor-viewers') && 'Viewer' || 'None'
      - GF_AUTH_GENERIC_OAUTH_ROLE_ATTRIBUTE_STRICT=true
```
(URL'ler Step 1 keşif belgesinden doğrulanır; farklıysa keşifteki kullanılır.)

- [ ] **Step 3: Deploy + test**

```bash
# .env'e GF_OAUTH_CLIENT_ID/SECRET ekle (sunucuda), sonra:
rsync --inplace deploy/monitor/docker-compose.yml root@194.62.52.22:/opt/monitor/docker-compose.yml
ssh root@194.62.52.22 'cd /opt/monitor && docker compose up -d grafana'
```
Testler: (a) login ekranında İKİ seçenek (form + "Sign in with Authentik"); (b) kullanıcı SSO ile girer → rolü **Admin** (kontrolör kullanıcıya doğrulatır); (c) yerel admin formu hâlâ çalışıyor (fallback — curl ile `POST /login` 200 veya kullanıcı testi); (d) `monitor-viewers`/grupsuz test kullanıcısı reddediliyor (ROLE_ATTRIBUTE_STRICT — opsiyonel API-token'lı test).

- [ ] **Step 4: Commit** (`feat(sso): Grafana OIDC — Authentik, rol eşleme, yerel fallback korunur`)

---

### Task 4: GlitchTip OIDC

**Files:**
- Modify (muhtemel): `deploy/glitchtip/docker-compose.yml` (env) — YÖNTEM KEŞFİ Step 1'de.

- [ ] **Step 1: Yöntem keşfi** — GlitchTip'in güncel OIDC yöntemini resmî docs'tan doğrula (WebFetch: glitchtip.com/documentation — django-allauth "OpenID Connect" sağlayıcısı env ile mi, admin-UI Social Application ile mi). Bulguya göre Step 2 uyarlanır; iki yol da kabul (env tercih — IaC'de kalır).
- [ ] **Step 2: Authentik'te provider+app** (Task 3 Step 1 deseni; redirect GlitchTip docs'taki callback path'i).
- [ ] **Step 3: Uygula + test** — kullanıcı GlitchTip'e Authentik'le girer (mevcut org'a üye — ilk girişte org ataması gerekirse admin'den elle, runbook'a not); kayıt-kapalı davranışı bozulmadı (yabancı Authentik'siz kayıt hâlâ yok).
- [ ] **Step 4: Commit** (dosya değiştiyse).

---

### Task 5: Kuma forward-auth (sıra şartlı!)

**Files:**
- Modify: `deploy/monitor/docker-compose.yml` (kuma router'ına `authentik-fa` middleware)

- [ ] **Step 1: Authentik proxy-provider + app + embedded outpost ataması (API)** — `POST providers/proxy/` (mode: `forward_single`, external_host `https://durum.redwall.tr`), `POST core/applications/` (slug `kuma`), embedded outpost'a bağla (`PATCH outposts/instances/<embedded>/` providers listesine ekle).
Expected: `https://durum.redwall.tr/outpost.goauthentik.io/ping` benzeri uç yanıt verir hale gelir (outpost aktif).
- [ ] **Step 2: BREAK-GLASS TÜNELİ ÖNCE TEST ET**

```bash
ssh -f -N -L 13001:$(ssh root@194.62.52.22 "docker inspect \$(docker ps -qf name=uptime-kuma) --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' | head -1"):3001 root@194.62.52.22
curl -s -o /dev/null -w "%{http_code}" http://localhost:13001
```
Expected: 200/302 — tünel yolu ÇALIŞIYOR kanıtı rapora. (Komut inceliği: container IP'si değişkendir; runbook'a genel desen yazılır.)
- [ ] **Step 3: kuma router'ına middleware ekle (repo)** — `traefik.http.routers.kuma.middlewares=cloudflare-ips,authentik-fa` (mevcut satır güncellenir). `rsync --inplace` + `docker compose up -d uptime-kuma`.
- [ ] **Step 4: Test** — durum.redwall.tr artık Authentik'e yönlendiriyor; Authentik girişi sonrası Kuma açılıyor (İÇ GİRİŞ hâlâ açık — çift giriş bu adımda NORMAL).
- [ ] **Step 5: KULLANICI-UI:** Kuma → Settings → Advanced → **Disable Auth** (talimatla kullanıcıya; Authentik kapısı canlıyken güvenli). Sonra test: Authentik girişi tek başına yetiyor.
- [ ] **Step 6: Commit** (`feat(sso): Kuma forward-auth — Authentik kapısı, iç giriş kapalı (break-glass: tünel + runbook)`)

---

### Task 6: Umami forward-auth

**Files:**
- Modify: `deploy/umami/docker-compose.yml` (router middleware satırı)

- [ ] Steps: Authentik proxy-provider/app (`analitik.redwall.tr`, slug `umami`) + outpost'a ekle → umami router `middlewares=cloudflare-ips,authentik-fa` → deploy → test (Authentik → sonra Umami kendi girişi; çift giriş SPEC'te kabul edilmiş) → commit.

---

### Task 7: auth SLO (15. servis)

**Files:**
- Create: `deploy/monitor/slo/slos/auth.yml` (Tier-2 şablonu: service `auth`, objective 99, severity ticket)
- Create: `deploy/monitor/slo/generated/auth.rules.yml` (üretim)

- [ ] Steps: KULLANICI Kuma'ya monitör ekler (UI; ad TAM: `Auth SSO`, URL `https://auth.redwall.tr/`, kabul 200-302) → `monitor_status{monitor_name="Auth SSO"}` Prometheus'ta doğrula → `slos/auth.yml` yaz (runbook'taki yeni-servis prosedürü AYNEN) → `generate.sh` → rsync+reload → `sloth_slo_info{sloth_service="auth"}` doğrula → commit.

---

### Task 8: Break-glass tatbikatı + runbook + kapanış

**Files:**
- Modify: `deploy/authentik/README.md` (runbook doldurulur), `deploy/monitor/README.md` (SSO işaretçisi)

- [ ] **Step 1: TATBİKAT (kanıt-adımı):**
```
authentik'i durdur (docker compose stop authentik-server) →
  (a) monitor.redwall.tr yerel admin formuyla giriş ÇALIŞIYOR (kullanıcı/curl testi)
  (b) durum.redwall.tr erişilemez (beklenen) → tünel yolu ÇALIŞIYOR (Step-5/Task-5 deseni)
  (c) Grafana OIDC butonu hata veriyor ama form etkilenmiyor
authentik'i başlat → SSO girişleri normale döndü (tam akış testi)
```
Ham kanıtlar rapora. (Sentetik-ihlal e2e'sinin SSO karşılığı — spec §9.)
- [ ] **Step 2: Runbook** — README'ye: break-glass (tatbikat komutlarıyla), yeni kullanıcı ekleme (Authentik→grup), toplu oturum öldürme, panel envanteri (hangi panel hangi yöntem, geri-alma tek-satırları), akadmin'in acil-hesap statüsü, TOTP politikası.
- [ ] **Step 3:** Ana README işaretçisi + commit + hafıza güncellemesi (kontrolör): `redwall-monitor-sunucusu.md` SSO bölümü + bekleyen-isler 2-C kapanışı + Kuma-TOTP'nin emekli olduğu notu (Kuma girişi artık Authentik'te).

---

## Self-Review Notları
1. **Spec kapsama:** §3 harita→T3-6; §5 rollout→T1-8 sıralı; §6 break-glass→T5 sıra şartı + T8 tatbikat; §7 SLO→T7; RBAC→T2/T3. Boşluk yok.
2. **Keşif-değer deseni:** Authentik sürümü, OIDC uçları (.well-known), GlitchTip yöntemi, TOTP-API belirsizliği — hepsi üreten-komut+beklenen-çıktıyla task içinde; TBD değil.
3. **Kullanıcı kapıları açıkça işaretli:** DNS, parola/TOTP kaydı, Grafana SSO testi, Kuma Disable-Auth, Kuma monitörü.
4. **Tutarlılık:** middleware adı `authentik-fa` (T1 tanım, T5/T6 referans); grup adları T2↔T3 eşleşik.
