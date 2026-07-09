# Monitör Kurumsallaştırma Tur 2-B — Dağıtık İzleme (Tempo + YangınPro OpenTelemetry)

- **Tarih:** 2026-07-09
- **Branch:** `ops/monitor-tempo-tur2b` (redwall/monitör ayağı) + YANGINPRO reposunda ayrı dal (uygulama ayağı — kullanıcı PR akışı)
- **Kapsam:** Monitör kutusu (Tempo) + **YangınPro test (194.62.52.42) ve shtest (194.62.52.108)** — uygulama KODUNA İLK dokunuş (yalnız bağımlılık+env; iş mantığına satır yazılmaz).
- **İlgili:** Tur 1 (loglar/metrikler), Tur 2-A (SLO), `deploy/{umami,glitchtip}` kurulum deseni.

## 1. Amaç

"Bu istek neden 3sn sürdü — Traefik'te mi, PHP'de mi, SQL'de mi, Redis'te mi?" sorusunu tek ekranda yanıtlamak. Alarm (2-A) → log (Tur 1) → **iz** zinciri tamamlanır: yavaş-endpoint teşhisi dakikalara iner. YangınPro prod geldiğinde desen hazır olur (en yüksek öncelikli sistem — [[redwall-bekleyen-isler]]).

## 2. Kararlar (brainstorm'da kilitlendi)

| Karar | Seçim | Gerekçe |
|---|---|---|
| İlk uygulama | **A: YangınPro (Laravel api+queue)** — doğrudan, C-kademesiz | Prod'un provası; en yüksek teşhis değeri |
| Ortamlar | **test VE shtest İKİSİ DE kapsamda** — sıra: test doğrula → shtest | İmaj değişikliği ortak (aynı Dockerfile iki imaj hattını besler); ayrım env ile |
| Enstrümantasyon | **Yalnız auto** (ilk faz) | OTel PHP extension + Laravel auto-instr: HTTP/route, Eloquent/PDO, Redis, Guzzle, queue job — kod satırı yazılmaz. Manuel span'ler ancak ihtiyaç görülürse sonraki faz |
| Frontend | **Hariç** | API izleri oturmadan tarayıcı-tarafı gürültü olur |
| Taşıma | **izler.redwall.tr** (CF orange → Traefik basic-auth → Tempo OTLP-HTTP :4318) | loki./push. push-deseninin aynısı; hedefte inbound yok |
| Örnekleme | **%100** (test ortamları) | Düşük trafik, tam teşhis. Prod'da ayrıca kararlaştırılır |
| Saklama | Tempo yerel disk, **7 gün** | İzler hacimli; kurulum öncesi disk ölçümü şart |
| Korelasyon | Tempo datasource + **Loki derived-field** (trace_id→iz) | Log satırından tek tıkla ize atlama; Laravel loglarına trace_id otomatik enjekte |

## 3. Ortam ayrımı (SaaS + self-hosted birlikte)

- `OTEL_RESOURCE_ATTRIBUTES=deployment.environment=test` / `=shtest` (OTel standardı) — iki ortamın izleri aynı Tempo'da, Grafana'da ortam etiketiyle ayrışır ("bu yavaşlık iki ortamda da var mı?" tek sorgu).
- `OTEL_SERVICE_NAME=yanginpro-api` / `yanginpro-queue` (ortamdan bağımsız; ortam attribute'ta).
- **Aktifleştirme kapısı env'de:** `OTEL_PHP_AUTOLOAD_ENABLED=true` ortam-başına açılır — imaj ikisinde aynı olsa da test doğrulanmadan shtest'te açılmaz.

## 4. İki repo, iki iş paketi

### 4a. redwall repo — monitör ayağı (`deploy/tempo/`)
- Tempo container (en son kararlı, kurulumda doğrulanır), config: OTLP-HTTP receiver, yerel depolama, compactor `block_retention: 168h`.
- Traefik label'ları: `izler.redwall.tr`, `tls=true`, basic-auth (`TEMPO_BASICAUTH` — **`$$` bcrypt kaçış tuzağı** bilinen desen, .env'e python-literal yaz).
- Grafana: Tempo datasource + Loki datasource'una derived-field (`trace_id` regex → Tempo'ya link). **Grafana-13 sabit-uid tuzağı**: datasource uid'siz eklenir; derived-field'ın Tempo-uid referansı çalışma anında API ile enjekte edilir (import-dashboards.sh deseni).
- Kurulum öncesi: monitör kutusunda disk ölçümü (Prometheus 30g + Loki 30g yanına 7g iz sığmalı; yetmezse DUR+raporla).

