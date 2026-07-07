# Monitör Kurumsallaştırma Tur 1 — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development veya executing-plans. Adımlar checkbox (`- [ ]`). Bu plan çoğunlukla **kontrolör SSH** ile canlı sunuculara uygulanır (subagent değil); IaC dosya değişiklikleri subagent'a verilebilir.

**Goal:** Mevcut monitör yığınına uygulama/DB metrikleri + dead-man's switch + origin sıkılaştırma ekleyerek kurumsal görünürlük/dayanıklılık/güvenlik boşluklarını kapatmak.

**Architecture:** Push modeli korunur. DB/Redis exporter'ları **ayrı Swarm servisi** (ERP'de compose servisi) olarak app'in DB-overlay'i + **traefik-public** (attachable köprü) ağlarına bağlanır; hiçbir host portu yayınlanmaz. Her hedefteki **Alloy ajanı traefik-public'e katılıp** exporter'ları servis-DNS'iyle scrape eder + push eder. Traefik metrikleri her Traefik'te açılıp Alloy tarafından scrape edilir.

**Tech Stack:** Grafana Alloy v1.17.1, prometheuscommunity/postgres-exporter, oliver006/redis_exporter, prom/mysqld-exporter, Traefik (v2.11/v3.x) Prometheus metrics, healthchecks.io, Grafana 13 alerting, docker compose + Swarm.

