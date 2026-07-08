# SLO Alarm + NOC Dashboard (Tur 2-A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Servis-seviyesi SLO alarmları (Sloth + Alertmanager, Google SRE multi-window multi-burn-rate) + tek-bakış NOC dashboard'u — monitör kutusunda (194.62.52.22), uygulama sunucularına sıfır dokunuş.

**Architecture:** Kompakt YAML SLO tanımları (`deploy/monitor/slo/slos/`) → Sloth (docker, tek seferlik) → üretilmiş Prometheus recording+alerting kuralları (git'te, `generated/`) → Prometheus değerlendirir → Alertmanager gruplar/bastırır/yönlendirir → Telegram+e-posta. Hibrit SLI: erişilebilirlik Kuma `monitor_status` metriğinden, başarı-oranı+gecikme Traefik RED metriklerinden. NOC dashboard Grafana'da (API import).

**Tech Stack:** Sloth (ghcr.io/slok/sloth) · prom/alertmanager · prom/node-exporter · Prometheus v3.13 · Grafana 13.1 · Uptime Kuma 2.4 · docker compose (düz, Swarm değil)

**Spec:** `docs/superpowers/specs/2026-07-07-monitor-slo-noc-design.md`

## Global Constraints

- **Sürümler:** yeni imajlar (sloth, alertmanager, node-exporter) en son KARARLI sürümle; uygulama anında `curl -s https://api.github.com/repos/<org>/<repo>/releases/latest | python3 -c 'import sys,json;print(json.load(sys.stdin)["tag_name"])'` ile doğrula — ASLA tahmin etme.
- **Sıfır dokunuş:** yalnız monitör kutusu (194.62.52.22) değişir. 5 hedef sunucuya SSH bile gerekmiyor.
- **Ağ modeli değişmez:** push / no-inbound / CF-Full. Alertmanager ve node-exporter DIŞA AÇILMAZ (Traefik label'ı YOK, yalnız monitor-net).
- **Secret'lar repoya GİRMEZ:** sunucuda `/opt/monitor/secrets/` (600). Repo tarafında `deploy/monitor/.gitignore` ile korunur.
- **SSH erişimi:** desen + parolalar hafızada (`redwall-sunucu-erisim.md`) — plana/repoya yazılmaz. Aşağıdaki `ssh root@194.62.52.22 '...'` komutları o desenle çalıştırılır.
- **Grafana 13 tuzağı:** dashboard'lar file-provisioning DEĞİL, `grafana/import-dashboards.sh` ile API import (datasource uid placeholder `"prometheus"`).
- **Prometheus reload:** `--web.enable-lifecycle` zaten açık → config değişince restart yerine `wget -qO- --post-data='' http://localhost:9090/-/reload`.
- **Dil:** config/script yorumları Türkçe (repo deseni). Branch: `ops/monitor-enterprise-tur1`.
- **Deploy deseni:** dosyalar rsync/scp ile `/opt/monitor/`e (sunucudaki compose `./` göreli yolları korunur), sonra `cd /opt/monitor && docker compose ...`.

---

### Task 1: Kuma metrikleri Prometheus'a (SLI ön koşulu)

Kuma `/metrics` ucunu API-key ile kazı → `monitor_status` Prometheus'ta. Erişilebilirlik SLI'larının tamamı buna bağlı.

**Files:**
- Modify: `deploy/monitor/prometheus/prometheus.yml`
- Modify: `deploy/monitor/docker-compose.yml` (prometheus volumes)
- Create: `deploy/monitor/.gitignore`

**Interfaces:**
- Produces: Prometheus'ta `monitor_status{monitor_name=...}` serisi (0=DOWN, 1=UP, 2=PENDING, 3=BAKIM) + `up{job="kuma"}`. Task 4/6/7/9 bunları kullanır.

- [ ] **Step 1: Kuma API key üret (sunucuda, runtime)**

Tur 1 python-container deseniyle (Kuma admin parolası: kullanıcıdan iste ya da hafıza/konuşma geçmişinden — repoya YAZMA):

```bash
ssh root@194.62.52.22 'docker run --rm --network monitor_monitor-net python:3-alpine sh -c "
pip -q install uptime-kuma-api >/dev/null 2>&1 && python3 - <<PY
from uptime_kuma_api import UptimeKumaApi
api = UptimeKumaApi(\"http://uptime-kuma:3001\")
api.login(\"hamdikalayci\", \"KUMA_ADMIN_PAROLASI\")
r = api.add_api_key(name=\"prometheus-scrape\", expires=None, active=True)
print(r[\"key\"])
api.disconnect()
PY"'
```

Expected: `uk1_...` ile başlayan bir anahtar basılır.
**Fallback** (kütüphane `add_api_key` desteklemiyorsa): kullanıcıdan Kuma UI → Ayarlar → API Keys → yeni anahtar oluşturmasını iste, değeri al.

- [ ] **Step 2: Anahtarı sunucuda secret dosyasına yaz (600)**

```bash
ssh root@194.62.52.22 'mkdir -p /opt/monitor/secrets/prometheus && cat > /opt/monitor/secrets/prometheus/kuma_api_key <<EOF
uk1_BURAYA_ADIM1_CIKTISI
EOF
chmod -R 600 /opt/monitor/secrets/prometheus/kuma_api_key && printf "%s\n" OK'
```

Expected: `OK`. Dosyada satır sonu dışında boşluk OLMAMALI (`password_file` içeriği kırpılmaz).

- [ ] **Step 3: Doğrula — anahtar /metrics'i açıyor mu (başarısızlığı önce gör)**

```bash
ssh root@194.62.52.22 'cd /opt/monitor && docker compose exec prometheus wget -qO- http://uptime-kuma:3001/metrics 2>&1 | head -2 || echo "AUTH-YOK: beklenen 401"'
```

Expected: `AUTH-YOK: beklenen 401` (anahtarsız erişim reddedilir — güvenlik doğrulaması).

```bash
ssh root@194.62.52.22 'KEY=$(cat /opt/monitor/secrets/prometheus/kuma_api_key); cd /opt/monitor && docker compose exec prometheus wget -qO- --header="Authorization: Basic $(printf ":%s" "$KEY" | base64 -w0)" http://uptime-kuma:3001/metrics | grep -m3 monitor_status'
```

Expected: `monitor_status{monitor_name="...",...} 1` satırları.

- [ ] **Step 4: prometheus.yml'e kuma job'ı ekle (repo)**

`deploy/monitor/prometheus/prometheus.yml` sonuna:

```yaml
  # SLO erişilebilirlik SLI kaynağı: Kuma monitör durumları (0=down 1=up 2=pending 3=bakım).
  # Auth: Kuma API key (basic-auth, kullanıcı boş, parola=anahtar). Anahtar sunucuda
  # /opt/monitor/secrets/prometheus/kuma_api_key (600, commit edilmez).
  - job_name: kuma
    basic_auth:
      username: ''
      password_file: /etc/prometheus/secrets/kuma_api_key
    static_configs:
      - targets: ['uptime-kuma:3001']
```

- [ ] **Step 5: compose'da prometheus'a secrets mount'u ekle (repo)**

`deploy/monitor/docker-compose.yml` prometheus `volumes:` bloğuna (mevcut 3 satırın altına):

```yaml
      - ./secrets/prometheus:/etc/prometheus/secrets:ro
```

- [ ] **Step 6: deploy/monitor/.gitignore oluştur (repo)**

```
# Sunucu-yerel gizli değerler — asla commit etme
.env
secrets/
```

- [ ] **Step 7: Deploy + reload + doğrula**

```bash
rsync -av deploy/monitor/prometheus/prometheus.yml root@194.62.52.22:/opt/monitor/prometheus/prometheus.yml
rsync -av deploy/monitor/docker-compose.yml root@194.62.52.22:/opt/monitor/docker-compose.yml
ssh root@194.62.52.22 'cd /opt/monitor && docker compose up -d prometheus && sleep 5 && docker compose exec prometheus wget -qO- --post-data="" http://localhost:9090/-/reload && sleep 35 && docker compose exec prometheus wget -qO- "http://localhost:9090/api/v1/query?query=up%7Bjob%3D%22kuma%22%7D" '
```

Expected: JSON içinde `"value":[...,"1"]` (kuma scrape ayakta). Ardından:

```bash
ssh root@194.62.52.22 'cd /opt/monitor && docker compose exec prometheus wget -qO- "http://localhost:9090/api/v1/query?query=monitor_status" | python3 -c "import sys,json;[print(r[\"metric\"][\"monitor_name\"], r[\"value\"][1]) for r in json.load(sys.stdin)[\"data\"][\"result\"]]"'
```

Expected: ~10 monitör adı + değer 1. **Bu çıktıyı KAYDET** — Task 6/7 SLO YAML'larındaki `monitor_name` değerleri buradan.

- [ ] **Step 8: Commit**

```bash
git add deploy/monitor/prometheus/prometheus.yml deploy/monitor/docker-compose.yml deploy/monitor/.gitignore
git commit -m "feat(monitor): Kuma /metrics Prometheus scrape (SLO erişilebilirlik SLI kaynağı)"
```

---

### Task 2: Eksik Kuma monitörleri (durum, loki, analitik, hata)

Spec kapsama denetimi: Tur 1'in 10 monitörü analitik/hata/durum/loki'yi içermiyor. Tier-2 SLO'ları için dördü de gerekli.

**Files:** (repo değişikliği yok — Kuma runtime, Tur 1 deseni)

**Interfaces:**
- Consumes: Task 1'in `monitor_status` borusu.
- Produces: 4 yeni `monitor_name` serisi: `durum.redwall.tr`, `loki.redwall.tr`, `analitik.redwall.tr`, `hata.redwall.tr`. Task 7 SLO'ları bunlara bağlanır.

- [ ] **Step 1: 4 monitörü ekle (Tur 1 conditions-bypass deseni)**

```bash
ssh root@194.62.52.22 'docker run --rm --network monitor_monitor-net python:3-alpine sh -c "
pip -q install uptime-kuma-api >/dev/null 2>&1 && python3 - <<PY
from uptime_kuma_api import UptimeKumaApi, MonitorType
api = UptimeKumaApi(\"http://uptime-kuma:3001\")
api.login(\"hamdikalayci\", \"KUMA_ADMIN_PAROLASI\")
# KRİTİK (Tur 1 dersi): Kuma 2.4 monitor.conditions NOT NULL; kütüphane göndermiyor
# → _build_monitor_data + conditions=[] + _call(add) bypass.
tanimlar = [
    (\"durum.redwall.tr\",    \"https://durum.redwall.tr\",        [\"200-299\"]),
    # loki: tüm router basic-auth arkasında → 401 = Traefik+Loki router canlı (registry deseni)
    (\"loki.redwall.tr\",     \"https://loki.redwall.tr/ready\",   [\"200-299\", \"401\"]),
    (\"analitik.redwall.tr\", \"https://analitik.redwall.tr\",     [\"200-299\"]),
    (\"hata.redwall.tr\",     \"https://hata.redwall.tr\",         [\"200-299\"]),
]
for ad, url, kabul in tanimlar:
    data = api._build_monitor_data(type=MonitorType.HTTP, name=ad, url=url,
                                   accepted_statuscodes=kabul, interval=60)
    data[\"conditions\"] = []
    r = api._call(\"add\", data)
    print(ad, \"→\", r.get(\"msg\", r))
api.disconnect()
PY"'
```

Expected: 4 satır `... → Added Successfully.` (mesaj sürüme göre değişebilir; hata YOK olmalı).

- [ ] **Step 2: Doğrula — Prometheus'ta 14 monitör**

60-90 sn bekle (ilk prob + scrape), sonra:

```bash
ssh root@194.62.52.22 'cd /opt/monitor && docker compose exec prometheus wget -qO- "http://localhost:9090/api/v1/query?query=count(monitor_status)"'
```

Expected: `"value":[...,"14"]` (10 + 4). Ayrıca 4 yeni ad için değer `1` (UP) kontrol et:

```bash
ssh root@194.62.52.22 'cd /opt/monitor && docker compose exec prometheus wget -qO- "http://localhost:9090/api/v1/query?query=monitor_status%7Bmonitor_name%3D~%22durum.*%7Cloki.*%7Canalitik.*%7Chata.*%22%7D" | python3 -c "import sys,json;[print(r[\"metric\"][\"monitor_name\"], r[\"value\"][1]) for r in json.load(sys.stdin)[\"data\"][\"result\"]]"'
```

Expected: 4 satır, hepsi ` 1`.

- [ ] **Step 3: Commit yok** (runtime değişiklik; kural/config yok). Kuma monitörlerinin runtime kurulduğu Task 10 runbook'unda belgelenir.

---

### Task 3: Monitör kutusuna node_exporter (öz host-metrikleri)

NOC altyapı satırı 6. sunucuyu (monitörün kendisini) da göstersin. Alloy push'larıyla aynı etiket şeması: `job="node"`, `instance="redwall-monitor"`.

**Files:**
- Modify: `deploy/monitor/docker-compose.yml` (yeni servis)
- Modify: `deploy/monitor/prometheus/prometheus.yml` (`node` job'ına static target)

**Interfaces:**
- Produces: `node_*{instance="redwall-monitor", job="node"}` serileri. Task 9 NOC panelleri `instance` üzerinden 6 sunucu gösterir.

- [ ] **Step 1: node-exporter son kararlı sürümü doğrula**

```bash
curl -s https://api.github.com/repos/prometheus/node_exporter/releases/latest | python3 -c 'import sys,json;print(json.load(sys.stdin)["tag_name"])'
```

Expected: `v1.x.y` — aşağıdaki imaj etiketine bunu yaz.

- [ ] **Step 2: compose'a servis ekle (repo)**

`deploy/monitor/docker-compose.yml` — `grafana` servisinden sonra:

```yaml
  # Monitör kutusunun KENDİ host metrikleri (Tur 1 ajanları 5 hedefe kuruldu; kutunun
  # kendisi kördü). Alloy push şemasıyla aynı: job=node, instance=redwall-monitor.
  # DIŞA AÇILMAZ (Traefik label yok); Prometheus iç ağdan kazır.
  node-exporter:
    image: prom/node-exporter:SURUM_ADIM1   # Step 1 çıktısı, örn. v1.9.1
    restart: unless-stopped
    pid: host
    volumes:
      - /:/host:ro,rslave
    command:
      - --path.rootfs=/host
    networks:
      - monitor-net
```

- [ ] **Step 3: prometheus.yml `node` job'ına static target ekle (repo)**

Mevcut `job_name: node` bloğunu şöyle genişlet (file_sd kalır, static eklenir — pushed metriklerle AYNI `job` etiketi için ayrı job açılmaz):

```yaml
  - job_name: node
    file_sd_configs:
      - files: ['/etc/prometheus/targets/node-*.yml']
    # Monitör kutusunun kendisi (Alloy push şemasıyla tutarlı instance adı):
    static_configs:
      - targets: ['node-exporter:9100']
        labels:
          instance: redwall-monitor
```

- [ ] **Step 4: Deploy + doğrula**

```bash
rsync -av deploy/monitor/docker-compose.yml deploy/monitor/prometheus/prometheus.yml root@194.62.52.22:/opt/monitor/ --relative 2>/dev/null || { rsync -av deploy/monitor/docker-compose.yml root@194.62.52.22:/opt/monitor/docker-compose.yml && rsync -av deploy/monitor/prometheus/prometheus.yml root@194.62.52.22:/opt/monitor/prometheus/prometheus.yml; }
ssh root@194.62.52.22 'cd /opt/monitor && docker compose up -d node-exporter && docker compose exec prometheus wget -qO- --post-data="" http://localhost:9090/-/reload && sleep 35 && docker compose exec prometheus wget -qO- "http://localhost:9090/api/v1/query?query=node_uname_info%7Binstance%3D%22redwall-monitor%22%7D" | head -c 400'
```

Expected: JSON `result` boş DEĞİL; `"instance":"redwall-monitor"` görünür.

- [ ] **Step 5: Toplam instance sayısı 6 mı?**

```bash
ssh root@194.62.52.22 'cd /opt/monitor && docker compose exec prometheus wget -qO- "http://localhost:9090/api/v1/query?query=count(count%20by(instance)(node_uname_info))"'
```

Expected: `"value":[...,"6"]` (redwall-erp, redwall-kurumsal, redwall-license, yanginpro-test, yanginpro-shtest, redwall-monitor).

- [ ] **Step 6: Commit**

```bash
git add deploy/monitor/docker-compose.yml deploy/monitor/prometheus/prometheus.yml
git commit -m "feat(monitor): monitör kutusuna node_exporter — öz host-metrikleri (NOC 6. sunucu)"
```

---

### Task 4: rule_files kablolaması + statik meta-monitoring kuralı

Prometheus'a kural okuma yeteneği + "Kuma körlüğü" koruması (SLI metriği YOK olursa alarmlar sessizce susar — bunu yakalayan tek şey bu kural).

**Files:**
- Create: `deploy/monitor/slo/static/meta-monitoring.rules.yml`
- Modify: `deploy/monitor/prometheus/prometheus.yml` (rule_files)
- Modify: `deploy/monitor/docker-compose.yml` (prometheus'a rules mount'ları)

**Interfaces:**
- Produces: `/etc/prometheus/rules/{generated,static}/*.rules.yml` yükleme yolu (Task 6/7 generated kuralları buraya düşer); `KumaMetricsAbsent` alarmı (severity=page, service=monitoring-chain, category=meta).

- [ ] **Step 1: Statik kural dosyasını yaz (repo)**

`deploy/monitor/slo/static/meta-monitoring.rules.yml`:

```yaml
# Meta-monitoring: izleme zincirinin kendisi. Sloth ÜRETMEZ — elle, kasıtlı.
# NEDEN: Kuma çökerse monitor_status metriği "kötü" olmaz, YOK olur → ona bağlı tüm
# erişilebilirlik SLO alarmları sessizce susar. En sinsi arıza modu budur.
groups:
  - name: meta-monitoring
    rules:
      - alert: KumaMetricsAbsent
        expr: up{job="kuma"} == 0 or absent(monitor_status)
        for: 5m
        labels:
          severity: page
          service: monitoring-chain
          category: meta
          tier: "1"
        annotations:
          summary: "Kuma metrikleri YOK — tüm erişilebilirlik SLI'ları kör"
          description: "Prometheus, Uptime Kuma /metrics ucunu 5 dakikadır kazıyamıyor. Erişilebilirlik SLO alarmları şu an sessizce devre dışı. Kuma container/auth kontrol et."
```

- [ ] **Step 2: promtool ile sözdizimi doğrula (yerel, deploy'dan ÖNCE)**

```bash
docker run --rm --entrypoint promtool -v "$PWD/deploy/monitor/slo:/work" prom/prometheus:v3.13.0 check rules /work/static/meta-monitoring.rules.yml
```

Expected: `SUCCESS: 1 rules found`.

- [ ] **Step 3: prometheus.yml'e rule_files ekle (repo — `global:` bloğundan sonra)**

```yaml
# SLO kuralları: generated/ = Sloth üretimi (slo/slos/*.yml kaynağından), static/ = elle
# (meta-monitoring). İkisi de git'te; sunucuya rsync ile gelir, reload ile yüklenir.
rule_files:
  - /etc/prometheus/rules/generated/*.rules.yml
  - /etc/prometheus/rules/static/*.rules.yml
```

- [ ] **Step 4: compose prometheus volumes'a mount ekle (repo)**

```yaml
      - ./slo/generated:/etc/prometheus/rules/generated:ro
      - ./slo/static:/etc/prometheus/rules/static:ro
```

- [ ] **Step 5: `generated/` boş dizin olarak hazırla (mount hedefi var olmalı)**

```bash
mkdir -p deploy/monitor/slo/generated && touch deploy/monitor/slo/generated/.gitkeep
```

- [ ] **Step 6: Deploy + doğrula**

```bash
rsync -av deploy/monitor/slo root@194.62.52.22:/opt/monitor/
rsync -av deploy/monitor/prometheus/prometheus.yml root@194.62.52.22:/opt/monitor/prometheus/prometheus.yml
rsync -av deploy/monitor/docker-compose.yml root@194.62.52.22:/opt/monitor/docker-compose.yml
ssh root@194.62.52.22 'cd /opt/monitor && docker compose up -d prometheus && sleep 5 && docker compose exec prometheus wget -qO- http://localhost:9090/api/v1/rules | python3 -c "import sys,json;d=json.load(sys.stdin);print([g[\"name\"] for g in d[\"data\"][\"groups\"]])"'
```

Expected: `['meta-monitoring']`. Alarm durumu `inactive` olmalı (Kuma sağlıklı):

```bash
ssh root@194.62.52.22 'cd /opt/monitor && docker compose exec prometheus wget -qO- "http://localhost:9090/api/v1/query?query=ALERTS%7Balertname%3D%22KumaMetricsAbsent%22%7D" | head -c 300'
```

Expected: `"result":[]` (ateşlemiyor — doğru).

- [ ] **Step 7: Commit**

```bash
git add deploy/monitor/slo/static/meta-monitoring.rules.yml deploy/monitor/slo/generated/.gitkeep deploy/monitor/prometheus/prometheus.yml deploy/monitor/docker-compose.yml
git commit -m "feat(monitor): rule_files kablolaması + Kuma-körlüğü meta-monitoring alarmı"
```

---

### Task 5: Alertmanager — yönlendirme, gruplama, inhibition, bildirimler

**Files:**
- Create: `deploy/monitor/alertmanager/alertmanager.yml`
- Modify: `deploy/monitor/docker-compose.yml` (alertmanager servisi + am-data volume)
- Modify: `deploy/monitor/prometheus/prometheus.yml` (alerting bloğu)

**Interfaces:**
- Consumes: Prometheus alerting kuralları (Task 4 static, Task 6/7 generated) — alarm etiketleri: `severity` (page|ticket), `tier` ("1"|"2"), `service`, `category` (availability|success|latency|meta).
- Produces: `urgent` (Telegram+e-posta) ve `email-warn` (yalnız e-posta) alıcıları; `service` bazlı gruplama; availability→success/latency inhibition.

- [ ] **Step 1: Alertmanager son kararlı sürümü doğrula**

```bash
curl -s https://api.github.com/repos/prometheus/alertmanager/releases/latest | python3 -c 'import sys,json;print(json.load(sys.stdin)["tag_name"])'
```

Expected: `v0.x.y` — compose imaj etiketine yaz.

- [ ] **Step 2: SMTP kullanıcı adını sunucu .env'inden oku (config'e literal girecek)**

```bash
ssh root@194.62.52.22 'grep -E "^SMTP_(USER|FROM)=|^TELEGRAM_CHAT_ID=" /opt/monitor/.env'
```

Expected: `SMTP_USER=...`, `SMTP_FROM=...`, `TELEGRAM_CHAT_ID=...` — aşağıdaki config'te bu değerler kullanılır (parola DEĞİL, o secret dosyasına gider).

- [ ] **Step 3: alertmanager.yml yaz (repo)**

`deploy/monitor/alertmanager/alertmanager.yml` (SMTP_USER/SMTP_FROM/CHAT_ID değerlerini Step 2 çıktısından doldur):

```yaml
# SLO alarm yönlendirici — Sloth-üretimi Prometheus alarmları buradan geçer.
# Tur 1 kaynak-alarmları (disk/CPU/RAM) Grafana-managed'da KALIR; bu dosya yalnız
# SLO+meta alarmlarını yönetir ("hangi alarm nereden" → slo/README.md).
# Secret'lar: /etc/alertmanager/secrets/{telegram_bot_token,smtp_password}
# (sunucuda /opt/monitor/secrets/alertmanager/, 600, commit edilmez).
global:
  smtp_smarthost: smtp.gmail.com:587
  smtp_from: SMTP_FROM_DEGERI            # ör. no-reply@redwall.tr (Step 2)
  smtp_auth_username: SMTP_USER_DEGERI   # Step 2
  smtp_auth_password_file: /etc/alertmanager/secrets/smtp_password
  smtp_require_tls: true

route:
  receiver: email-warn          # varsayılan: eşleşmeyen her şey e-posta uyarı
  group_by: ['service']         # 5b: aynı servisin çift sinyali (Kuma+Traefik) TEK bildirim
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 12h
  routes:
    - matchers: ['tier="2"']    # Tier-2 her zaman yalnız e-posta (severity fark etmez)
      receiver: email-warn
    - matchers: ['severity="page"']
      receiver: urgent
    - matchers: ['severity="ticket"']
      receiver: email-warn

# 5b dedupe: tam-kesinti (availability) aynı servisin başarı/gecikme alarmlarını bastırır
# (site zaten DOWN'ken "5xx oranı yüksek" bildirimi gürültü).
inhibit_rules:
  - source_matchers: ['category="availability"']
    target_matchers: ['category=~"success|latency"']
    equal: ['service']

receivers:
  - name: urgent
    telegram_configs:
      - bot_token_file: /etc/alertmanager/secrets/telegram_bot_token
        chat_id: CHAT_ID_DEGERI   # Step 2 (tamsayı, tırnaksız)
        send_resolved: true
    email_configs:
      - to: admin@redwall.tr
        send_resolved: true
  - name: email-warn
    email_configs:
      - to: admin@redwall.tr
        send_resolved: true
```

- [ ] **Step 4: compose'a alertmanager servisi + volume ekle (repo)**

`volumes:` üst bloğuna `am-data:` ekle; servisler arasına (prometheus'tan sonra):

```yaml
  # SLO alarm yönlendirici. DIŞA AÇILMAZ (Traefik label yok) — cloudflare-ips gerekmez.
  alertmanager:
    image: prom/alertmanager:SURUM_ADIM1   # Step 1 çıktısı
    restart: unless-stopped
    command:
      - --config.file=/etc/alertmanager/alertmanager.yml
      - --storage.path=/alertmanager
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
      - ./secrets/alertmanager:/etc/alertmanager/secrets:ro
      - am-data:/alertmanager
    networks:
      - monitor-net
```

- [ ] **Step 5: prometheus.yml'e alerting bloğu ekle (repo — rule_files'tan sonra)**

```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']
```

- [ ] **Step 6: Sunucuda secret dosyalarını oluştur (.env'deki mevcut değerlerden)**

```bash
ssh root@194.62.52.22 'mkdir -p /opt/monitor/secrets/alertmanager
grep "^TELEGRAM_BOT_TOKEN=" /opt/monitor/.env | cut -d= -f2- | tr -d "\n" > /opt/monitor/secrets/alertmanager/telegram_bot_token
grep "^SMTP_PASSWORD=" /opt/monitor/.env | cut -d= -f2- | tr -d "\n" > /opt/monitor/secrets/alertmanager/smtp_password
chmod 600 /opt/monitor/secrets/alertmanager/* && wc -c /opt/monitor/secrets/alertmanager/* '
```

Expected: iki dosya, ikisi de >0 bayt. (0 baytsa .env'de o değişken boş — kullanıcıya sor.)

- [ ] **Step 7: Deploy + sağlık doğrula**

```bash
rsync -av deploy/monitor/alertmanager root@194.62.52.22:/opt/monitor/
rsync -av deploy/monitor/docker-compose.yml root@194.62.52.22:/opt/monitor/docker-compose.yml
rsync -av deploy/monitor/prometheus/prometheus.yml root@194.62.52.22:/opt/monitor/prometheus/prometheus.yml
ssh root@194.62.52.22 'cd /opt/monitor && docker compose up -d alertmanager && sleep 5 && docker compose exec prometheus wget -qO- --post-data="" http://localhost:9090/-/reload && docker compose exec alertmanager wget -qO- http://localhost:9093/-/healthy'
```

Expected: `OK` (Alertmanager healthy). Config hatası varsa container crash-loop'ta olur → `docker compose logs alertmanager`.

- [ ] **Step 8: Yönlendirme mantığını amtool ile test et (bildirim GÖNDERMEDEN)**

```bash
ssh root@194.62.52.22 'cd /opt/monitor && docker compose exec alertmanager amtool config routes test --config.file=/etc/alertmanager/alertmanager.yml service=redwall-tr tier=1 severity=page && docker compose exec alertmanager amtool config routes test --config.file=/etc/alertmanager/alertmanager.yml service=yp-test tier=2 severity=page && docker compose exec alertmanager amtool config routes test --config.file=/etc/alertmanager/alertmanager.yml service=erp tier=1 severity=ticket'
```

Expected sırasıyla: `urgent`, `email-warn` (tier=2 page bile olsa e-posta!), `email-warn`.

- [ ] **Step 9: Uçtan uca bildirim testi (gerçek Telegram + e-posta)**

```bash
ssh root@194.62.52.22 'cd /opt/monitor && docker compose exec alertmanager wget -qO- --header="Content-Type: application/json" --post-data="[{\"labels\":{\"alertname\":\"E2ETestAlarm\",\"service\":\"e2e-test\",\"severity\":\"page\",\"tier\":\"1\",\"category\":\"availability\"},\"annotations\":{\"summary\":\"E2E test — yoksay, otomatik silinir\"}}]" http://localhost:9093/api/v2/alerts && echo GONDERILDI'
```

Expected: `GONDERILDI`; ~30sn içinde (group_wait) Telegram mesajı + e-posta gelir. **Kullanıcıya sor: ikisi de geldi mi?** Gelmezse `docker compose logs alertmanager` içinde notify hatasını bul (ör. SMTP auth). Test alarmı ~5dk'da kendiliğinden söner (resolve bildirimi de gelir — send_resolved doğrulanmış olur).

- [ ] **Step 10: Commit**

```bash
git add deploy/monitor/alertmanager/alertmanager.yml deploy/monitor/docker-compose.yml deploy/monitor/prometheus/prometheus.yml
git commit -m "feat(monitor): Alertmanager — SLO alarm yönlendirme (gruplama+inhibition+Telegram/e-posta)"
```

---

### Task 6: Sloth iskeleti + pilot SLO (redwall.tr, tam set)

**Files:**
- Create: `deploy/monitor/slo/generate.sh`
- Create: `deploy/monitor/slo/slos/redwall-tr.yml`
- Create: `deploy/monitor/slo/generated/redwall-tr.rules.yml` (üretim çıktısı)
- Modify: `docs/superpowers/specs/2026-07-07-monitor-slo-noc-design.md` (gecikme eşiği 1s→1.2s, kova-hizalı)

**Interfaces:**
- Consumes: `monitor_status` (Task 1), `traefik_service_requests_total`/`_duration_seconds_*` (Tur 1'den canlı), rules mount (Task 4).
- Produces: Sloth recording metrikleri — `slo:period_error_budget_remaining:ratio`, `slo:current_burn_rate:ratio`, `sloth_slo_info` (etiketler: `sloth_service`, `sloth_slo`) + `page`/`ticket` alarmları. Task 7 aynı deseni çoğaltır; Task 9 NOC bunları okur.

- [ ] **Step 1: Sloth son kararlı sürümü doğrula**

```bash
curl -s https://api.github.com/repos/slok/sloth/releases/latest | python3 -c 'import sys,json;print(json.load(sys.stdin)["tag_name"])'
```

Expected: `vX.Y.Z` — generate.sh içindeki `SLOTH_IMAGE` etiketine yaz.

- [ ] **Step 2: Keşif — Traefik service etiketi + gecikme kovaları (kurumsal)**

```bash
ssh root@194.62.52.22 'cd /opt/monitor && docker compose exec prometheus wget -qO- "http://localhost:9090/api/v1/query?query=sum%20by(service)(rate(traefik_service_requests_total%7Binstance%3D%22redwall-kurumsal%22%7D%5B10m%5D))" | python3 -c "import sys,json;[print(r[\"metric\"].get(\"service\")) for r in json.load(sys.stdin)[\"data\"][\"result\"]]"'
ssh root@194.62.52.22 'cd /opt/monitor && docker compose exec prometheus wget -qO- "http://localhost:9090/api/v1/query?query=count%20by(le)(traefik_service_request_duration_seconds_bucket%7Binstance%3D%22redwall-kurumsal%22%7D)" | python3 -c "import sys,json;[print(r[\"metric\"][\"le\"]) for r in json.load(sys.stdin)[\"data\"][\"result\"]]"'
```

Expected: (1) redwall web servisinin gerçek `service` değeri (ör. `redwall-web@swarm` benzeri — NOT EDİLİR, YAML'da kullanılır); (2) `le` listesi — beklenen Traefik varsayılanı `0.1, 0.3, 1.2, 5.0, +Inf`. **Gecikme eşiği mevcut kovalardan seçilmeli** → `1.2` (histogram kovası olmayan eşik ölçülemez).

- [ ] **Step 3: generate.sh yaz (repo)**

`deploy/monitor/slo/generate.sh` (chmod +x):

```bash
#!/usr/bin/env bash
# SLO tanımları (slos/*.yml) → Sloth → Prometheus kuralları (generated/*.rules.yml).
# Çıktı GIT'E COMMIT EDİLİR — çalışma anında (sunucuda) Sloth GEREKMEZ.
# Yeni servis eklemek: slos/<ad>.yml yaz → ./generate.sh → commit → rsync → reload.
# (bkz. README.md runbook)
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
SLOTH_IMAGE="ghcr.io/slok/sloth:SURUM_ADIM1"   # en son kararlı — Step 1'de doğrulandı
PROM_IMAGE="prom/prometheus:v3.13.0"           # promtool için (compose'daki sürümle aynı)

mkdir -p "$DIR/generated"
for f in "$DIR"/slos/*.yml; do
  name="$(basename "$f" .yml)"
  docker run --rm -v "$DIR:/work" "$SLOTH_IMAGE" generate \
    -i "/work/slos/$name.yml" -o "/work/generated/$name.rules.yml" \
    --default-slo-period=28d
  echo "üretildi: generated/$name.rules.yml"
done

# Sözdizimi doğrulaması (static kurallar dahil) — hatalıysa çık, deploy etme.
docker run --rm --entrypoint promtool -v "$DIR:/work" "$PROM_IMAGE" \
  check rules /work/generated/*.rules.yml /work/static/*.rules.yml
echo "promtool: TAMAM"
```

**Not:** `--default-slo-period=28d` Sloth'un desteklediği pencere kataloğunda yoksa (hata verirse) `30d` kullan ve spec'teki "28-günlük" ifadelerine tek satır not düş ("Sloth 30d — SRE'de eşdeğer standart"); ikisi de endüstri normu.

- [ ] **Step 4: Pilot SLO tanımı yaz (repo)**

`deploy/monitor/slo/slos/redwall-tr.yml` — `SVC` yerine Step 2(1)'in gerçek service değeri; `monitor_name` Task 1 Step 7 çıktısındaki gerçek ad (beklenen: `redwall.tr`):

```yaml
# redwall.tr — Tier-1, tam SLO seti (erişilebilirlik + başarı + gecikme).
# Hedef felsefesi: ulaşılabilirden başla (%99.5), ilk 28g gözden geçirmesinde sıkılaştır (spec §5).
version: "prometheus/v1"
service: "redwall-tr"
labels:
  tier: "1"
slos:
  # Erişilebilirlik — Kuma dış prob (blackbox). == bool 0: yalnız DOWN hata sayılır
  # (2=pending, 3=bakım bütçe YAKMAZ). Subquery 1m çözünürlük. max(): monitör
  # yeniden-oluşturmada kısa süreli çift seri korunması.
  - name: availability
    objective: 99.5
    description: "redwall.tr dışarıdan erişilebilir (Kuma prob, CF+DNS+TLS dahil)"
    labels:
      category: availability
    sli:
      raw:
        error_ratio_query: max(avg_over_time((monitor_status{monitor_name="redwall.tr"} == bool 0)[{{.window}}:1m]))
    alerting:
      name: RedwallTrAvailability
      labels:
        service: redwall-tr
        tier: "1"
        category: availability
      annotations:
        summary: "redwall.tr erişilebilirlik SLO'su hata bütçesini yakıyor"
      page_alert:
        labels:
          severity: page
      ticket_alert:
        labels:
          severity: ticket

  # Başarı oranı — Traefik RED (whitebox): 5xx / tüm istekler.
  # Sıfır-trafik: 0/0=NaN → alarm ateşlemez (körlük Kuma SLO'suyla kapalı — hibrit).
  - name: success
    objective: 99.5
    description: "redwall.tr isteklerinin %99.5'i 5xx değil"
    labels:
      category: success
    sli:
      events:
        error_query: sum(rate(traefik_service_requests_total{instance="redwall-kurumsal",service="SVC",code=~"5.."}[{{.window}}]))
        total_query: sum(rate(traefik_service_requests_total{instance="redwall-kurumsal",service="SVC"}[{{.window}}]))
    alerting:
      name: RedwallTrSuccess
      labels:
        service: redwall-tr
        tier: "1"
        category: success
      annotations:
        summary: "redwall.tr 5xx oranı SLO bütçesini yakıyor"
      page_alert:
        labels:
          severity: page
      ticket_alert:
        labels:
          severity: ticket

  # Gecikme — eşik-tabanlı (spec §5): isteklerin %99'u < 1.2s (1.2 = Traefik varsayılan
  # histogram kovası; kova olmayan eşik ölçülemez, kova-hizalı eşik endüstri pratiği).
  - name: latency
    objective: 99
    description: "redwall.tr isteklerinin %99'u 1.2s'den hızlı"
    labels:
      category: latency
    sli:
      events:
        error_query: (sum(rate(traefik_service_request_duration_seconds_count{instance="redwall-kurumsal",service="SVC"}[{{.window}}])) - sum(rate(traefik_service_request_duration_seconds_bucket{instance="redwall-kurumsal",service="SVC",le="1.2"}[{{.window}}])))
        total_query: sum(rate(traefik_service_request_duration_seconds_count{instance="redwall-kurumsal",service="SVC"}[{{.window}}]))
    alerting:
      name: RedwallTrLatency
      labels:
        service: redwall-tr
        tier: "1"
        category: latency
      annotations:
        summary: "redwall.tr yavaş istek oranı SLO bütçesini yakıyor"
      page_alert:
        labels:
          severity: page
      ticket_alert:
        labels:
          severity: ticket
```

- [ ] **Step 5: Üret + doğrula (yerel)**

```bash
chmod +x deploy/monitor/slo/generate.sh && deploy/monitor/slo/generate.sh
```

Expected: `üretildi: generated/redwall-tr.rules.yml` + `promtool: TAMAM`. Üretilen dosyada `slo:period_error_budget_remaining:ratio` recording kuralı ve `severity: page`/`ticket` alarmları var mı bak:

```bash
grep -c "slo:" deploy/monitor/slo/generated/redwall-tr.rules.yml && grep -m2 "severity" deploy/monitor/slo/generated/redwall-tr.rules.yml
```

Expected: sayı >20 (recording+alert kuralları) ve `severity: page` + `severity: ticket` satırları.

- [ ] **Step 6: Deploy + canlı doğrula**

```bash
rsync -av deploy/monitor/slo root@194.62.52.22:/opt/monitor/
ssh root@194.62.52.22 'cd /opt/monitor && docker compose exec prometheus wget -qO- --post-data="" http://localhost:9090/-/reload && sleep 65 && docker compose exec prometheus wget -qO- "http://localhost:9090/api/v1/query?query=slo:period_error_budget_remaining:ratio%7Bsloth_service%3D%22redwall-tr%22%7D" | python3 -c "import sys,json;[print(r[\"metric\"][\"sloth_slo\"], r[\"value\"][1]) for r in json.load(sys.stdin)[\"data\"][\"result\"]]"'
```

Expected: 3 satır (`availability`, `success`, `latency`) — değerler ~1.0 civarı (bütçe dolu). `latency`/`success` trafiğe bağlı NaN olabilir (düşük trafik) — NaN kabul, availability MUTLAKA sayısal.

- [ ] **Step 7: Spec'e gecikme eşiği düzeltmesini işle + commit**

Spec §4-5'te `1s` → `1.2s (Traefik varsayılan histogram kovası — kova-hizalı eşik)` düzelt.

```bash
git add deploy/monitor/slo/generate.sh deploy/monitor/slo/slos/redwall-tr.yml deploy/monitor/slo/generated/redwall-tr.rules.yml docs/superpowers/specs/2026-07-07-monitor-slo-noc-design.md
git commit -m "feat(monitor): Sloth SLO iskeleti + pilot redwall.tr (avail+success+latency, 28g burn-rate)"
```

---

### Task 7: Kalan 11 servisin SLO tanımları

**Files:**
- Create: `deploy/monitor/slo/slos/{erp,license,registry,yp-test,yp-test-api,yp-shtest,yp-shtest-api,monitor,durum,analitik,hata-glitchtip,loki}.yml` içinden 11 dosya (aşağıdaki tablo)
- Create: karşılık gelen `generated/*.rules.yml` dosyaları

**Interfaces:**
- Consumes: Task 6'nın şablonları; Task 1 Step 7'nin `monitor_name` listesi; Task 2'nin 4 yeni monitörü.
- Produces: 12 servisin tamamı için recording+alerting kuralları (NOC ve Alertmanager tüketir).

- [ ] **Step 1: Keşif — erp/license Traefik service etiketleri**

```bash
ssh root@194.62.52.22 'cd /opt/monitor && for h in redwall-erp redwall-license; do echo "== $h =="; docker compose exec prometheus wget -qO- "http://localhost:9090/api/v1/query?query=sum%20by(service)(rate(traefik_service_requests_total%7Binstance%3D%22$h%22%7D%5B30m%5D))" | python3 -c "import sys,json;[print(r[\"metric\"].get(\"service\")) for r in json.load(sys.stdin)[\"data\"][\"result\"]]"; done'
```

Expected: her sunucunun servis listesi — erp ve license web servislerinin gerçek `service` değerlerini not et.

- [ ] **Step 2: 11 YAML dosyasını yaz (iki şablon + değer tablosu)**

**Tier-1 şablonu** (erp — license aynı yapı): Task 6 Step 4'teki `redwall-tr.yml`'nin `availability` + `success` blokları (latency YOK — yalnız redwall.tr'de). Değişenler: `service:` alanı, `monitor_name`, `instance`, `SVC`, alert adları (`ErpAvailability` vb.), annotation metinleri.

**Tier-2 şablonu** (tam dosya — diğer 8'i aynı yapı, tablodaki değerlerle):

```yaml
# yp-test — Tier-2: yalnız erişilebilirlik, yalnız e-posta uyarı (severity=ticket sabit).
version: "prometheus/v1"
service: "yp-test"
labels:
  tier: "2"
slos:
  - name: availability
    objective: 99
    description: "test.yanginpro dışarıdan erişilebilir (Kuma prob)"
    labels:
      category: availability
    sli:
      raw:
        error_ratio_query: max(avg_over_time((monitor_status{monitor_name="KESIF_ADI"} == bool 0)[{{.window}}:1m]))
    alerting:
      name: YpTestAvailability
      labels:
        service: yp-test
        tier: "2"
        category: availability
      annotations:
        summary: "yp-test erişilebilirlik SLO'su hata bütçesini yakıyor"
      page_alert:
        labels:
          severity: ticket   # Tier-2: hızlı yanış bile SAYFALAMAZ — e-posta uyarı
      ticket_alert:
        labels:
          severity: ticket
```

**Değer tablosu** (monitor_name'ler Task 1 Step 7 + Task 2 Step 2 çıktısındaki GERÇEK adlarla doğrulanır):

| Dosya | service | Tier | SLO'lar | Kuma monitörü (beklenen ad) | Traefik instance/SVC |
|---|---|---|---|---|---|
| erp.yml | erp | 1 | avail 99.5 + success 99.5 | erp.redwall.tr | redwall-erp / Step 1 |
| license.yml | license | 1 | avail 99.5 + success 99.5 | license.redwall.tr | redwall-license / Step 1 |
| registry.yml | registry | 1 | YALNIZ avail 99.5 (makine trafiği) | registry.redwall.tr | — |
| yp-test.yml | yp-test | 2 | avail 99 | test (Kuma'daki ad) | — |
| yp-test-api.yml | yp-test-api | 2 | avail 99 | test-api | — |
| yp-shtest.yml | yp-shtest | 2 | avail 99 | shtest | — |
| yp-shtest-api.yml | yp-shtest-api | 2 | avail 99 | shtest-api | — |
| monitor.yml | monitor | 2 | avail 99 | monitor.redwall.tr | — |
| durum.yml | durum | 2 | avail 99 | durum.redwall.tr | — |
| analitik.yml | analitik | 2 | avail 99 | analitik.redwall.tr | — |
| hata-glitchtip.yml | hata | 2 | avail 99 | hata.redwall.tr | — |
| loki.yml | loki | 2 | avail 99 | loki.redwall.tr | — |

(Not: registry Tier-1 ama avail-only → Tier-1 şablonundan success bloğu çıkarılmış hali; `severity` page/ticket KALIR — Tier-1 sayfalar.)

- [ ] **Step 3: Üret + doğrula**

```bash
deploy/monitor/slo/generate.sh
```

Expected: 12 `üretildi:` satırı + `promtool: TAMAM`.

- [ ] **Step 4: Deploy + canlı doğrula (12 servis × bütçe metrikleri)**

```bash
rsync -av deploy/monitor/slo root@194.62.52.22:/opt/monitor/
ssh root@194.62.52.22 'cd /opt/monitor && docker compose exec prometheus wget -qO- --post-data="" http://localhost:9090/-/reload && sleep 65 && docker compose exec prometheus wget -qO- "http://localhost:9090/api/v1/query?query=count(count%20by(sloth_service)(sloth_slo_info))"'
```

Expected: `"value":[...,"12"]` (12 servis). Ayrıca hiçbir alarm yanlışlıkla ateşlemiyor olmalı:

```bash
ssh root@194.62.52.22 'cd /opt/monitor && docker compose exec prometheus wget -qO- "http://localhost:9090/api/v1/query?query=ALERTS%7Balertstate%3D%22firing%22%7D" | head -c 400'
```

Expected: `"result":[]` (tüm sistemler sağlıklıysa).

- [ ] **Step 5: Commit**

```bash
git add deploy/monitor/slo/slos/ deploy/monitor/slo/generated/
git commit -m "feat(monitor): 12 servisin tamamı için SLO tanımları (Tier-1 sayfalar, Tier-2 uyarır)"
```

---

### Task 8: Sentetik SLO ihlali — uçtan uca kanıt

Gerçek arıza simülasyonu: kasıtlı-bozuk servis → burn-rate alarmı → Alertmanager → Telegram/e-posta. (Tur 1 "always-firing geçici kural" deseninin SLO karşılığı.)

**Files:** (kalıcı repo değişikliği YOK — geçici dosyalar sunucuda, sonunda silinir)

**Interfaces:**
- Consumes: Task 1-7'nin tüm zinciri.
- Produces: "SLO borusu uçtan uca ÇALIŞIYOR" kanıtı.

- [ ] **Step 1: Kasıtlı-bozuk Kuma monitörü oluştur**

```bash
ssh root@194.62.52.22 'docker run --rm --network monitor_monitor-net python:3-alpine sh -c "
pip -q install uptime-kuma-api >/dev/null 2>&1 && python3 - <<PY
from uptime_kuma_api import UptimeKumaApi, MonitorType
api = UptimeKumaApi(\"http://uptime-kuma:3001\")
api.login(\"hamdikalayci\", \"KUMA_ADMIN_PAROLASI\")
data = api._build_monitor_data(type=MonitorType.HTTP, name=\"slo-e2e-test\",
    url=\"https://olmayan-e2e-test.redwall.tr\", accepted_statuscodes=[\"200-299\"], interval=20)
data[\"conditions\"] = []
print(api._call(\"add\", data))
api.disconnect()
PY"'
```

Expected: eklendi mesajı. Monitör ~1dk içinde DOWN'a düşer (`monitor_status ... 0`).

- [ ] **Step 2: Geçici test-SLO kuralı üret ve YALNIZ SUNUCUYA koy (commit ETME)**

Yerelde `deploy/monitor/slo/slos/slo-e2e-test.yml` yaz (Tier-2 şablonunun kopyası; değişenler: `service: "slo-e2e-test"`, `monitor_name="slo-e2e-test"`, alerting.name `SloE2eTest`, **`page_alert.labels.severity: page` + `tier: "1"`** — Telegram yolunu test için). `generate.sh` çalıştır, üretilen dosyayı sunucuya gönder, sonra yerel iki dosyayı sil (git'e girmez):

```bash
deploy/monitor/slo/generate.sh
scp deploy/monitor/slo/generated/slo-e2e-test.rules.yml root@194.62.52.22:/opt/monitor/slo/generated/
rm deploy/monitor/slo/slos/slo-e2e-test.yml deploy/monitor/slo/generated/slo-e2e-test.rules.yml
ssh root@194.62.52.22 'cd /opt/monitor && docker compose exec prometheus wget -qO- --post-data="" http://localhost:9090/-/reload && echo RELOAD-OK'
```

Expected: `RELOAD-OK`.

- [ ] **Step 3: Alarmın ateşlemesini bekle ve izle**

%100 hata oranı → burn-rate ≈ 1/(1−0.99) = 100 ≫ 14.4 (en agresif page eşiği) → kısa pencere (5m/30m) dolunca ateşler. ~6-8 dk bekle:

```bash
ssh root@194.62.52.22 'cd /opt/monitor && docker compose exec prometheus wget -qO- "http://localhost:9090/api/v1/query?query=ALERTS%7Bsloth_service%3D%22slo-e2e-test%22%7D" | python3 -c "import sys,json;[print(r[\"metric\"][\"alertname\"], r[\"metric\"][\"alertstate\"]) for r in json.load(sys.stdin)[\"data\"][\"result\"]]"'
```

Expected: önce `pending`, sonra `firing`. Firing olunca ~30sn içinde **Telegram mesajı + e-posta** gelmeli. **Kullanıcıya doğrulat.**

- [ ] **Step 4: Temizlik**

```bash
ssh root@194.62.52.22 'rm /opt/monitor/slo/generated/slo-e2e-test.rules.yml && cd /opt/monitor && docker compose exec prometheus wget -qO- --post-data="" http://localhost:9090/-/reload && docker run --rm --network monitor_monitor-net python:3-alpine sh -c "
pip -q install uptime-kuma-api >/dev/null 2>&1 && python3 - <<PY
from uptime_kuma_api import UptimeKumaApi
api = UptimeKumaApi(\"http://uptime-kuma:3001\")
api.login(\"hamdikalayci\", \"KUMA_ADMIN_PAROLASI\")
m = [x for x in api.get_monitors() if x[\"name\"] == \"slo-e2e-test\"]
print(api.delete_monitor(m[0][\"id\"]) if m else \"zaten yok\")
api.disconnect()
PY"'
```

Expected: silme onayı. Sonra `ALERTS{sloth_service="slo-e2e-test"}` → boş; Telegram'a "resolved" mesajı düşer.

- [ ] **Step 5: Commit yok** (geçici test). Sonuç Task 10 runbook'una "test edildi: <tarih>" notu olarak girer.

---

### Task 9: NOC dashboard

**Files:**
- Create: `deploy/monitor/grafana/dashboards/noc.json`

**Interfaces:**
- Consumes: `monitor_status` (Task 1-2), `slo:*` recording'leri (Task 6-7), `ALERTS`, `node_*` (Task 3 dahil 6 sunucu), `traefik_service_request_duration_seconds_bucket`.
- Produces: Grafana'da "Redwall NOC" dashboard'u (uid `redwall-noc`), kiosk-hazır.

- [ ] **Step 1: noc.json yaz (repo)**

`deploy/monitor/grafana/dashboards/noc.json` — datasource uid'leri `"prometheus"` placeholder (import script değiştirir). `TIER1_SVC_REGEX` yerine Task 6-7 keşiflerindeki gerçek Tier-1 service değerlerinden regex (ör. `redwall-web@swarm|erp-.*@...` — keşif çıktısına göre):

```json
{
  "title": "Redwall NOC",
  "uid": "redwall-noc",
  "tags": ["redwall", "noc", "slo"],
  "timezone": "browser",
  "refresh": "30s",
  "time": { "from": "now-6h", "to": "now" },
  "schemaVersion": 39,
  "panels": [
    {
      "type": "stat", "title": "Servis Sağlığı (Kuma — dış prob)",
      "gridPos": { "h": 6, "w": 24, "x": 0, "y": 0 },
      "datasource": { "type": "prometheus", "uid": "prometheus" },
      "targets": [{ "expr": "monitor_status", "legendFormat": "{{monitor_name}}", "refId": "A" }],
      "options": { "colorMode": "background", "reduceOptions": { "calcs": ["lastNotNull"] } },
      "fieldConfig": { "defaults": { "mappings": [{ "type": "value", "options": {
        "0": { "text": "DOWN", "color": "red" }, "1": { "text": "UP", "color": "green" },
        "2": { "text": "BEKLEME", "color": "yellow" }, "3": { "text": "BAKIM", "color": "blue" } } }],
        "thresholds": { "mode": "absolute", "steps": [{ "color": "green", "value": null }] } }, "overrides": [] }
    },
    {
      "type": "bargauge", "title": "Hata Bütçesi Kalan — 28g (%)",
      "gridPos": { "h": 8, "w": 14, "x": 0, "y": 6 },
      "datasource": { "type": "prometheus", "uid": "prometheus" },
      "targets": [{ "expr": "clamp_min(slo:period_error_budget_remaining:ratio, -1) * 100", "legendFormat": "{{sloth_service}} · {{sloth_slo}}", "refId": "A" }],
      "options": { "displayMode": "gradient", "orientation": "horizontal", "reduceOptions": { "calcs": ["lastNotNull"] } },
      "fieldConfig": { "defaults": { "unit": "percent", "min": -100, "max": 100,
        "thresholds": { "mode": "absolute", "steps": [
          { "color": "red", "value": null }, { "color": "orange", "value": 10 },
          { "color": "yellow", "value": 30 }, { "color": "green", "value": 55 } ] } }, "overrides": [] }
    },
    {
      "type": "stat", "title": "Burn Rate (anlık — 1.0 = tam bütçe hızında)",
      "gridPos": { "h": 8, "w": 10, "x": 14, "y": 6 },
      "datasource": { "type": "prometheus", "uid": "prometheus" },
      "targets": [{ "expr": "slo:current_burn_rate:ratio", "legendFormat": "{{sloth_service}} · {{sloth_slo}}", "refId": "A" }],
      "options": { "colorMode": "background", "reduceOptions": { "calcs": ["lastNotNull"] } },
      "fieldConfig": { "defaults": { "decimals": 1,
        "thresholds": { "mode": "absolute", "steps": [
          { "color": "green", "value": null }, { "color": "yellow", "value": 1 },
          { "color": "orange", "value": 3 }, { "color": "red", "value": 6 } ] } }, "overrides": [] }
    },
    {
      "type": "table", "title": "Aktif Alarmlar (SLO + meta)",
      "gridPos": { "h": 7, "w": 24, "x": 0, "y": 14 },
      "datasource": { "type": "prometheus", "uid": "prometheus" },
      "targets": [{ "expr": "ALERTS{alertstate=\"firing\"}", "format": "table", "instant": true, "refId": "A" }],
      "options": {},
      "fieldConfig": { "defaults": {}, "overrides": [] },
      "transformations": [{ "id": "organize", "options": { "excludeByName": { "Time": true, "Value": true, "__name__": true } } }]
    },
    {
      "type": "bargauge", "title": "CPU (%) — 6 sunucu",
      "gridPos": { "h": 7, "w": 8, "x": 0, "y": 21 },
      "datasource": { "type": "prometheus", "uid": "prometheus" },
      "targets": [{ "expr": "100 * (1 - avg by(instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])))", "legendFormat": "{{instance}}", "refId": "A" }],
      "options": { "displayMode": "gradient", "orientation": "horizontal", "reduceOptions": { "calcs": ["lastNotNull"] } },
      "fieldConfig": { "defaults": { "unit": "percent", "min": 0, "max": 100,
        "thresholds": { "mode": "absolute", "steps": [
          { "color": "green", "value": null }, { "color": "yellow", "value": 70 }, { "color": "red", "value": 90 } ] } }, "overrides": [] }
    },
    {
      "type": "bargauge", "title": "Bellek (%) — 6 sunucu",
      "gridPos": { "h": 7, "w": 8, "x": 8, "y": 21 },
      "datasource": { "type": "prometheus", "uid": "prometheus" },
      "targets": [{ "expr": "100 * (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)", "legendFormat": "{{instance}}", "refId": "A" }],
      "options": { "displayMode": "gradient", "orientation": "horizontal", "reduceOptions": { "calcs": ["lastNotNull"] } },
      "fieldConfig": { "defaults": { "unit": "percent", "min": 0, "max": 100,
        "thresholds": { "mode": "absolute", "steps": [
          { "color": "green", "value": null }, { "color": "yellow", "value": 80 }, { "color": "red", "value": 90 } ] } }, "overrides": [] }
    },
    {
      "type": "bargauge", "title": "Disk / (%) — 6 sunucu",
      "gridPos": { "h": 7, "w": 8, "x": 16, "y": 21 },
      "datasource": { "type": "prometheus", "uid": "prometheus" },
      "targets": [{ "expr": "100 - 100 * (node_filesystem_avail_bytes{mountpoint=\"/\",fstype!=\"\"} / node_filesystem_size_bytes{mountpoint=\"/\",fstype!=\"\"})", "legendFormat": "{{instance}}", "refId": "A" }],
      "options": { "displayMode": "gradient", "orientation": "horizontal", "reduceOptions": { "calcs": ["lastNotNull"] } },
      "fieldConfig": { "defaults": { "unit": "percent", "min": 0, "max": 100,
        "thresholds": { "mode": "absolute", "steps": [
          { "color": "green", "value": null }, { "color": "yellow", "value": 75 }, { "color": "red", "value": 85 } ] } }, "overrides": [] }
    },
    {
      "type": "timeseries", "title": "Tier-1 p95 gecikme (bilgi amaçlı — SLO eşiği 1.2s)",
      "gridPos": { "h": 8, "w": 24, "x": 0, "y": 28 },
      "datasource": { "type": "prometheus", "uid": "prometheus" },
      "targets": [{ "expr": "histogram_quantile(0.95, sum by (le, service) (rate(traefik_service_request_duration_seconds_bucket{service=~\"TIER1_SVC_REGEX\"}[5m])))", "legendFormat": "{{service}}", "refId": "A" }],
      "options": {},
      "fieldConfig": { "defaults": { "unit": "s" }, "overrides": [] }
    }
  ]
}
```

- [ ] **Step 2: Import (mevcut script — Grafana 13 uid tuzağını çözer)**

```bash
GF_URL=https://monitor.redwall.tr GF_USER=admin GF_PASS='GRAFANA_ADMIN_PAROLASI' deploy/monitor/grafana/import-dashboards.sh
```

Expected: `noc → OK /d/redwall-noc/...` satırı (diğer dashboard'lar da overwrite import olur — idempotent).

- [ ] **Step 3: Panelleri canlı doğrula (Grafana API ile veri kontrolü)**

```bash
curl -s -u admin:GRAFANA_ADMIN_PAROLASI "https://monitor.redwall.tr/api/dashboards/uid/redwall-noc" | python3 -c 'import sys,json;d=json.load(sys.stdin)["dashboard"];print(len(d["panels"]),"panel");[print("-",p["title"]) for p in d["panels"]]'
```

Expected: `8 panel` + başlık listesi. Görsel doğrulama: kullanıcıya `https://monitor.redwall.tr/d/redwall-noc?kiosk&refresh=30s` linkini ver — servis ızgarası yeşil, bütçeler ~%100, 6 sunucu görünüyor mu?

- [ ] **Step 4: Commit**

```bash
git add deploy/monitor/grafana/dashboards/noc.json
git commit -m "feat(monitor): Redwall NOC dashboard — servis sağlığı + hata bütçesi + alarmlar + 6-sunucu altyapı + p95"
```

---

### Task 10: Runbook + belge + hafıza kapanışı

**Files:**
- Create: `deploy/monitor/slo/README.md`
- Modify: `deploy/monitor/README.md` (SLO bölümü işaretçisi)
- Modify: hafıza (`redwall-bekleyen-isler.md`, `redwall-monitor-sunucusu.md`)

**Interfaces:**
- Consumes: tüm önceki task'lerin sonuçları/dersleri.
- Produces: işletim runbook'u; güncel hafıza.

- [ ] **Step 1: slo/README.md yaz (repo)** — şu bölümlerle, uygulama sırasında öğrenilen gerçek değerlerle:

```markdown
# SLO Alarm Sistemi — deploy/monitor/slo

Spec: docs/superpowers/specs/2026-07-07-monitor-slo-noc-design.md
Mimari: slos/*.yml (elle) → generate.sh (Sloth) → generated/*.rules.yml (git'te)
→ Prometheus → Alertmanager → Telegram+e-posta. static/ = elle meta-monitoring.

## Hangi alarm nereden? (iki sistem — bilinçli)
- Grafana-managed: KAYNAK alarmları (disk %85, RAM %90, CPU %90, disk-predict) — Tur 1.
- Alertmanager: SLO + meta alarmları (bu dizin). Tier-1 → Telegram+e-posta; Tier-2 → e-posta.

## Yeni servis ekleme (ör. YangınPro production geldiğinde)
1. Kuma'da monitör oluştur (UI veya Tur 1 python deseni).
2. slos/<ad>.yml yaz (mevcut bir dosyayı kopyala; tier/objective/monitor_name/service değiştir).
   Traefik SLI'sı da olacaksa instance+service etiketlerini Prometheus'tan keşfet:
   sum by(service)(rate(traefik_service_requests_total{instance="<host>"}[30m]))
3. ./generate.sh   (üretir + promtool doğrular)
4. git commit; rsync -av deploy/monitor/slo root@194.62.52.22:/opt/monitor/
5. Prometheus reload: docker compose exec prometheus wget -qO- --post-data="" http://localhost:9090/-/reload
6. Doğrula: sloth_slo_info{sloth_service="<ad>"} Prometheus'ta görünür.

## Bakım susturması (planlı deploy — 5c)
Kısa blip'leri multi-window zaten yutar. Uzun bakım için:
  docker compose exec alertmanager amtool silence add service=<ad> --duration=1h --comment="planlı bakım" --author="<kim>"
Silme: amtool silence expire <id>   Listeleme: amtool silence query

## 28-gün SLO gözden geçirmesi (ilk pencere: ~2026-08-04)
Her SLO için ölçülen performansa bak (NOC hata bütçesi paneli):
- Bütçe hep ~%100 → hedef sıkılaştırılabilir (ör. Tier-1 avail 99.5 → 99.9).
- Bütçe sahte-tetiklenmelerle eriyor (düşük trafik) → o servisin success SLO'sunu ticket'a indir veya avail-only yap.
- Değişiklik = slos/*.yml düzenle → generate → commit → rsync → reload.

## Test edildi
- <tarih>: sentetik ihlal (slo-e2e-test) → page alarmı → Telegram+e-posta OK; resolved OK.
- Kuma monitörleri runtime'da (API ile) kurulur — DB'de yaşar, repoda üretme scripti yok
  (Tur 1 ile aynı yaklaşım). Kuma API key: /opt/monitor/secrets/prometheus/kuma_api_key.
```

- [ ] **Step 2: Ana README'ye işaretçi ekle**

`deploy/monitor/README.md` "İşletim" bölümüne bir satır:

```markdown
- **SLO alarmları + NOC:** bkz. `slo/README.md` (Sloth üretimi, Alertmanager yönlendirme,
  yeni servis ekleme, bakım susturması). NOC: https://monitor.redwall.tr/d/redwall-noc (kiosk: ?kiosk&refresh=30s)
```

- [ ] **Step 3: Doğrulama — tüm sistem son kontrol**

```bash
ssh root@194.62.52.22 'cd /opt/monitor && docker compose ps --format "{{.Name}} {{.Status}}" && docker compose exec prometheus wget -qO- "http://localhost:9090/api/v1/query?query=count(sloth_slo_info)" && docker compose exec alertmanager wget -qO- http://localhost:9093/-/healthy'
```

Expected: tüm servisler `Up`; `sloth_slo_info` sayısı ≥ 12 SLO; `OK`.

- [ ] **Step 4: Commit + hafıza güncelle**

```bash
git add deploy/monitor/slo/README.md deploy/monitor/README.md
git commit -m "docs(monitor): SLO runbook — yeni servis ekleme, bakım susturması, 28g gözden geçirme"
```

Hafıza: `redwall-bekleyen-isler.md`'ye "Tur 2-A TAMAMLANDI" + 28g gözden geçirme tarihi (~2026-08-04); `redwall-monitor-sunucusu.md`'ye SLO yığını özeti + yeni tuzaklar (uygulamada çıkanlar).

---

## Self-Review Notları (plan yazarı doldurdu)

1. **Spec kapsama:** §6.1 Kuma scrape→Task 1; §5 kapsama notları (durum/loki/analitik/hata monitörleri)→Task 2; öz node_exporter→Task 3; static meta-monitoring→Task 4; §6.2 Alertmanager→Task 5; §6.3 Sloth+pilot→Task 6; 12 servis→Task 7; §7 sentetik ihlal→Task 8; §6.4 NOC→Task 9; runbook+28g gözden geçirme→Task 10. Boşluk yok.
2. **Bilinçli sapmalar (spec'e işlenir):** gecikme eşiği 1s→1.2s (Traefik varsayılan kovası — Task 6 Step 7'de spec düzeltilir); Sloth 28d desteklemezse 30d fallback (Task 6 Step 3 notu).
3. **Keşif-değerleri deseni:** `SVC`, `KESIF_ADI`, `TIER1_SVC_REGEX`, `SURUM_ADIM1`, parolalar — bunlar TBD değil; her biri için üreten komut ve beklenen çıktı aynı task içinde verildi (canlı sistemden alınmak ZORUNDA, plana yazılamaz).
4. **Etiket tutarlılığı:** alarm etiketleri `severity/tier/service/category` — alertmanager.yml route/inhibit (Task 5) ↔ Sloth alerting.labels (Task 6-7) ↔ static kural (Task 4) birebir aynı adlar. Recording etiketleri `sloth_service/sloth_slo` yalnız NOC panellerinde (Task 9).
