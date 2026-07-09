# Dağıtık İzleme — Tempo + YangınPro OTel (Tur 2-B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** İstek yolculuğunu uçtan uca görmek: YangınPro test+shtest api/queue izleri → `izler.redwall.tr` → Tempo → Grafana (log↔iz korelasyonlu).

**Architecture:** Tempo monitör kutusuna Umami deseniyle (`/opt/tempo`, düz compose); OTLP-HTTP alımı `izler.redwall.tr` (CF orange → Traefik basic-auth). YangınPro tarafı yalnız bağımlılık+env (auto-instrumentation); ortak imaj, `deployment.environment` ayrımı, `OTEL_PHP_AUTOLOAD_ENABLED` ortam-kapısı (test önce, shtest sonra).

**Tech Stack:** Grafana Tempo (en son kararlı — kurulumda doğrulanır) · OpenTelemetry PHP extension + Laravel auto-instrumentation (paket adları/sürümleri kurulumda doğrulanır) · mevcut Traefik/Grafana/Loki

**Spec:** `docs/superpowers/specs/2026-07-09-monitor-tempo-tur2b-design.md`

## Global Constraints

- **Sürümler:** Tempo imajı (`grafana/tempo`) GitHub releases'ten; composer paketleri Packagist'ten güncel-kararlı doğrulanır — tahmin yok.
- **İki repo:** redwall (monitör ayağı, branch `ops/monitor-tempo-tur2b`) + YANGINPRO (uygulama ayağı, yeni dal `ops/otel-tracing`; PR'ı KULLANICI açar — hook). YANGINPRO'da api/ tarafına dokunulduğu için **phpstan yeşil şartı** (repo disiplini) commit öncesi.
- **Bilinen tuzaklar:** basic-auth hash `$$`-kaçışı (.env'e python-literal); tek-dosya rsync `--inplace`; Grafana-13 sabit-uid yasak (datasource uid'siz, referanslar runtime-API ile); monitör kutusunda düz `docker compose` (deploy.sh YOK); YANGINPRO deploy'ları kendi CI'sıyla (sunucuda elle stack deploy YOK).
- **Sıfır-inbound korunur:** hedef sunucularda port açılmaz; izler yalnız outbound HTTPS.
- **Kullanıcı kapıları:** `izler` DNS kaydı (T2 öncesi); YANGINPRO PR merge (T5 öncesi); shtest kapı-açma onayı (T6).
- SSH deseni hafızada; parolalar/secret'lar rapora-repoya yazılmaz. Türkçe yorumlar.

---

### Task 1: Tempo IaC (deploy/tempo — redwall repo)

**Files:**
- Create: `deploy/tempo/docker-compose.yml`, `deploy/tempo/tempo.yaml`, `deploy/tempo/.env.example`, `deploy/tempo/README.md` (iskelet)

**Interfaces:**
- Produces: `izler.redwall.tr` router'ı (basic-auth `${TEMPO_BASICAUTH}`); tempo servisi monitor-net'te (`tempo:4318` OTLP-HTTP alım, `tempo:3200` sorgu — yalnız iç ağ); 7g retention.

- [ ] **Step 1: Sürüm doğrula** — `curl -s https://api.github.com/repos/grafana/tempo/releases/latest | python3 -c '...tag_name'` → `vX.Y.Z` (imaj `grafana/tempo:X.Y.Z`).
- [ ] **Step 2: tempo.yaml yaz**

```yaml
# Tempo — tek düğüm, yerel disk, 7g saklama. OTLP-HTTP alım :4318 (Traefik basic-auth arkası),
# sorgu API :3200 (yalnız iç ağ — Grafana datasource buradan).
server:
  http_listen_port: 3200
distributor:
  receivers:
    otlp:
      protocols:
        http:
          endpoint: 0.0.0.0:4318
storage:
  trace:
    backend: local
    local:
      path: /var/tempo/blocks
    wal:
      path: /var/tempo/wal
compactor:
  compaction:
    block_retention: 168h   # 7 gün (spec §2)
```
(Not: alan adları kurulu sürümün şemasıyla doğrulanır — `docker run --rm -v ...:/etc/tempo grafana/tempo:X.Y.Z -config.check ...` benzeri; sürüm şeması farklıysa uyarlanıp raporlanır.)

- [ ] **Step 3: docker-compose.yml** (Umami deseni; tempo tek servis):

```yaml
name: tempo
networks:
  monitor-net:
    external: true
    name: monitor_monitor-net
volumes:
  tempo-data:
services:
  tempo:
    image: grafana/tempo:SURUM_ADIM1
    command: ["-config.file=/etc/tempo/tempo.yaml"]
    volumes:
      - ./tempo.yaml:/etc/tempo/tempo.yaml:ro
      - tempo-data:/var/tempo
    networks: [monitor-net]
    restart: unless-stopped
    labels:
      - traefik.enable=true
      - traefik.docker.network=monitor_monitor-net
      # İz alım ucu — YALNIZ OTLP path'i, basic-auth (loki./push. deseni)
      - traefik.http.routers.tempo-otlp.rule=Host(`izler.redwall.tr`) && PathPrefix(`/v1/traces`)
      - traefik.http.routers.tempo-otlp.entrypoints=websecure
      - traefik.http.routers.tempo-otlp.tls=true
      - traefik.http.routers.tempo-otlp.middlewares=tempo-auth
      - traefik.http.middlewares.tempo-auth.basicauth.users=${TEMPO_BASICAUTH}
      - traefik.http.services.tempo-svc.loadbalancer.server.port=4318
```

- [ ] **Step 4: .env.example** (`TEMPO_BASICAUTH` — htpasswd üretimi + `$$`-kaçış talimatı, loki deseninin kopyası) + README iskeleti (kurulum + runbook başlıkları: yeni servis bağlama, sampling değiştirme, disk izleme — T7'de dolar).
- [ ] **Step 5: yq/python doğrulama + commit** (`feat(tempo): Tempo IaC — izler.redwall.tr OTLP alımı, 7g yerel saklama`).

---

### Task 2: Deploy + sentetik izle boru kanıtı

**Files:** (sunucu; repo değişikliği yok)

- [ ] **Step 1: Ön koşullar** — `dig +short izler.redwall.tr` (CF IP'leri; boşsa kullanıcıya sor) + disk ölçümü: `df -h /` + mevcut prom/loki hacim boyutları (`docker system df -v | grep -E "prom-data|loki-data"`) → ≥10GB boş şartı; değilse BLOCKED.
- [ ] **Step 2: Kur** — rsync `/opt/tempo` + `.env` (htpasswd üret, `$$`-kaçış python-literal) + `docker compose up -d` → container Up + `docker compose exec tempo wget -qO- localhost:3200/ready` → `ready`.
- [ ] **Step 3: Sentetik iz** — dışarıdan (yerel makineden) OTLP JSON POST:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -u "agent:PAROLA" https://izler.redwall.tr/v1/traces \
  -H 'Content-Type: application/json' -d '{"resourceSpans":[{"resource":{"attributes":[{"key":"service.name","value":{"stringValue":"boru-testi"}}]},"scopeSpans":[{"spans":[{"traceId":"5b8efff798038103d269b633813fc60c","spanId":"eee19b7ec3c1b174","name":"sentetik","kind":1,"startTimeUnixNano":"NOW_NS","endTimeUnixNano":"NOW_NS+1e9"}]}]}]}'
```
Expected: 200 (auth'suz 401). Ardından Tempo sorgu API'sinde iz bulunur: `docker compose exec tempo wget -qO- "localhost:3200/api/traces/5b8efff798038103d269b633813fc60c"` → JSON (boş değil). NOW_NS gerçek epoch-nano ile doldurulur.

---

### Task 3: Grafana datasource + Loki derived-field

**Files:**
- Modify: `deploy/monitor/grafana/provisioning/datasources/datasources.yml` (+Tempo, uid'siz)

- [ ] Steps: datasources.yml'e Tempo bloğu (url `http://tempo:3200`, uid YOK) → `rsync --inplace`... (provisioning dizin-mount ise normal rsync; kontrol et) → grafana restart → API'den Tempo uid'ini keşfet → Loki datasource'unu API `PUT`la güncelle: `derivedFields: [{name: TraceID, matcherRegex: "trace_id[=:\\\"]+(\\w+)", url: "$${__value.raw}", datasourceUid: <tempo-uid>, urlDisplayLabel: "İze git"}]` (Grafana-13 uid tuzağı: runtime-API deseni) → doğrulama: Explore'da sentetik iz Tempo'dan açılıyor + commit.

---

### Task 4: YANGINPRO enstrümantasyon dalı (uygulama ayağı)

**Files (YANGINPRO repo, dal `ops/otel-tracing` master'dan):**
- Modify: `docker/images/api/Dockerfile`, `docker/images/queue/Dockerfile`
- Modify: `api/composer.json` (+lock — `composer require` ile)
- Modify: `docker/test/docker-compose.yml`, `docker/shtest/docker-compose.yml` (api+queue env blokları)

**Interfaces:**
- Consumes: `izler.redwall.tr` (T2'de canlı), TEMPO basic-auth kimliği (b64 → ortam sunucularının .env'ine; compose `${TEMPO_OTLP_AUTH}`).
- Produces: OTel-yetenekli imajlar; test'te AÇIK, shtest'te KAPALI env kapısı.

- [ ] **Step 1: Paket keşfi** — Packagist'ten güncel adlar/kararlı sürümler doğrulanır: `open-telemetry/sdk`, `open-telemetry/exporter-otlp`, `open-telemetry/opentelemetry-auto-laravel` (+auto-pdo/guzzle gerekliyse — auto-laravel'in bağımlılık ağacına göre; keşif çıktısı rapora).
- [ ] **Step 2: Dockerfile'lar** — `opentelemetry` pecl extension'ı **build-stage'de derle** (mevcut $PHPIZE_DEPS zaten var), runtime'a yalnız `.so` + ini; İMAJ BOYUTU build sonrası karşılaştırılır (zayıflatılmış imajı geri şişirmeme şartı — protobuf C-ext OPSİYONEL, gerekmedikçe ekleme).
- [ ] **Step 3: composer require** (container içinde koş — PHP 8.4 uyum kanıtı) + **phpstan yeşil** (repo disiplini) + mevcut test suite'i koş (test-discipline: davranış değişmiyor, yalnız bağımlılık — suite yeşil şartı).
- [ ] **Step 4: compose env blokları** — spec §4b'deki 10 env (test: `OTEL_PHP_AUTOLOAD_ENABLED=true`, `deployment.environment=test`; shtest: `=false`, `=shtest`); `OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic ${TEMPO_OTLP_AUTH}` (değer ortam .env'inde — sunuculara T5/T6'da girilir).
- [ ] **Step 5: Push** (`ops/otel-tracing`) — PR'ı KULLANICI açar; dal özeti + PR gövde taslağı rapora.

---

### Task 5: test ortamı doğrulaması (PR merge sonrası — kullanıcı kapısı)

- [ ] Steps: kullanıcı merge + CI build + test deploy TAMAMLANDIKTAN sonra: test sunucusu .env'ine `TEMPO_OTLP_AUTH` gir → api/queue yeniden başlat → gerçek istek at (test UI/health) → Grafana Explore/Tempo'da `service.name=yanginpro-api` izleri: route+PDO+Redis span'leri görünür → Loki'de trace_id'li log satırından "İze git" çalışır → queue job izi (bir job tetikle) → SQL span'lerinde bind-value YOK doğrula (varsa obfuscation aç + raporla) → 24s sonra worker RSS karşılaştır (kontrolör takip görevi) → bulgular rapora.

### Task 6: shtest kapı-açma (kullanıcı onayı sonrası)

- [ ] Steps: shtest .env'e auth + compose'da (repo zaten `=false` taşıyor) ortam-değişkeni override ile `OTEL_PHP_AUTOLOAD_ENABLED=true`... — DİKKAT: kapı repo compose'unda ortam-başına sabitlenmişti; açma = YANGINPRO repo'da tek-satır PR (shtest compose `true`) → kullanıcı merge → deploy → T5'in kısa doğrulama seti (`deployment.environment=shtest` filtreli).

### Task 7: Runbook + kapanış

- [ ] Steps: `deploy/tempo/README.md` runbook doldur (yeni servis bağlama: env bloğu şablonu; sampling değişimi: env — imajsız; disk izleme: NOC paneli zaten var; boru sorunu teşhisi: 401/404/timeout ayrımı) + ana README işaretçi + hafıza güncellemesi (kontrolör) + ledger kapanışı.

---

## Self-Review Notları
1. Spec kapsama: §2 kararlar→T1-6; §3 ortam ayrımı→T4 Step 4 + T6; §5 rollout→T sırası birebir; §6 doğrulamalar→T2/T5; §7 riskler→T4 boyut-şartı, T5 bellek/SQL adımları. Boşluk yok.
2. Keşif-değerler (Tempo sürümü/şeması, composer paketleri, NOW_NS) üreten-komutlu; TBD yok.
3. Kullanıcı kapıları: izler-DNS (T2), PR merge (T5), shtest onayı+PR (T6) — açık.
4. Tutarlılık: `izler.redwall.tr` + `TEMPO_BASICAUTH`/`TEMPO_OTLP_AUTH` adları T1↔T4; 4318/3200 port ayrımı T1↔T2↔T3.