## Global Constraints
- **Push modeli DEĞİŞMEZ**: hedeflerde YENİ INBOUND PORT/ufw YOK. Exporter'lar yalnız docker ağında dinler (host publish yok). Alloy scrape'i attachable overlay (traefik-public) veya compose ağı üzerinden yapar.
- **DB salt-okuma**: her Postgres'te `monitoring` rolü + `GRANT pg_monitor`; MariaDB'de `REPLICATION CLIENT, PROCESS, SELECT` sınırlı kullanıcı. Veri/şema DEĞİŞMEZ. **YangınPro MinIO'ya DOKUNULMAZ.**
- **CF SSL "Full" DEĞİŞMEZ.** Traefik v3'te `ipallowlist` (v2'de `ipwhitelist`) — sürüme göre doğru sözdizimi.
- IaC `deploy/monitor/`; PR kullanıcı açar. Rollout kontrollü SSH, geri-alınabilir.
- **Kesinleşmiş matris (Prometheus/cadvisor'dan doğrulandı):**
  | Sunucu | IP | Topoloji | Postgres | Redis | Traefik | DB-overlay |
  |---|---|---|---|---|---|---|
  | erp | 194.62.52.66 | compose | **MariaDB 11.8** (`frappe_docker-db-1`) | redis 6.2 ×2 (cache+queue) | v3.5 | `frappe_docker_frappe_network` |
  | kurumsal | 194.62.52.14 | Swarm | `redwall_postgres` | yok | var | (execute'ta doğrula) ⚠️ SSH parolası gerekli |
  | license | 194.62.52.24 | Swarm | `licenseserver_postgres` | `licenseserver_redis` | v2.11 | `licenseserver_license-net` (attachable=false) |
  | yp-test | 194.62.52.42 | Swarm | `yanginpro_postgres` | `yanginpro_redis` | v2.11 | `yanginpro-backend` (attachable=true) |
  | yp-shtest | 194.62.52.108 | Swarm | `yanginpro-sh_postgres` | `yanginpro-sh_redis` | v2.11 | (execute'ta doğrula) |
- **traefik-public** her Swarm sunucuda mevcut + attachable=true → Alloy↔exporter köprüsü olarak kullanılır.
- ⚠️ **ÖN KOŞUL:** kurumsal (194.62.52.14) SSH root parolası bu oturumda yok — kullanıcıdan alınacak (o sunucunun görevleri için).

---

### Task 1: Alloy ajanına exporter-scrape altyapısı (IaC — traefik-public köprüsü + parametrik scrape)

**Files:**
- Modify: `deploy/monitor/agent/docker-compose.yml` (Alloy'a `traefik-public` external ağı + opsiyonel `frappe_docker_frappe_network` — sunucuya göre override)
- Modify: `deploy/monitor/agent/config.alloy` (parametrik exporter scrape blokları)
- Modify: `deploy/monitor/agent/.env.example` (yeni EXPORTER_* opsiyonel değişkenler)

**Interfaces:**
- Produces: Alloy, `traefik-public` ağındaki exporter servislerini `prometheus.scrape` ile job'lara ekler (`job="postgres"|"redis"|"mysql"|"traefik"`, `instance=$AGENT_HOSTNAME`). Exporter DNS adları env ile verilir.

- [ ] **Step 1: Alloy compose'una köprü ağını ekle.** `deploy/monitor/agent/docker-compose.yml`'de `alloy` servisine ve dosya köküne:
```yaml
    networks:
      - default
      - monbridge
# ... dosya sonunda:
networks:
  monbridge:
    external: true
    name: ${MON_BRIDGE_NET:-traefik-public}
```
> `MON_BRIDGE_NET` sunucuya göre .env'de: Swarm sunucularda `traefik-public`, ERP'de `frappe_docker_frappe_network`.

- [ ] **Step 2: config.alloy'a Traefik scrape bloğu ekle** (metrics açık Traefik'i köprü üzerinden kazır). `config.alloy` sonuna:
```alloy
// ════════ Traefik RED metrikleri (köprü ağı üzerinden) ════════
prometheus.scrape "traefik" {
  targets = [{ __address__ = sys.env("TRAEFIK_METRICS_ADDR"), instance = sys.env("AGENT_HOSTNAME") }]
  forward_to      = [prometheus.remote_write.monitor.receiver]
  scrape_interval = "30s"
  job_name        = "traefik"
}
```
> `TRAEFIK_METRICS_ADDR` = `<traefik-servis>:8082` (ör. `licenseserver_traefik:8082`). Boşsa blok hedefe erişemez ama Alloy çöker mez (target down olur).

- [ ] **Step 3: config.alloy'a Postgres exporter scrape bloğu ekle:**
```alloy
// ════════ PostgreSQL exporter (ayrı servis, köprü ağı) ════════
prometheus.scrape "postgres" {
  targets = [{ __address__ = sys.env("PG_EXPORTER_ADDR"), instance = sys.env("AGENT_HOSTNAME") }]
  forward_to      = [prometheus.remote_write.monitor.receiver]
  scrape_interval = "30s"
  job_name        = "postgres"
}
```

- [ ] **Step 4: config.alloy'a Redis + MySQL exporter scrape blokları ekle** (aynı desen, `REDIS_EXPORTER_ADDR` job `redis`, `MYSQL_EXPORTER_ADDR` job `mysql`). Her biri ayrı `prometheus.scrape`.

- [ ] **Step 5: Alloy config sözdizimi doğrula** (yerelde, dummy env ile):
```bash
cd deploy/monitor/agent
docker run --rm -e AGENT_HOSTNAME=test -e PROM_URL=http://x -e PROM_USER=x -e PROM_PASS=x -e LOKI_URL=http://x -e LOKI_USER=x -e LOKI_PASS=x -e TRAEFIK_METRICS_ADDR="" -e PG_EXPORTER_ADDR="" -e REDIS_EXPORTER_ADDR="" -e MYSQL_EXPORTER_ADDR="" -v "$PWD/config.alloy:/etc/alloy/config.alloy:ro" grafana/alloy:v1.17.1 fmt /etc/alloy/config.alloy >/dev/null 2>&1 && echo "alloy config OK" || echo "SYNTAX HATASI"
```
Expected: `alloy config OK`.

- [ ] **Step 6: Commit**
```bash
git add deploy/monitor/agent/
git commit -m "feat(agent): parametrik exporter scrape (traefik/postgres/redis/mysql) + traefik-public köprüsü"
```

---

### Task 2: Exporter stack tanımları (Swarm) + ERP compose varyantı (IaC)

**Files:**
- Create: `deploy/monitor/exporters/swarm-stack.yml` (postgres+redis exporter, Swarm; DB-net + traefik-public external)
- Create: `deploy/monitor/exporters/erp-compose.yml` (mysqld+redis exporter, compose; frappe-net)
- Create: `deploy/monitor/exporters/README.md` (sunucu-bazlı deploy + rol SQL'i)

**Interfaces:**
- Produces: exporter servisleri metrikleri **yalnız ağda** sunar (postgres_exporter :9187, redis_exporter :9121, mysqld_exporter :9104). Host portu YOK. Alloy bunları köprü ağından DNS'le scrape eder.

- [ ] **Step 1: Swarm exporter stack'i oluştur** (`deploy/monitor/exporters/swarm-stack.yml`):
```yaml
version: "3.8"
services:
  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:v0.15.0
    environment:
      DATA_SOURCE_NAME: "postgresql://monitoring:${PG_MON_PASS}@${PG_HOST}:5432/${PG_DB:-postgres}?sslmode=disable"
    networks: [dbnet, monbridge]
    deploy:
      replicas: 1
      placement: { constraints: ["node.role == manager"] }
  redis-exporter:
    image: oliver006/redis_exporter:v1.62.0
    environment:
      REDIS_ADDR: "redis://${REDIS_HOST}:6379"
      REDIS_PASSWORD: "${REDIS_PASS:-}"
    networks: [dbnet, monbridge]
    deploy:
      replicas: 1
      placement: { constraints: ["node.role == manager"] }
networks:
  dbnet:
    external: true
    name: ${DB_NET}
  monbridge:
    external: true
    name: traefik-public
```
> Deploy: `DB_NET=licenseserver_license-net PG_HOST=licenseserver_postgres PG_MON_PASS=… REDIS_HOST=licenseserver_redis … docker stack deploy -c swarm-stack.yml redwall-mon`. Servis DNS: `redwall-mon_postgres-exporter:9187`.

- [ ] **Step 2: ERP compose exporter'ı oluştur** (`deploy/monitor/exporters/erp-compose.yml`) — mysqld-exporter (MariaDB) + redis_exporter, `frappe_docker_frappe_network` external'a bağlı. Sürümler: `prom/mysqld-exporter:v0.15.1`, `oliver006/redis_exporter:v1.62.0`. DB host `db:3306`, redis `redis-cache:6379` + `redis-queue:6379` (iki redis job).

- [ ] **Step 3: README'ye salt-okuma rol SQL'lerini yaz** (`deploy/monitor/exporters/README.md`):
```sql
-- PostgreSQL (her Postgres'te, app DB kullanıcısıyla)
CREATE ROLE monitoring LOGIN PASSWORD '<uret>';
GRANT pg_monitor TO monitoring;
-- MariaDB (ERP)
CREATE USER 'monitoring'@'%' IDENTIFIED BY '<uret>';
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'monitoring'@'%';
```

- [ ] **Step 4: YAML doğrula** (`docker compose -f erp-compose.yml config` + swarm-stack python yaml). Commit:
```bash
git add deploy/monitor/exporters/
git commit -m "feat(exporters): Swarm (pg+redis) + ERP (mysqld+redis) exporter stack + salt-okuma rol SQL"
```

---

### Task 3: license (194.62.52.24) — exporter'ları canlıya al + doğrula [KONTROLÖR SSH]

**Files:** (sunucuda) `/opt/redwall-mon/`, license Postgres'te `monitoring` rolü, `/opt/redwall-agent/{.env,config.alloy}` güncelle.

- [ ] **Step 1: Salt-okuma rol** — `docker exec licenseserver_postgres psql -U <app> -c "CREATE ROLE monitoring LOGIN PASSWORD '<p>'; GRANT pg_monitor TO monitoring;"` (rol var mı önce kontrol).
- [ ] **Step 2: Exporter stack deploy** — swarm-stack.yml'i scp + `DB_NET=licenseserver_license-net PG_HOST=licenseserver_postgres PG_MON_PASS=<p> REDIS_HOST=licenseserver_redis REDIS_PASS=<redis parolası> docker stack deploy -c swarm-stack.yml redwall-mon`.
- [ ] **Step 3: Traefik metrikleri aç** — `licenseserver_traefik` command'ına `--metrics.prometheus=true`, `--metrics.prometheus.addEntryPointsLabels=true`, `--metrics.prometheus.addServicesLabels=true`, `--entrypoints.metrics.address=:8082`, `--metrics.prometheus.entrypoint=metrics` ekle (docker-stack.yml → redeploy, start-first). Traefik traefik-public'te olduğundan Alloy erişir.
- [ ] **Step 4: Alloy'u güncelle** — `/opt/redwall-agent/.env`'e `MON_BRIDGE_NET=traefik-public`, `TRAEFIK_METRICS_ADDR=licenseserver_traefik:8082`, `PG_EXPORTER_ADDR=redwall-mon_postgres-exporter:9187`, `REDIS_EXPORTER_ADDR=redwall-mon_redis-exporter:9121` (MYSQL boş). Yeni config.alloy + compose'u scp → `docker compose up -d`.
- [ ] **Step 5: DOĞRULA** — monitör Prometheus'ta (curl container, `monitor_monitor-net`): `up{instance="redwall-license",job=~"postgres|redis|traefik"}` = 1; `pg_up`, `redis_up`, `traefik_*` metrikleri geliyor. Rol yalnız pg_monitor (veri değişmedi). Sorun olursa: `docker stack rm redwall-mon` + Alloy .env geri.

---

### Task 4: yp-test (194.62.52.42) — aynı desen [KONTROLÖR SSH]
license (Task 3) ile birebir aynı adımlar, farklı değişkenlerle: `DB_NET=yanginpro-backend`, `PG_HOST=yanginpro_postgres`, `REDIS_HOST=yanginpro_redis`, `TRAEFIK_METRICS_ADDR=yanginpro_traefik:8082`, Traefik v2.11. **MinIO'ya dokunma.** Doğrulama `instance="yanginpro-test"`.

---

### Task 5: yp-shtest (194.62.52.108) — aynı desen [KONTROLÖR SSH]
Task 4 gibi; execute başında DB-overlay adını doğrula (`docker service inspect yanginpro-sh_postgres --format '{{range .Spec.TaskTemplate.Networks}}{{.Target}}{{end}}'` → ağ adı), `PG_HOST=yanginpro-sh_postgres`, `REDIS_HOST=yanginpro-sh_redis`, `TRAEFIK_METRICS_ADDR=yanginpro-sh_traefik:8082`. Doğrulama `instance="yanginpro-shtest"`. **MinIO'ya dokunma.**

---

### Task 6: erp (194.62.52.66) — MariaDB + redis (compose) [KONTROLÖR SSH]
- [ ] **Step 1:** MariaDB salt-okuma kullanıcı — `docker exec frappe_docker-db-1 mysql -uroot -p<root> -e "CREATE USER 'monitoring'@'%' IDENTIFIED BY '<p>'; GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'monitoring'@'%';"`.
- [ ] **Step 2:** `erp-compose.yml`'i scp `/opt/redwall-mon/` → `docker compose up -d` (frappe-net'e bağlı; mysqld-exporter `db:3306`, redis_exporter'lar `redis-cache`/`redis-queue`).
- [ ] **Step 3:** Traefik v3.5 metriklerini aç (frappe traefik compose'una `--metrics.prometheus` + `:8082` entrypoint).
- [ ] **Step 4:** Alloy .env: `MON_BRIDGE_NET=frappe_docker_frappe_network`, `MYSQL_EXPORTER_ADDR=redwall-mon-mysqld-exporter:9104`, iki `REDIS_EXPORTER_ADDR` (cache+queue — iki scrape bloğu veya multi-target), `TRAEFIK_METRICS_ADDR=frappe_docker-traefik-1:8082`, `PG_EXPORTER_ADDR` boş. Alloy up.
- [ ] **Step 5:** DOĞRULA `instance="redwall-erp"`, job mysql/redis/traefik up.

---

### Task 7: kurumsal (194.62.52.14) — Postgres (Swarm) [KONTROLÖR SSH — ÖN KOŞUL: SSH parolası]
⚠️ Bu görev kullanıcının kurumsal root parolasını vermesini bekler. Sonra: DB-overlay adını doğrula, `redwall_postgres` için `monitoring` rolü, swarm-stack.yml (yalnız postgres-exporter; redis yok), Traefik metrikleri, Alloy .env (`PG_EXPORTER_ADDR`, `TRAEFIK_METRICS_ADDR=redwall_traefik:8082`, redis/mysql boş). MinIO'ya dokunma. Doğrulama `instance="redwall-kurumsal"`.

---

### Task 8: Dashboard'lar (Traefik-RED + PostgreSQL + Redis + MySQL) [IaC + hub]

**Files:**
- Create: `deploy/monitor/grafana/dashboards/{traefik,postgresql,redis,mysql}.json`
- Modify: `deploy/monitor/grafana/import-dashboards.sh` (yeni dashboard'ları ekle)

- [ ] **Step 1:** Kanıtlı community dashboard'ları indir + `__inputs` temizle + datasource'u uid-siz Prometheus'a bağla (node/cadvisor deseni — Grafana 13 sabit-uid crash tuzağı, bkz spec): Traefik Official (grafana.com 17346 veya 4475), PostgreSQL (9628 postgres_exporter), Redis (763 redis_exporter), MySQL (7362 mysqld). JSON'ları repoya koy.
- [ ] **Step 2:** `import-dashboards.sh`'a bu 4 dashboard'ı ekle (mevcut API-import + gerçek-uid enjeksiyon deseniyle).
- [ ] **Step 3:** Hub'da `bash import-dashboards.sh` çalıştır → 4 dashboard Grafana'da; paneller dolu (Task 3-7 metrikleri). DOĞRULA: her dashboard "No data" değil.
- [ ] **Step 4:** Commit dashboards + script.

---

### Task 9: Origin sıkılaştırma + predict_linear disk alarmı [IaC + hub]

**Files:**
- Modify: `deploy/monitor/docker-compose.yml` (traefik: cloudflare-ips ipallowlist middleware + panellere uygula)
- Modify: Grafana alert (API veya provisioning) — predict_linear kuralı

- [ ] **Step 1:** Monitör Traefik'ine (v3.7.6) `cloudflare-ips` ipallowlist middleware ekle (CF IPv4+IPv6 aralıkları — license'taki listeyle aynı) + `monitor`/`durum`/`analitik`/`hata` router'larına uygula (`traefik.http.routers.<r>.middlewares=cloudflare-ips`). loki/push: ajanların CF üzerinden geçtiği DOĞRULANDIKTAN sonra ekle (yoksa ajan push'ları kırılır — önce test).
- [ ] **Step 2:** `docker compose up -d` (traefik recreate). DOĞRULA: CF üzerinden panel 200/302; **doğrudan origin IP'ye curl (Host header) → 403**; ajan push'ları kesintisiz (Prometheus'ta `up` düşmedi).
- [ ] **Step 3:** predict_linear Grafana alarmı ekle (folder redwall-alerts): `predict_linear(node_filesystem_avail_bytes{mountpoint="/",instance=~".+"}[6h], 4*3600) < 0` for 15m → "Disk 4 saat içinde dolacak", Telegram+e-posta. Mevcut %85 kuralı kalır.
- [ ] **Step 4:** DOĞRULA: kural Grafana'da "Normal"; sentetik (kısa aralıkla dolan mount simülasyonu veya `< 999999999999` ile geçici tetik) ile bildirim geliyor → sonra normale al. Commit IaC.

---

### Task 10: Dead-man's switch (healthchecks.io) [KONTROLÖR + hub]

**Files:**
- Create: `deploy/monitor/deadman/check-and-ping.sh` (sağlık-kapılı ping)
- Create: `deploy/monitor/deadman/redwall-deadman.{service,timer}` (systemd)
- Create: `deploy/monitor/deadman/README.md`

- [ ] **Step 1:** healthchecks.io'da "check" oluştur (period 1m, grace 5m), bildirimi e-posta (+Telegram entegrasyonu). Ping URL'i al (secret).
- [ ] **Step 2:** `check-and-ping.sh` yaz: monitör-net curl container'ıyla Prometheus `/-/healthy` + son 2 dk taze örnek (`count(up==1)>0`) kontrol; sağlıklıysa `curl -fsS -m10 $HC_PING_URL`, değilse çık (ping yok).
```bash
#!/usr/bin/env bash
set -euo pipefail
HC_URL="$(cat /opt/monitor/deadman/ping.url)"
Q(){ docker run --rm --network monitor_monitor-net curlimages/curl:latest -s "http://prometheus:9090$1"; }
Q '/-/healthy' | grep -qi healthy || exit 0
fresh=$(Q '/api/v1/query?query=count(up==1)' | grep -oE '"[0-9]+"\]' | head -1)
[ -n "$fresh" ] || exit 0
curl -fsS -m 10 "$HC_URL" >/dev/null
```
- [ ] **Step 3:** systemd timer (OnUnitActiveSec=1min) + service → `/opt/monitor/deadman/`, ping URL `ping.url` (600). `systemctl enable --now redwall-deadman.timer`.
- [ ] **Step 4:** DOĞRULA: healthchecks "up" (yeşil); timer'ı durdur (`systemctl stop`) → grace sonrası healthchecks uyarısı GELİYOR (e-posta/Telegram) → tekrar başlat, yeşile döner. Sağlık-kapı testi: Prometheus'u geçici durdur → ping kesiliyor. Commit IaC (ping.url HARİÇ).

---

## Notlar / sıra
- **Sıra:** Task 1-2 (IaC) → 3 (license, pilot) → doğrulandıktan sonra 4/5/6 → 7 (kurumsal, parola gelince) → 8 (dashboard) → 9 (sıkılaştırma+alarm) → 10 (dead-man). Task 3 pilotu deseni kanıtlar; 4-7 tekrarıdır.
- **Rollback her serviste:** `docker stack rm redwall-mon` (Swarm) / `docker compose down` (ERP) + Alloy .env eski haline + Traefik metrics flag'i geri. Push modeli/inbound yüzeyi hiç değişmez.
- **Kurumsal SSH parolası** Task 7 ön koşulu — kullanıcıdan alınacak.
- MinIO'ya (YangınPro/kurumsal) hiçbir görevde DOKUNULMAZ.
