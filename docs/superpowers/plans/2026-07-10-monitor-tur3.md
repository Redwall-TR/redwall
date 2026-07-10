# Monitör Tur 3 — Eksiksizleştirme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** İzleme yığınını öz-dayanıklı + tam-görünür + tek-alarm-çatılı hale getirmek — analiz eksiklerinin tümü kapanır.

**Architecture:** Ağırlıkla monitör kutusu (194.62.52.22) IaC (`deploy/monitor/`). Öz-telemetri (yerel scrape+kural), kutu-ajanı, gece-yedek+tazelik metriği, runtime-config export, Loki ruler, alarm tek-çatı (Grafana→Alertmanager), Tempo metrics_generator, file-provider middleware. K-bloğu diğer sunucularda durability.

**Tech Stack:** Prometheus v3.13 · Loki 3.7.3 (ruler) · Tempo 3.0.2 (metrics_generator) · Grafana Alloy · Alertmanager v0.33 · node_exporter textfile-collector · mevcut Traefik/Grafana

**Spec:** `docs/superpowers/specs/2026-07-10-monitor-tur3-eksiksizlestirme-design.md`

## Global Constraints

- **Sürümler:** yeni imaj/eklenti gerekirse en son KARARLI, GitHub'dan doğrula ([[redwall-hep-son-surum]]).
- **Ağ modeli:** push/no-inbound/CF-Full korunur; yeni öz-telemetri hedefleri YALNIZ iç ağ (monitor-net), dışa açılmaz.
- **Secret'lar:** `/opt/monitor/secrets/` (600), repoda `.gitignore`. Repoya literal YOK.
- **Bilinen tuzaklar (HEPSİ geçerli):** tek-dosya rsync `--inplace`; compose `$`→`$$`; Grafana-13 sabit-uid YASAK (datasource uid'siz, referans runtime/deterministik-uid); monitör kutusu düz `docker compose` (deploy.sh YOK); config `-config.verify`/dry-run ÖNCE + `.bak` + tek-host doğrula-sonra-yay (Alloy crash dersi — [[redwall-monitor-gurultu-ilkesi]]); Prometheus reload `--post-data='' /-/reload`.
- **SSH:** `SSHPASS='7Vr*5zJA_D6@iu^3' sshpass -e ssh -o ConnectTimeout=15 -o StrictHostKeyChecking=no root@194.62.52.22` (ConnectTimeout ŞART — MaxStartups sürtüşmesi). Diğer sunucu parolaları hafızada.
- **Etiket sözleşmesi (Tur 2-A ile aynı):** alarm labels `severity`(page|ticket), `tier`, `service`, `category`. Yeni alarmlar buna uyar.
- **Kullanıcı kapıları:** H (Kuma cert — 2FA engellerse UI), K1 (readTimeout kararı — ölçüm sonrası onay), K3 (LicenseServer repo — kullanıcı/developer).
- Türkçe yorumlar. Branch `ops/monitor-tur3`. Her task commit'li + `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

### Task 1: Öz-telemetri scrape job'ları + monitör-Traefik metrikleri (Blok A/I)

**Files:**
- Modify: `deploy/monitor/prometheus/prometheus.yml` (+5 job)
- Modify: `deploy/monitor/docker-compose.yml` (traefik `:8082` + metrics flag; alertmanager healthcheck)

**Interfaces:**
- Produces: `up{job=~"loki|tempo|grafana|alertmanager|traefik-monitor"}` serileri. Task 2 (static kurallar) bunları kullanır.

- [ ] **Step 1: Uç keşfi (hangi port /metrics veriyor)** — sunucuda iç ağdan dene:
```bash
ssh ... 'cd /opt/monitor && for t in loki:3100 tempo:3200 grafana:3000 alertmanager:9093; do echo -n "$t → "; docker run --rm --network monitor_monitor-net curlimages/curl -s -o /dev/null -w "%{http_code}\n" "http://$t/metrics"; done'
```
Expected: hepsi 200 (Grafana `/metrics` auth'suz verir; değilse `GF_METRICS` — keşif). Traefik henüz metrik vermiyor (Step 2 açar).

- [ ] **Step 2: Monitör Traefik'ine metrics flag'i (repo)** — `docker-compose.yml` traefik `command:` bloğuna:
```yaml
      - --entrypoints.metrics.address=:8082
      - --metrics.prometheus=true
      - --metrics.prometheus.entrypoint=metrics
      - --metrics.prometheus.addrouterslabels=true
```
(License/hedef Traefik deseniyle aynı; kutu Traefik'i plain-compose, port publish GEREKMEZ — Prometheus iç ağdan `traefik:8082`.)

- [ ] **Step 3: 5 scrape job'ı (repo, prometheus.yml `scrape_configs` sonuna)** — instance=`redwall-monitor` sabit:
```yaml
  # Öz-telemetri (Tur 3): izleme yığınının kendisi. Yalnız iç ağ.
  - job_name: loki
    static_configs: [{targets: ['loki:3100'], labels: {instance: redwall-monitor}}]
  - job_name: tempo
    static_configs: [{targets: ['tempo:3200'], labels: {instance: redwall-monitor}}]
  - job_name: grafana
    static_configs: [{targets: ['grafana:3000'], labels: {instance: redwall-monitor}}]
  - job_name: alertmanager
    static_configs: [{targets: ['alertmanager:9093'], labels: {instance: redwall-monitor}}]
  - job_name: traefik-monitor
    static_configs: [{targets: ['traefik:8082'], labels: {instance: redwall-monitor}}]
```
(Authentik metrik-ucu ayrı auth/port ister → Task 8'de H ile; şimdilik hariç.)

- [ ] **Step 4: AM healthcheck + chat_id env (repo, Blok I)** — compose alertmanager servisine `healthcheck` (`wget -qO- localhost:9093/-/healthy`); `alertmanager.yml`'de `chat_id: <literal>` → `${TELEGRAM_CHAT_ID}` ve compose'da env geç (değer sunucu .env'de zaten var).

- [ ] **Step 5: Deploy + doğrula**
```bash
rsync --inplace deploy/monitor/prometheus/prometheus.yml root@...:/opt/monitor/prometheus/prometheus.yml
rsync --inplace deploy/monitor/docker-compose.yml root@...:/opt/monitor/docker-compose.yml
rsync --inplace deploy/monitor/alertmanager/alertmanager.yml root@...:/opt/monitor/alertmanager/alertmanager.yml
ssh ... 'cd /opt/monitor && docker compose up -d traefik alertmanager && docker compose exec prometheus wget -qO- --post-data="" http://localhost:9090/-/reload && sleep 40 && docker compose exec prometheus wget -qO- "http://localhost:9090/api/v1/query?query=up%7Bjob%3D~%22loki%7Ctempo%7Cgrafana%7Calertmanager%7Ctraefik-monitor%22%7D" | python3 -c "import sys,json;[print(r[\"metric\"][\"job\"],r[\"value\"][1]) for r in json.load(sys.stdin)[\"data\"][\"result\"]]"'
```
Expected: 5 job, hepsi `1`. (traefik ilk recreate'te ~15sn blip — kutu panelleri kısa kesinti, toparlar.)

- [ ] **Step 6: Commit** (`feat(monitor): öz-telemetri scrape job'ları + monitör Traefik metrikleri + AM healthcheck`)

---

### Task 2: Öz-telemetri alarm kuralları + dead-man AM-kapılaması (Blok A)

**Files:**
- Create: `deploy/monitor/slo/static/self-monitoring.rules.yml`
- Modify: `deploy/monitor/deadman/check-and-ping.sh` (+AM sağlık kapısı)

**Interfaces:**
- Consumes: Task 1 up serileri.
- Produces: `*Down` alarmları (severity=ticket, service=monitoring-chain, category=meta) — AM ise **page** (bildirim kanalının kendisi).

- [ ] **Step 1: Static kural (repo)** — her öz-bileşen için `up==0 for 5m`:
```yaml
groups:
  - name: self-monitoring
    rules:
      - alert: LokiDown
        expr: up{job="loki"} == 0
        for: 5m
        labels: {severity: ticket, service: monitoring-chain, category: meta, tier: "1"}
        annotations: {summary: "Loki down — log toplama durdu", description: "Prometheus loki:3100'ü 5dk kazıyamıyor."}
      - alert: TempoDown
        expr: up{job="tempo"} == 0
        for: 5m
        labels: {severity: ticket, service: monitoring-chain, category: meta, tier: "1"}
        annotations: {summary: "Tempo down — iz toplama durdu"}
      - alert: GrafanaDown
        expr: up{job="grafana"} == 0
        for: 5m
        labels: {severity: ticket, service: monitoring-chain, category: meta, tier: "1"}
        annotations: {summary: "Grafana down — dashboard erişimi yok"}
      - alert: AlertmanagerDown
        expr: up{job="alertmanager"} == 0
        for: 5m
        labels: {severity: page, service: monitoring-chain, category: meta, tier: "1"}
        annotations: {summary: "🔴 Alertmanager down — ALARM KANALI ÖLÜ (dead-man devrede)"}
```
(AM page ama AM ölüyse kendini gönderemez → dead-man Step 2 yakalar. Bu bilinçli çift-katman.)

- [ ] **Step 2: dead-man AM-kapısı (repo)** — `check-and-ping.sh`'e Prometheus healthy kontrolünden SONRA:
```bash
# AM de sağlıklı olmalı — AM ölürse tüm alarmlar sessizce kaybolur, bunu dead-man yakalar.
docker run --rm --network monitor_monitor-net curlimages/curl:latest -s --max-time 8 "http://alertmanager:9093/-/healthy" 2>/dev/null | grep -qi 'ok' || exit 0
```
(Sıra: prometheus-healthy → AM-healthy → up-count≥1 → ping. Herhangi biri düşerse ping kesilir → healthchecks.io uyarır.)

- [ ] **Step 3: promtool + deploy + doğrula**
```bash
docker run --rm --entrypoint promtool -v "$PWD/deploy/monitor/slo:/w" prom/prometheus:v3.13.0 check rules /w/static/self-monitoring.rules.yml
rsync -av deploy/monitor/slo/static/ root@...:/opt/monitor/slo/static/
rsync --inplace deploy/monitor/deadman/check-and-ping.sh root@...:/opt/monitor/deadman/check-and-ping.sh
ssh ... 'cd /opt/monitor && docker compose exec prometheus wget -qO- --post-data="" http://localhost:9090/-/reload && bash /opt/monitor/deadman/check-and-ping.sh && echo DEADMAN-OK'
```
Expected: promtool SUCCESS; rules API'de `self-monitoring` grubu; dead-man ping başarılı (AM sağlıklıyken).

- [ ] **Step 4: Kasıtlı-durdurma testi** — `docker compose stop grafana` → 5-6dk → `ALERTS{alertname="GrafanaDown"}` firing + (Tier-1 ticket → email) → `docker compose start grafana` → resolve. AM için AYRI: AM'ı durdur → dead-man ping KESİLMELİ (`bash check-and-ping.sh; echo $?` → prometheus healthy ama AM değil → erken exit, ping yok) → AM başlat. Ham kanıtlar rapora.

- [ ] **Step 5: Commit** (`feat(monitor): öz-telemetri alarmları + dead-man Alertmanager-kapılaması`)

---

### Task 3: Monitör kutusuna Alloy ajanı — kutu logları + container metrikleri (Blok B)

**Files:**
- Create: `deploy/monitor/self-agent/` (config.alloy [unix-strip'li] + docker-compose.yml + .env.example + README)

**Interfaces:**
- Produces: `{host="redwall-monitor"}` Loki logları + `cadvisor` metrikleri kutu için. NOC altyapı satırı zaten node_exporter'dan besleniyordu (değişmez).

- [ ] **Step 1: config.alloy türet** — mevcut `deploy/monitor/agent/config.alloy`'un kopyası, AMA: (a) `prometheus.exporter.unix` + ilgili relabel/scrape blokları SİLİNİR (kutuda node-exporter zaten var — çift-metrik önlenir); (b) cadvisor + docker-logları + gürültü-süzgeci (loki.process) KALIR; (c) `AGENT_HOSTNAME=redwall-monitor`. Loglar `loki:3100`'e (İÇ ağ — dış loki.redwall.tr'ye değil), metrikler `prometheus:9090` remote-write'a (iç). basic-auth GEREKMEZ (iç ağ) — endpoint'ler iç servis-DNS.

- [ ] **Step 2: compose (repo)** — agent deseni ama `network: monitor_monitor-net` (dış-ağ), remote-write/loki-push iç DNS'e; docker.sock ro mount + cadvisor mount'ları (privileged). `AGENT_HOSTNAME=redwall-monitor`.

- [ ] **Step 3: Deploy (tek-host, doğrula-yay yok — tek kutu)** + `.bak` yok (yeni dosya). `docker compose up -d`; Alloy `Up` + logda config-parse hatası yok.

- [ ] **Step 4: Doğrula**
```bash
ssh ... 'cd /opt/monitor && docker compose exec prometheus wget -qO- "http://localhost:9090/api/v1/query?query=count(container_last_seen%7Binstance%3D%22redwall-monitor%22%7D)"'
docker run ... loki query '{host="redwall-monitor"}' → satır>0
```
Expected: cadvisor container metrikleri var (kutunun ~18 container'ı); Loki'de kutu logları akıyor; `count(count by(instance)(node_uname_info))` HÂLÂ 6 (çift-node yok — unix-strip çalıştı).

- [ ] **Step 5: Commit** (`feat(monitor): kutuya Alloy ajanı — öz-loglar + container metrikleri (unix-strip, çift-node yok)`)

---

### Task 4: Gece yedekleri + tazelik metriği (Blok C)

**Files:**
- Create: `deploy/monitor/backup/box-backup.sh` + `redwall-box-backup.{service,timer}` + README

**Interfaces:**
- Produces: `/opt/monitor-backups/*.gz` (7g döngü) + textfile `redwall_backup_last_success_timestamp` → node_exporter. Task 5 (tazelik alarmı) kullanır.

- [ ] **Step 1: box-backup.sh (repo)** — sırayla: authentik-db/umami-db/glitchtip-db `pg_dump` (docker exec + secret), kuma sqlite (`docker cp` veya `.backup`), grafana.db (docker cp), `/opt/{monitor,authentik,umami,glitchtip,tempo}` config-tar (secret'lar HARİÇ — `--exclude=.env --exclude=secrets`). Her adım hata-kontrollü (backup-hardening dersi: yazma-hatası=FAIL). Başarıda: `echo "redwall_backup_last_success_timestamp $(date +%s)" > /var/lib/node_exporter/textfile/backup.prom` (atomik: tmp+mv). 7g'den eski dosyaları sil.

- [ ] **Step 2: node_exporter textfile-collector aç** — kutu node-exporter compose'una `--collector.textfile.directory=/var/lib/node_exporter/textfile` + volume mount.

- [ ] **Step 3: systemd timer** — her gün 03:30; `redwall-box-backup.timer` + `.service` (oneshot, script'i çağırır).

- [ ] **Step 4: Deploy + İLK yedeği elle koştur + doğrula**
```bash
scp deploy/monitor/backup/* root@...:/opt/monitor/backup/
ssh ... 'systemctl daemon-reload && systemctl enable --now redwall-box-backup.timer && bash /opt/monitor/backup/box-backup.sh && ls -lh /opt/monitor-backups/ && cat /var/lib/node_exporter/textfile/backup.prom'
```
Expected: 6+ yedek dosyası (>1KB her biri — hardening kontrolü), textfile metriği yazıldı; `redwall_backup_last_success_timestamp` Prometheus'ta.

- [ ] **Step 5: Commit** (`feat(monitor): kutu-içi gece yedekleri (pg+sqlite+config) + tazelik metriği`)

---

### Task 5: Tazelik alarmı + Blok F alarm tek-çatı (kaynak alarmları Grafana→AM)

**Files:**
- Modify: `deploy/monitor/slo/static/self-monitoring.rules.yml` (+backup-stale + kaynak alarmları)
- Modify: `deploy/monitor/README.md` + `slo/README.md` (hangi-alarm-nereden → tek cevap AM)

**Interfaces:**
- Consumes: Task 4 metriği + node/mem/disk metrikleri (Tur 1'den).
- Produces: Grafana-managed alarmların Prometheus-static karşılıkları; Grafana alerting boşalır.

- [ ] **Step 1: Grafana mevcut alarmlarını API ile listele (referans)** — `GET /api/v1/provisioning/alert-rules` (veya `/api/ruler/...`) → disk %85 / RAM %90 / CPU %90 / predict_linear-disk kurallarının expr+eşiklerini AL (birebir taşımak için). Ham çıktı rapora.

- [ ] **Step 2: Static kurallara ekle (repo)** — 4 kaynak alarmı + backup-stale:
```yaml
      - alert: BackupStale
        expr: (time() - redwall_backup_last_success_timestamp) > 93600   # 26 saat
        labels: {severity: ticket, service: monitoring-chain, category: meta, tier: "2"}
        annotations: {summary: "Kutu yedeği 26 saatten eski — gece job'ı başarısız olabilir"}
      - alert: DiskDolu
        expr: 100 - 100*(node_filesystem_avail_bytes{mountpoint="/",fstype!=""}/node_filesystem_size_bytes{mountpoint="/",fstype!=""}) > 85
        for: 5m
        labels: {severity: ticket, service: infra, category: resource, tier: "1"}
        annotations: {summary: "{{$labels.instance}} disk %85 üstü"}
      # + BellekYuksek(90/5m), CPUYuksek(90/10m), DiskPredict(predict_linear 4h) — Grafana expr'lerinden
```
(Grafana'dakiler `instance` bazında ateşliyordu → aynı; severity=ticket [Tur 1 e-posta deseni].)

- [ ] **Step 3: promtool + deploy + AM'de doğrula** — reload → `ALERTS` yeni kurallar inactive; sentetik: bir disk-predict veya düşük eşikli geçici kuralla AM'e ulaştığını gör (Task 2 deseni).

- [ ] **Step 4: Grafana kaynak-alarmlarını SİL** — API ile (`DELETE`), folder `redwall-alerts` boşalır. Doğrula: `GET alert-rules` → kaynak alarmları YOK; Grafana UI Alerting boş.

- [ ] **Step 5: README güncelle** — "hangi alarm nereden" tek cevap: **tüm alarmlar Alertmanager** (Grafana-managed emekli; SMTP config kalır ama kullanılmaz).

- [ ] **Step 6: Commit** (`feat(monitor): alarm tek-çatı — kaynak alarmları Grafana→Alertmanager + backup-stale`)

---

### Task 6: Loki ruler — log-tabanlı alarm (Blok E)

**Files:**
- Modify: `deploy/monitor/loki/loki-config.yml` (ruler bloğu)
- Create: `deploy/monitor/loki/rules/fake/app-log-alerts.yml` (Loki ruler kural formatı)
- Modify: `deploy/monitor/docker-compose.yml` (loki rules mount)

**Interfaces:**
- Produces: Loki→AM log-alarmları (severity=ticket, category=log).

- [ ] **Step 1: ruler config (repo)** — loki-config.yml'e:
```yaml
ruler:
  storage: {type: local, local: {directory: /etc/loki/rules}}
  rule_path: /tmp/loki-rules
  alertmanager_url: http://alertmanager:9093
  enable_alertmanager_v2: true
```
- [ ] **Step 2: kural dosyası (repo, `rules/fake/` — "fake" = tenant-id, single-tenant Loki)**:
```yaml
groups:
  - name: app-loglari
    rules:
      - alert: AppHataFirtinasi
        expr: sum by (host) (rate({host=~"yanginpro-.+|redwall-.+"} |~ "(?i)(FATAL|Uncaught|\\bpanic\\b)" [5m])) > 0.5
        for: 5m
        labels: {severity: ticket, category: log, tier: "2", service: app-logs}
        annotations: {summary: "{{$labels.host}} log akışında hata fırtınası (>0.5/s FATAL/panic)"}
      - alert: LogAkisiKesildi
        expr: sum by (host) (count_over_time({host=~"yanginpro-.+|redwall-.+"} [15m])) == 0
        labels: {severity: ticket, category: log, tier: "2", service: app-logs}
        annotations: {summary: "{{$labels.host}} 15dk log göndermedi — ajan ölmüş olabilir"}
```
- [ ] **Step 3: mount + deploy (RİSK: ruler ilk kez — .bak + tek restart)** — loki-config `.bak`; rules dizin-mount; `docker compose up -d loki`; logda ruler-load hatası YOK + Loki `/ready`. Config bozarsa Loki düşer → `.bak` geri.
- [ ] **Step 4: Sentetik test** — bir test container'dan `logger`/echo ile 30sn `FATAL` bas (veya geçici düşük-eşik) → `AppHataFirtinasi` AM'e ulaşıyor mu (ham). Temizle.
- [ ] **Step 5: Commit** (`feat(monitor): Loki ruler — app hata-fırtınası + log-akışı-kesildi alarmları`)

---

### Task 7: Tempo metrics_generator + servis haritası (Blok G)

**Files:**
- Modify: `deploy/monitor/tempo/tempo.yaml` (metrics_generator + overrides)
- Modify: `deploy/monitor/grafana/provisioning/datasources/datasources.yml` (Tempo ds'e serviceMap/tracesToMetrics)

**Interfaces:**
- Produces: `traces_service_graph_*` + `traces_spanmetrics_*` Prometheus'ta (remote-write); Grafana servis-haritası.

- [ ] **Step 1: tempo.yaml (repo)** — `metrics_generator` (processors: service-graphs + span-metrics; storage.remote_write → `http://prometheus:9090/api/v1/write`); `overrides.defaults.metrics_generator.processors`. Prometheus `--web.enable-remote-write-receiver` ZATEN açık (push modeli).
- [ ] **Step 2: v3.0.2 şema doğrulaması** — `docker run ... tempo -config.verify` (Tur 2-B'de compactor şeması değişmişti; generator şeması v3 için doğrulanır). Şema farklıysa uyarla+raporla.
- [ ] **Step 3: Grafana Tempo ds'e servis-haritası** — datasources.yml Tempo bloğuna `serviceMap: {datasourceUid: <prom-deterministik-uid>}` (import-dashboards/deterministik-uid deseni).
- [ ] **Step 4: deploy + doğrula** — bir test isteği (login) → `traces_service_graph_request_total` Prometheus'ta + Grafana Explore→Tempo→Service Graph görünümü veri gösteriyor.
- [ ] **Step 5: Commit** (`feat(monitor): Tempo metrics_generator — servis haritası + span-metrics`)

---

### Task 8: Runtime-config export + Kuma cert bildirimleri (Blok D/H — kullanıcı-kapılı)

**Files:**
- Create: `deploy/monitor/dr/kuma-export.py` + `grafana-export.sh` + `DR-runbook.md`

- [ ] **Step 1: kuma-export.py (repo)** — Kuma API (2FA-token ile; T2-A/2-C deseni) monitörleri+bildirimleri+API-key'leri JSON'a; ters yön (import) yorumlu. Çalıştır → `/opt/monitor-backups/kuma-config.json` (box-backup'a da eklenir — Task 4 script'ine bir satır).
- [ ] **Step 2: grafana-export.sh (repo)** — `GET /api/dashboards` + datasources + (artık boş ama) alert-rules → JSON. Dashboard'lar zaten repoda (json), bu ek güvence.
- [ ] **Step 3: DR-runbook.md** — "kutu sıfırdan": compose'lar + .env restore + import script'leri + secret yeniden-üretim sırası.
- [ ] **Step 4: Kuma cert bildirimleri (H)** — API ile tüm HTTPS monitörlerde `certExpiryNotification` aç (7/14/21g). API engellerse (2FA/şema): kullanıcı-UI adımı olarak raporla (Settings→Notifications zaten var; her HTTPS monitörde "Certificate Expiry" işaretle). Doğrula: en az 1 monitörde ayar açık.
- [ ] **Step 5: Commit** (`feat(monitor): DR config-export scriptleri + Kuma cert-bitiş bildirimleri`)

---

### Task 9: cloudflare-ips + authentik-fa → file-provider (Blok J)

**Files:**
- Create: `deploy/monitor/traefik/dynamic.yml`
- Modify: `deploy/monitor/docker-compose.yml` (traefik file-provider + mount; kuma/authentik/grafana label'larından middleware TANIMI çıkar, referans @file olur)
- Modify: `deploy/authentik/docker-compose.yml` (authentik-fa TANIMI → dynamic.yml'e; router referansı @file)

**Interfaces:**
- Değiştirir: middleware'ler artık container-restart'tan bağımsız (Tur 1 kırılganlık + T8 404-davranışı DEĞİŞİR).

- [ ] **Step 1: dynamic.yml (repo)** — `cloudflare-ips` (ipAllowList — mevcut CF aralıkları) + `authentik-fa` (forwardAuth — mevcut address/headers) + `security-headers` TANIMLARI. License `dynamic.yml` deseni.
- [ ] **Step 2: traefik file-provider** — compose command'a `--providers.file.filename=/etc/traefik/dynamic.yml` + `--providers.file.watch=true` + mount. Router label'larında middleware `<name>@file` referansı; TANIM label'ları silinir (kuma, grafana, authentik-server).
- [ ] **Step 3: deploy + KRİTİK doğrulama** — traefik+etkilenen servisler recreate; (a) tüm paneller CF'den 200/302, doğrudan-IP 403 (cloudflare-ips @file çalışıyor); (b) **kuma restart testi**: `docker compose restart uptime-kuma` → durum.redwall.tr HÂLÂ 302→auth (middleware kaybolmadı — asıl kazanım); (c) authentik restart → panel forward-auth 5xx/302 ama ROUTER DÜŞMEZ (T8 404→farklı davranış).
- [ ] **Step 4: runbook güncelle** — T8'in 404-fail-closed açıklaması → "file-provider sonrası: authentik ölse de router ayakta, forward-auth 502/bad-gateway verir; yine fail-closed (panel açılmaz) ama kod farklı. Break-glass tünel deseni AYNI."
- [ ] **Step 5: Commit** (`feat(monitor): middleware'ler file-provider'a — restart-dayanıklı (kuma/authentik kırılganlık penceresi kapandı)`)

---

### Task 10: K-bloğu — dış-sunucu durability (readTimeout + erp-metrik)

**Files:** (çoğu diğer sunucu + redwall `deploy/stack.yml`; YANGINPRO kullanıcı-PR)

- [ ] **Step 1: readTimeout risk ölçümü (K1)** — kurumsal (redwall.tr): Payload `/admin` medya-upload sınırı + CF-100MB; yp-test/shtest: dosya-upload akışı MinIO'ya mı (o zaman Traefik'ten geçmez, risk yok) yoksa app üstünden mü. Loki'de geçmiş `readTimeout`/`499`/`timeout` taraması (license dersi imzası). **Ham bulgu + KARAR kullanıcıya** (aşıyorsa flag, aşmıyorsa "gerekmiyor" belgele).
- [ ] **Step 2: karar=uygula ise** — kurumsal `deploy/stack.yml` traefik args `readTimeout=30m` (redwall repo, bu branch); yp → YANGINPRO compose (ayrı dal, kullanıcı PR). Aşmıyorsa: spec/runbook'a "ölçüldü, gerekmedi" notu.
- [ ] **Step 3: erp Traefik-metrik durability (K2)** — `/opt/frappe_docker/redwall.yml` metrik-flag'lerinin frappe-regenerate'e karşı: `/opt/redwall-mon/`e `reapply-traefik-metrics.sh` (regenerate sonrası elle koşulur) + README notu. (Frappe'nin generate mekanizması repo-dışı olduğundan tam-IaC mümkün değil; script+doküman en iyi çözüm.)
- [ ] **Step 4: K3 hatırlatma** — LicenseServer repo'ya readTimeout=30m işlenmesi kullanıcı/developer aksiyonu → runbook+hafıza (repo bizde yok).
- [ ] **Step 5: Commit** (bulgu+uygulama neyse) (`ops(monitor): dış-sunucu durability — readTimeout kararı + erp-metrik reapply`)

---

### Task 11: NOC genişletme + kapanış (runbook + hafıza + final review hazırlık)

**Files:**
- Modify: `deploy/monitor/grafana/dashboards/noc.json` (öz-telemetri satırı + servis-haritası mini-panel + yedek-tazelik göstergesi)
- Modify: hafıza

- [ ] **Step 1: NOC panelleri** — (a) öz-telemetri sağlık ışıkları (loki/tempo/grafana/AM up); (b) "son yedek: N saat önce" stat (backup metriği); (c) servis-haritası linki/mini-panel. Import (deterministik-uid).
- [ ] **Step 2: Son sistem kontrolü** — tüm up==1, tüm alarm inactive, backup taze, ruler yüklü, servis-graph veri.
- [ ] **Step 3: Runbook birleştir** — `deploy/monitor/README.md` Tur 3 bölümü: öz-telemetri, yedek/restore, DR, tek-çatı-alarm, file-provider davranışı.
- [ ] **Step 4: Commit + hafıza** (kontrolör): monitör-sunucusu + bekleyen-isler Tur 3 kapanış.

---

## Self-Review Notları
1. **Spec kapsama:** A→T1+T2, B→T3, C→T4, D→T8, E→T6, F→T5, G→T7, H→T8, I→T1, J→T9, K→T10. NOC/kapanış→T11. Tüm bloklar bir task'te.
2. **Kullanıcı kapıları işaretli:** H (T8 Step4 cert), K1 (T10 Step1 karar), K3 (T10 Step4 hatırlatma).
3. **Riskli task'ler kanıt-adımlı:** T6 (ruler .bak+dry), T9 (kuma-restart testi), T5 (Grafana-sil ÖNCE AM-kur-doğrula), T2 (dead-man değişti→ayrı test), T3 (unix-strip→çift-node kontrolü).
4. **Tutarlılık:** etiket sözleşmesi (severity/tier/service/category) tüm yeni alarmlarda; deterministik-uid deseni T7+T11; instance=redwall-monitor T1+T3.
5. **Bağımlılık:** T2←T1, T5←T4, T11←hepsi. Diğerleri bağımsız → sıra esnek ama numara sırası güvenli.
