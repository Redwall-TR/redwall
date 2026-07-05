# Monitör Sunucusu — Faz 1 (Hub) Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Monitör sunucusunun (194.62.52.22) hub katmanını IaC olarak `deploy/monitor/` altında üret ve sunucuya kurup doğrula: Traefik + Grafana + Prometheus + Loki + Uptime Kuma.

**Architecture:** Tek düğüm, düz `docker compose`. Traefik `docker` provider ile ters proxi; Cloudflare "Full" origin cert'i doğrulamadığı için Traefik self-signed cert sunar (`tls=true`, ACME YOK) — redwall'daki kanıtlanmış desen. Grafana tek pano (Prometheus metrik + Loki log datasource'ları provisioning ile önceden bağlı). Prometheus/Loki dışa açılmaz; yalnız Loki'nin push ucu Traefik+basic-auth ile dışarıya (Faz 2 agent'ları için). Hedef sunucular Faz 2'de eklenir — bu planda hedef YOK, hub boş/hazır ayağa kalkar.

**Tech Stack:** Docker Compose, Traefik v3.3, Grafana 11.4, Prometheus v2.55, Loki 3.3, Uptime Kuma 1, Ubuntu 24.04, ufw.

## Global Constraints
- **TLS: ACME/Let's Encrypt YOK.** Traefik varsayılan self-signed cert sunar; her router'da `tls=true`. Cloudflare "Full" (redwall zone geneli) buna uyumlu — **Cloudflare SSL ayarına DOKUNULMAZ.**
- **Tek düğüm, düz `docker compose`** (Swarm değil); Traefik `--providers.docker=true`.
- **Subdomain şeması:** `monitor.` → Grafana · `durum.` → Uptime Kuma · `loki.` → Loki push ucu (yalnız agent, basic-auth). Hepsi `${MONITOR_BASE_DOMAIN}` (=redwall.tr) altında. DNS kayıtları kullanıcı tarafından turuncu (proxied) açılır.
- **Saklama:** Prometheus 30 gün (`--storage.tsdb.retention.time=30d`), Loki 30 gün (`retention_period: 720h`).
- **Bu planda hedef sunucu YOK.** Prometheus scrape hedefleri boş `file_sd` ile hazır bekler; Faz 2'de doldurulur. Umami/GlitchTip bu planda kapsam dışı (ayrı compose'lar, sonra).
- **Sırlar commit edilmez:** `.env` sunucuda; repoda yalnız `.env.example`.
- **IaC yeri:** `deploy/monitor/`. Tüm config git'te.
- Yerel doğrulama komutu (deploy'suz): `cd deploy/monitor && cp .env.example .env.local && docker compose --env-file .env.local config >/dev/null && echo OK`.

---

### Task 1: Compose iskeleti + Traefik + ağ + .env.example

**Files:**
- Create: `deploy/monitor/docker-compose.yml`
- Create: `deploy/monitor/.env.example`

**Interfaces:**
- Produces: `monitor-net` (bridge ağı), `traefik` servisi (80/443, docker provider, HTTP→HTTPS yönlendirme). Sonraki task'lar servislerini bu compose'a ekler ve `monitor-net`e bağlanıp `traefik.*` label'larıyla yönlendirilir. Ortam değişkeni `MONITOR_BASE_DOMAIN`.

- [ ] **Step 1: docker-compose.yml oluştur (yalnız Traefik)**

`deploy/monitor/docker-compose.yml`:
```yaml
# Monitör hub — tek düğüm, düz docker compose.
# TLS: Cloudflare "Full" origin cert doğrulamaz → Traefik self-signed sunar (tls=true, ACME yok).
# Deploy (sunucuda): docker compose up -d   (bkz. README.md)
name: monitor

networks:
  monitor-net:
    driver: bridge

volumes:
  grafana-data:
  prom-data:
  loki-data:
  kuma-data:

services:
  traefik:
    image: traefik:v3.3
    restart: unless-stopped
    command:
      - --providers.docker=true
      - --providers.docker.exposedByDefault=false
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --entrypoints.web.http.redirections.entrypoint.to=websecure
      - --entrypoints.web.http.redirections.entrypoint.scheme=https
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - monitor-net
```

- [ ] **Step 2: .env.example oluştur**

`deploy/monitor/.env.example`:
```dotenv
# ── Monitör hub ortam değişkenleri (deploy/monitor) ──
# Kullanım: cp .env.example .env  → değerleri doldur. .env COMMIT EDİLMEZ.

# Tüm subdomain'lerin kök alanı (monitor./durum./loki. bunun altına gelir)
MONITOR_BASE_DOMAIN=redwall.tr

# Grafana ilk admin parolası (GÜÇLÜ ver)
GF_ADMIN_PASSWORD=degistir-guclu-bir-parola

# Loki push ucu basic-auth. Üret: htpasswd -nbB agent 'GUCLU_PAROLA'
# ÖNEMLİ: çıktıdaki her '$' işaretini '$$' yap (compose interpolasyonu için).
LOKI_BASICAUTH=agent:$$2y$$05$$örnekhashiburayakoy

# SMTP (redwall'daki Gmail app-password) — Grafana e-posta alarmı için
SMTP_HOST=smtp.gmail.com:587
SMTP_USER=ornek@gmail.com
SMTP_PASSWORD=gmail-app-password
SMTP_FROM=ornek@gmail.com

# Telegram alarmı (Faz 3'te kullanılır; şimdilik boş kalabilir)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

- [ ] **Step 3: Yerel doğrula (compose render)**

Run:
```bash
cd deploy/monitor && cp .env.example .env.local && docker compose --env-file .env.local config >/dev/null && echo OK && rm .env.local
```
Expected: `OK` (hata yok; Traefik servisi ve monitor-net render edilir).

- [ ] **Step 4: Commit**
```bash
git add deploy/monitor/docker-compose.yml deploy/monitor/.env.example
git commit -m "feat(monitor): compose iskeleti + Traefik (self-signed, CF Full) + .env.example"
```

---

### Task 2: Uptime Kuma servisi

**Files:**
- Modify: `deploy/monitor/docker-compose.yml` (services altına `uptime-kuma` ekle)

**Interfaces:**
- Consumes: `monitor-net`, `traefik`, `kuma-data` volume, `MONITOR_BASE_DOMAIN`.
- Produces: `durum.${MONITOR_BASE_DOMAIN}` → Uptime Kuma (port 3001).

- [ ] **Step 1: uptime-kuma servisini ekle**

`deploy/monitor/docker-compose.yml` içinde `services:` altına (traefik'ten sonra) ekle:
```yaml
  uptime-kuma:
    image: louislam/uptime-kuma:1
    restart: unless-stopped
    volumes:
      - kuma-data:/app/data
    networks:
      - monitor-net
    labels:
      - traefik.enable=true
      - traefik.docker.network=monitor-net
      - traefik.http.routers.kuma.rule=Host(`durum.${MONITOR_BASE_DOMAIN}`)
      - traefik.http.routers.kuma.entrypoints=websecure
      - traefik.http.routers.kuma.tls=true
      - traefik.http.services.kuma.loadbalancer.server.port=3001
```

- [ ] **Step 2: Yerel doğrula**

Run:
```bash
cd deploy/monitor && cp .env.example .env.local && docker compose --env-file .env.local config | grep -q "durum.redwall.tr" && echo OK && rm .env.local
```
Expected: `OK` (kuma router kuralı render edildi).

- [ ] **Step 3: Commit**
```bash
git add deploy/monitor/docker-compose.yml
git commit -m "feat(monitor): Uptime Kuma servisi (durum.redwall.tr)"
```

---

### Task 3: Prometheus servisi + config (hedefler boş, 30 gün saklama)

**Files:**
- Modify: `deploy/monitor/docker-compose.yml`
- Create: `deploy/monitor/prometheus/prometheus.yml`
- Create: `deploy/monitor/prometheus/targets/.gitkeep`

**Interfaces:**
- Consumes: `monitor-net`, `prom-data` volume.
- Produces: iç servis `http://prometheus:9090` (Grafana buradan okur). Hedefler `file_sd` ile `prometheus/targets/node-*.yml` ve `cadvisor-*.yml`'den okunur (Faz 2'de doldurulur; şimdi boş → 0 hedef, hata değil).

- [ ] **Step 1: prometheus.yml oluştur**

`deploy/monitor/prometheus/prometheus.yml`:
```yaml
global:
  scrape_interval: 30s
  evaluation_interval: 30s

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ['localhost:9090']

  # Faz 2: hedef sunucuların node_exporter'ları buraya file_sd ile eklenir.
  - job_name: node
    file_sd_configs:
      - files: ['/etc/prometheus/targets/node-*.yml']

  # Faz 2: hedef sunucuların cAdvisor'ları.
  - job_name: cadvisor
    file_sd_configs:
      - files: ['/etc/prometheus/targets/cadvisor-*.yml']
```

- [ ] **Step 2: Boş targets dizinini git'e sabitle**

`deploy/monitor/prometheus/targets/.gitkeep` (boş dosya) oluştur.

- [ ] **Step 3: prometheus servisini ekle**

`deploy/monitor/docker-compose.yml` `services:` altına ekle:
```yaml
  prometheus:
    image: prom/prometheus:v2.55.1
    restart: unless-stopped
    command:
      - --config.file=/etc/prometheus/prometheus.yml
      - --storage.tsdb.retention.time=30d
      - --web.enable-lifecycle
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./prometheus/targets:/etc/prometheus/targets:ro
      - prom-data:/prometheus
    networks:
      - monitor-net
```

- [ ] **Step 4: prometheus.yml'i doğrula (promtool)**

Run:
```bash
docker run --rm -v "$PWD/deploy/monitor/prometheus/prometheus.yml":/p.yml prom/prometheus:v2.55.1 promtool check config /p.yml
```
Expected: `SUCCESS: /p.yml is valid prometheus config file` (file_sd hedef dosyaları yoksa uyarı olabilir ama config geçerli).

- [ ] **Step 5: Commit**
```bash
git add deploy/monitor/docker-compose.yml deploy/monitor/prometheus/
git commit -m "feat(monitor): Prometheus (30g saklama, boş file_sd hedefleri Faz 2 için)"
```

---

### Task 4: Loki servisi + config + basic-auth push ucu

**Files:**
- Modify: `deploy/monitor/docker-compose.yml`
- Create: `deploy/monitor/loki/loki-config.yml`

**Interfaces:**
- Consumes: `monitor-net`, `loki-data` volume, `MONITOR_BASE_DOMAIN`, `LOKI_BASICAUTH`.
- Produces: iç servis `http://loki:3100` (Grafana buradan okur, auth yok — iç ağ). Dış push ucu `https://loki.${MONITOR_BASE_DOMAIN}/loki/api/v1/push` (Traefik + basic-auth; Faz 2 agent'ları buraya yazar).

- [ ] **Step 1: loki-config.yml oluştur**

`deploy/monitor/loki/loki-config.yml`:
```yaml
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096

common:
  instance_addr: 127.0.0.1
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1
  ring:
    kvstore:
      store: inmemory

schema_config:
  configs:
    - from: 2024-01-01
      store: tsdb
      object_store: filesystem
      schema: v13
      index:
        prefix: index_
        period: 24h

limits_config:
  retention_period: 720h        # 30 gün
  reject_old_samples: true
  reject_old_samples_max_age: 168h

compactor:
  working_directory: /loki/compactor
  retention_enabled: true
  delete_request_store: filesystem
```

- [ ] **Step 2: loki servisini ekle**

`deploy/monitor/docker-compose.yml` `services:` altına ekle:
```yaml
  loki:
    image: grafana/loki:3.3.2
    restart: unless-stopped
    command: -config.file=/etc/loki/loki-config.yml
    volumes:
      - ./loki/loki-config.yml:/etc/loki/loki-config.yml:ro
      - loki-data:/loki
    networks:
      - monitor-net
    labels:
      - traefik.enable=true
      - traefik.docker.network=monitor-net
      - traefik.http.routers.loki.rule=Host(`loki.${MONITOR_BASE_DOMAIN}`)
      - traefik.http.routers.loki.entrypoints=websecure
      - traefik.http.routers.loki.tls=true
      - traefik.http.routers.loki.middlewares=loki-auth
      - traefik.http.middlewares.loki-auth.basicauth.users=${LOKI_BASICAUTH}
      - traefik.http.services.loki.loadbalancer.server.port=3100
```

- [ ] **Step 3: loki-config.yml'i doğrula**

Run:
```bash
docker run --rm -v "$PWD/deploy/monitor/loki/loki-config.yml":/c.yml grafana/loki:3.3.2 -config.file=/c.yml -verify-config
```
Expected: `config is valid` (veya doğrulama hatası olmadan çıkış kodu 0).

- [ ] **Step 4: Commit**
```bash
git add deploy/monitor/docker-compose.yml deploy/monitor/loki/
git commit -m "feat(monitor): Loki (30g retention) + basic-auth push ucu (loki.redwall.tr)"
```

---

### Task 5: Grafana servisi + datasource provisioning

**Files:**
- Modify: `deploy/monitor/docker-compose.yml`
- Create: `deploy/monitor/grafana/provisioning/datasources/datasources.yml`

**Interfaces:**
- Consumes: `monitor-net`, `grafana-data` volume, `MONITOR_BASE_DOMAIN`, `GF_ADMIN_PASSWORD`, `SMTP_*`; iç servisler `http://prometheus:9090`, `http://loki:3100`.
- Produces: `monitor.${MONITOR_BASE_DOMAIN}` → Grafana (port 3000), Prometheus+Loki datasource'ları önceden bağlı.

- [ ] **Step 1: datasources.yml oluştur**

`deploy/monitor/grafana/provisioning/datasources/datasources.yml`:
```yaml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
```

- [ ] **Step 2: grafana servisini ekle**

`deploy/monitor/docker-compose.yml` `services:` altına ekle:
```yaml
  grafana:
    image: grafana/grafana:11.4.0
    restart: unless-stopped
    environment:
      - GF_SERVER_ROOT_URL=https://monitor.${MONITOR_BASE_DOMAIN}
      - GF_SECURITY_ADMIN_PASSWORD=${GF_ADMIN_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SMTP_ENABLED=true
      - GF_SMTP_HOST=${SMTP_HOST}
      - GF_SMTP_USER=${SMTP_USER}
      - GF_SMTP_PASSWORD=${SMTP_PASSWORD}
      - GF_SMTP_FROM_ADDRESS=${SMTP_FROM}
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - grafana-data:/var/lib/grafana
    networks:
      - monitor-net
    labels:
      - traefik.enable=true
      - traefik.docker.network=monitor-net
      - traefik.http.routers.grafana.rule=Host(`monitor.${MONITOR_BASE_DOMAIN}`)
      - traefik.http.routers.grafana.entrypoints=websecure
      - traefik.http.routers.grafana.tls=true
      - traefik.http.services.grafana.loadbalancer.server.port=3000
```

- [ ] **Step 3: Tüm yığını yerel doğrula**

Run:
```bash
cd deploy/monitor && cp .env.example .env.local && docker compose --env-file .env.local config >/dev/null && echo OK && rm .env.local
```
Expected: `OK` (5 servis: traefik, uptime-kuma, prometheus, loki, grafana render edilir).

- [ ] **Step 4: Commit**
```bash
git add deploy/monitor/docker-compose.yml deploy/monitor/grafana/
git commit -m "feat(monitor): Grafana (monitor.redwall.tr) + Prometheus/Loki datasource provisioning"
```

---

### Task 6: README runbook + tam yığın doğrulama

**Files:**
- Create: `deploy/monitor/README.md`

**Interfaces:**
- Consumes: tamamlanmış `deploy/monitor/` yığını.
- Produces: kurulum + işletim runbook'u (Faz 1 deploy adımları, ön koşullar, doğrulama, saklama/işletim notları).

- [ ] **Step 1: README.md oluştur**

`deploy/monitor/README.md`:
````markdown
# Monitör Hub (Faz 1) — deploy/monitor

Merkezi gözlemlenebilirlik hub'ı: Traefik + Grafana + Prometheus + Loki + Uptime Kuma.
Sunucu: 194.62.52.22. Tek düğüm, düz `docker compose`.
Tasarım: `docs/superpowers/specs/2026-07-05-monitor-sunucusu-design.md`.

## Ön koşullar
1. **DNS (Cloudflare, turuncu/proxied):** `monitor` (hazır), `durum`, `loki` A kayıtları → 194.62.52.22.
2. **Cloudflare SSL:** zone geneli "Full" (redwall.tr). DEĞİŞTİRME.
3. Sunucuda Docker Engine + compose plugin (kurulum aşağıda).
4. `.env` doldurulmuş (`.env.example`'dan kopya).

## TLS notu
ACME/Let's Encrypt YOK. Cloudflare "Full" origin cert'i doğrulamaz → Traefik self-signed
cert sunar (`tls=true`). Tarayıcı Cloudflare'in geçerli edge cert'ini görür.

## Kurulum
```bash
# 1) Docker (Ubuntu 24.04)
curl -fsSL https://get.docker.com | sh

# 2) Firewall: yalnız SSH + HTTP/HTTPS
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable

# 3) Repoyu/deploy dizinini sunucuya al (örn. /opt/monitor)
mkdir -p /opt/monitor && cd /opt/monitor
# (deploy/monitor içeriğini buraya kopyala: git clone veya scp)

# 4) .env hazırla
cp .env.example .env && nano .env   # GF_ADMIN_PASSWORD, LOKI_BASICAUTH, SMTP_* doldur

# LOKI_BASICAUTH üretimi:
#   docker run --rm httpd:2 htpasswd -nbB agent 'GUCLU_PAROLA'
#   çıktıdaki her '$' → '$$' yap, .env'e yaz (compose interpolasyonu).

# 5) Ayağa kaldır
docker compose up -d
docker compose ps
```

## Doğrulama
- `https://monitor.redwall.tr` → Grafana giriş ekranı (admin / GF_ADMIN_PASSWORD).
  Connections → Data sources: **Prometheus** ve **Loki** "green/OK".
- `https://durum.redwall.tr` → Uptime Kuma ilk kurulum ekranı (admin oluştur).
- Prometheus (iç): `docker compose exec prometheus wget -qO- localhost:9090/-/healthy` → `Prometheus Server is Healthy`.
- Loki (iç): `docker compose exec loki wget -qO- localhost:3100/ready` → `ready`.
- Loki push ucu (auth): `curl -u agent:PAROLA https://loki.redwall.tr/loki/api/v1/push -XPOST -H 'Content-Type: application/json' --data '{"streams":[{"stream":{"job":"test"},"values":[["'"$(date +%s)"'000000000","merhaba"]]}]}'` → HTTP 204. Auth'suz → 401.

## İşletim
- Saklama: Prometheus 30g, Loki 30g. Disk izle: `df -h /`.
- Loglar: `docker compose logs -f <servis>`.
- Güncelleme: imaj etiketini bump et → `docker compose pull && docker compose up -d`.
- **Faz 2** (hedef sunucular): `prometheus/targets/` altına `node-*.yml`/`cadvisor-*.yml` eklenir + hedeflere agent kurulur; ayrı plan.
````

- [ ] **Step 2: Tam yığın son doğrulama**

Run:
```bash
cd deploy/monitor && cp .env.example .env.local && docker compose --env-file .env.local config >/dev/null && echo OK && rm .env.local
```
Expected: `OK`.

- [ ] **Step 3: Commit**
```bash
git add deploy/monitor/README.md
git commit -m "docs(monitor): Faz 1 kurulum + işletim runbook"
```

---

### Task 7: Sunucuya kurulum + canlı doğrulama (KONTROLÖR yürütür — subagent DEĞİL)

> Bu task canlı root SSH (194.62.52.22) + güvenlik yargısı gerektirir; kontrolör (ana oturum) doğrudan yürütür, subagent'a verilmez. Sunucu temiz ve YangınPro içermez → Faz 1 deploy'u güvenlidir.

**Ön koşul (kullanıcı):** Cloudflare'de `durum` ve `loki` turuncu A kayıtları → 194.62.52.22 (monitor hazır).

- [ ] **Step 1: Sunucu hazırlığı** — Docker Engine + compose plugin kur; ufw 22/80/443 açık + enable.
- [ ] **Step 2: Dosyaları taşı** — `deploy/monitor/` → `/opt/monitor` (git clone veya rsync).
- [ ] **Step 3: .env oluştur** — gerçek GF_ADMIN_PASSWORD, LOKI_BASICAUTH (htpasswd), SMTP_* (redwall Gmail) ile.
- [ ] **Step 4: Ayağa kaldır** — `docker compose up -d`; `docker compose ps` hepsi Up.
- [ ] **Step 5: Doğrula** — README "Doğrulama" bölümünün tamamı:
  - `https://monitor.redwall.tr` Grafana açılıyor, geçerli sertifika (CF edge), datasource'lar yeşil.
  - `https://durum.redwall.tr` Uptime Kuma açılıyor.
  - Prometheus `/-/healthy`, Loki `/ready` iç sağlıklı.
  - Loki push: auth ile 204, auth'suz 401.
- [ ] **Step 6:** Sonuç özetini kullanıcıya raporla (URL'ler + ilk admin parolaları güvenli iletilecek). Faz 2 için sunucu listesi iste.

---

## Notlar
- **Umami + GlitchTip** (mevcut `deploy/umami/`, `deploy/glitchtip/`) bu sunucuda ayrıca ayağa kaldırılacak (Faz 3 / ayrı adım) — aynı Traefik'e `analitik.` ve `hata.` router'larıyla katılırlar. Bu planın kapsamında değil.
- **Telegram/e-posta alarm kuralları** Faz 3 (hedefler bağlandıktan sonra anlamlı).
- Bu plan hedef sunucu içermez; hub tek başına ayağa kalkar ve boş bekler (0 scrape hedefi, 0 log kaynağı) — bu beklenen durumdur.