### 4b. YANGINPRO repo — uygulama ayağı (kullanıcı PR akışı; phpstan+test disiplinleri geçerli)
- `docker/images/{api,queue}/Dockerfile` (+varsa scheduler ortak imajı): `opentelemetry` PHP extension (pecl; derleme bağımlılıkları build aşamasında — **imajı yeniden şişirmemeye dikkat**, yeni zayıflatılmış 12MB bağlam korunur).
- `composer require`: `open-telemetry/sdk` + `open-telemetry/exporter-otlp` + Laravel auto-instrumentation paketi (kurulumda güncel adları/sürümleri doğrulanır — hep-son-sürüm).
- `docker/test/docker-compose.yml` + `docker/shtest/docker-compose.yml` api+queue servislerine OTel env bloğu:
  `OTEL_PHP_AUTOLOAD_ENABLED`, `OTEL_SERVICE_NAME`, `OTEL_TRACES_EXPORTER=otlp`, `OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf`, `OTEL_EXPORTER_OTLP_ENDPOINT=https://izler.redwall.tr`, `OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <b64>` (secret ortam .env'inde), `OTEL_TRACES_SAMPLER=parentbased_always_on`, `OTEL_RESOURCE_ATTRIBUTES=deployment.environment=<ortam>`, `OTEL_METRICS_EXPORTER=none`, `OTEL_LOGS_EXPORTER=none` (metrik/log boruları MEVCUT kalır — yalnız iz taşınır).

## 5. Rollout sırası (artımlı)

1. **Ön koşul (kullanıcı):** Cloudflare'de `izler` A kaydı → 194.62.52.22, orange.
2. Tempo + `izler.` canlı + Grafana datasource — **sentetik iz POST'uyla** boru app'siz doğrulanır (curl/otel-cli).
3. YANGINPRO dalı: Dockerfile+composer+env (env kapısı test'te açık, shtest'te kapalı) → kullanıcı PR → CI build → test deploy.
4. Doğrulama (test): gerçek istekte route/PDO/Redis span'leri; log'daki trace_id'den ize atlama; queue job izleri; performans/bellek gözlemi.
5. shtest'te env kapısı açılır → aynı doğrulama.
6. Runbook (`deploy/tempo/README.md`: yeni servis bağlama, sampling değiştirme, disk izleme) + hafıza.

## 6. Test/doğrulama

- Sentetik iz (adım 2) + gerçek iz (adım 4) + ortam-ayrımı sorgusu (`deployment.environment` ile filtre).
- Negatif: auth'suz OTLP POST → 401; izler. yalnız POST/OTLP path'leri (UI yok).
- Queue worker bellek: 24 saat sonra worker RSS karşılaştırması (SDK sızıntı kontrolü).
- SQL span içerikleri örneklenir: hassas parametre görünmemeli (bind-values varsayılan olarak span'e girmez — doğrulanır; girerse obfuscation açılır).

## 7. Riskler

1. İmaj büyümesi/derleme (pecl) → build-stage'de derle, runtime'a yalnız .so kopyala; boyut CI'da karşılaştırılır.
2. Uzun-ömürlü queue worker'da SDK bellek davranışı → test'te 24s gözlem (adım 6).
3. Span'lerde hassas veri → doğrulama adımı (adım 6).
4. Disk → kurulum-öncesi ölçüm + 7g retention + NOC disk paneli zaten izliyor.
5. Performans ek yükü (~%1-3 beklenir) → test'te ölçülür; kabul edilemezse sampler düşürülür (env — imajsız değişiklik).
6. YANGINPRO PR süreci dış-bağımlılık → monitör ayağı (4a) bağımsız ilerler; sentetik izle doğrulanmış boru PR'ı bekler.

## 8. Kapsam dışı

Prod (desen hazır olur, kurulum prod geldiğinde) · frontend · manuel span'ler · erp/redwall uygulamaları · metrik/log borularının değişmesi · Traefik-tracing (istenirse sonra tek flag).
