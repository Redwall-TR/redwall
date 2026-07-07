# Monitör Kurumsallaştırma — Tur 1 Tasarım

**Tarih:** 2026-07-07
**Repo:** redwall (`deploy/monitor/` IaC)
**Amaç:** Mevcut monitör yığınının (Grafana13 + Prometheus3 + Loki + Uptime Kuma + Alloy ajanları) üstüne **görünürlük + dayanıklılık + güvenlik** boşluklarını kapatan üç bileşen eklemek. Kurumsal/profesyonel seviyeye taşımanın 1. turu.

## Bağlam (mevcut, CANLI)
Monitör hub `194.62.52.22` (düz docker compose, `/opt/monitor`): Traefik v3.7.6 + Grafana 13.1.0 + Prometheus v3.13.0 (30g) + Loki 3.7.3 (720h) + Uptime Kuma 2.4.0. 5 hedefte (erp 194.62.52.66, kurumsal 194.62.52.14, license 194.62.52.24, yanginpro-test 194.62.52.42, yanginpro-shtest 194.62.52.108) **Grafana Alloy** ajanı → node + cadvisor metrikleri (remote_write `push.redwall.tr`) + docker logları (`loki.redwall.tr`). **PUSH modeli** (hedeflerde inbound port/ufw'ye dokunulmaz). Alarmlar: Grafana (disk/bellek/cpu eşiği) + Kuma (up/down) → Telegram + e-posta. CF "Full" (Traefik self-signed, `tls=true`). Detay: [[redwall-monitor-sunucusu]] / `2026-07-05-monitor-sunucusu-design.md`.

## Mimari ilkesi (değişmez kısıt)
**Push modeli korunur.** Her yeni exporter hedef sunucuda **yerel** çalışır; oradaki **Alloy ajanı localhost'tan kazır** ve Prometheus'a remote_write eder. **Hiçbir hedefte yeni inbound port/ufw açılmaz.** IaC `deploy/monitor/` (ajan tarafı `deploy/monitor/agent/`). Rollout kontrollü SSH, sunucu sunucu, geri-alınabilir.

## Kapsam
Üç bağımsız bileşen (artımlı, birbirini beklemez). Sıra: **1 (metrik) → 3 (sıkılaştırma+alarm) → 2 (dead-man).**

### Bileşen 1 — Uygulama/DB metrikleri
Şu an yalnız altyapı (node/cadvisor) görülüyor; uygulama sağlığı görülmüyor. Üç kaynak eklenir:

**1a. Traefik Prometheus metrikleri.** Traefik olan her sunucuda Prometheus metrikleri açılır (`--metrics.prometheus=true` + ayrı `metrics` entrypoint, ör. `:8082`). Alloy yereldeki `/metrics`'i kazır. Sonuç: her router için **RED** — istek hızı, gecikme histogramı (p50/p95/p99), HTTP durum sınıfı (2xx/4xx/5xx). Traefik matrisi (planda birebir doğrulanacak): monitör (v3.7.6), license (v2.11, bu oturumda geçildi), yanginpro-test/shtest (v2.11), kurumsal (Swarm+Traefik). ERP'de Traefik varsa dahil.

**1b. postgres_exporter.** Postgres olan her sunucuda `prometheuscommunity/postgres-exporter` container'ı (ajan compose'una eklenir), **salt-okuma `pg_monitor` rolüyle** bağlanır. Beklenen matris: erp, license, kurumsal (Payload), yanginpro-test, yanginpro-shtest. Metrikler: bağlantı sayısı/doygunluk, aktif/idle-in-transaction, en yavaş sorgular (`pg_stat_statements` varsa), tablo/indeks boyutu + şişme, kilitler, replikasyon gecikmesi, cache hit oranı.

**1c. redis_exporter.** Redis olan sunucularda `oliver006/redis_exporter`. Beklenen: license (redis:8), yanginpro-test/shtest (Laravel), varsa erp/kurumsal. Metrikler: bellek kullanımı/maxmemory, hit-rate, bağlı istemci, komut oranı, evict/expire, kuyruk (Laravel queue) derinliği.

**Dashboard'lar:** Traefik-RED + PostgreSQL + Redis. Kanıtlı community dashboard'ları uyarlayıp `grafana/import-dashboards.sh` ile API-import (node/cadvisor deseni; Grafana 13 sabit-uid crash tuzağından kaçınmak için — bkz [[redwall-monitor-sunucusu]]).

**DB kimlik/rol:** Her Postgres'te `CREATE ROLE monitoring LOGIN PASSWORD '…'; GRANT pg_monitor TO monitoring;` — yalnız izleme, veri/şema DEĞİŞMEZ. YangınPro test/shtest dahil (kullanıcı onayladı; "dokunma" kısıtı bu non-destructive ölçüde esnetildi). YangınPro **MinIO'ya DOKUNULMAZ**. Rol parolaları hedef sunucu ajan-`.env`'inde (600), commit edilmez.

### Bileşen 2 — Dead-man's switch (healthchecks.io)
Monitör sunucusu tek nokta arıza; çökerse kör kalınır ve haber alınmaz. Bağımsız dış heartbeat:
- **healthchecks.io** (ücretsiz hosted) üzerinde tek "check"; bildirim healthchecks tarafında (e-posta ve/veya Telegram). Ping URL bir "secret" (monitör `.env`, 600).
- Monitör host'unda **sağlık-kapılı** cron/systemd-timer (her 1 dk): önce izlemenin GERÇEKTEN çalıştığını doğrular (Prometheus `/-/healthy` + son N dakikada taze örnek geldiğini `up` sorgusuyla kontrol), sağlıklıysa ping atar; değilse ATMAZ. Kutu ölürse VEYA Prometheus kazımayı durdurursa ping kesilir → healthchecks.io grace süresi sonunda uyarır.
- **Neden veri-egemenliği sorunu değil:** healthchecks'e yalnızca içeriksiz bir "hayattayım" ping'i gider; hiçbir kamu/uygulama verisi çıkmaz.

### Bileşen 3 — Origin sıkılaştırma + akıllı disk alarmı
**3a. cloudflare-ips allowlist (monitör Traefik v3).** License sunucusundaki deseni monitör Traefik'ine uyarla: `ipallowlist` middleware (CF IPv4+IPv6 aralıkları) tanımlanır ve insan-panellerine (`monitor`, `durum`, `analitik`, `hata`) uygulanır → origin'e yalnız Cloudflare ulaşır, doğrudan-IP erişimi 403. `loki`/`push` uçları zaten basic-auth'lu; ajanların CF üzerinden geçtiği doğrulandıktan sonra allowlist oraya da genişletilir (derinlik-savunma). CF SSL "Full" ayarına DOKUNULMAZ. Traefik v3 `ipallowlist` sözdizimi kullanılır (v2 `ipwhitelist` değil).

**3b. predict_linear disk alarmı.** Mevcut statik "%85 disk" alarmı gürültülü + geç. Ek Grafana kuralı: `predict_linear(node_filesystem_avail_bytes{mountpoint="/"}[6h], 4*3600) < 0` → "disk ~4 saat içinde dolacak" (önden, eyleme geçirilebilir uyarı). Statik %85 **yedek/backstop** olarak KALIR. Aynı grup/bildirim politikası (Telegram+e-posta).

## Kapsam DIŞI (bilinçli)
- **Off-site yedek** — bu turdan ÇIKARILDI. 🔴 **Kamu-verisi kısıtı**: yabancı buluta (R2/B2/S3) gidemez. İleride ayrı tur: kullanıcının kontrolündeki TR/AB egemen çözüm (ayrı yedek sunucusu farklı DC + yerli object storage birlikte).
- Tempo (dağıtık izleme), SSO/RBAC, SLO alarm, sentetik izleme, sır yönetimi, on-call/eskalasyon → **Tur 2**.
- YangınPro production izleme (henüz yok).

## Doğrulama (bileşen bazında)
- **1:** Her exporter metriği Prometheus'ta görünür (`up{job=…}=1` + örnek metrikler); Traefik-RED/PostgreSQL/Redis dashboard'ları dolu; DB rolü yalnız `pg_monitor` (veri/şema değişmedi doğrulanır).
- **2:** Ping akıyor (healthchecks "up"); ping'i elle durdurunca grace sonrası healthchecks uyarısı geliyor (test edilir, sonra geri açılır); Prometheus'u durdurunca ping kesiliyor (sağlık-kapı çalışıyor).
- **3:** Doğrudan origin'e curl (CF baypas) → 403; CF üzerinden panel erişimi çalışıyor; ajan push'ları kesintisiz; predict_linear kuralı sentetikle ateşliyor.

## Rollout + geri-alma
Kontrollü SSH, sunucu sunucu. Her exporter eklemesi ajan compose'una (`docker compose up -d`) — mevcut ajanı bozmadan. Sorunda: exporter container'ı kaldır / rol'ü DROP / middleware label'ını geri al. Push modeli değişmediği için hedeflerin ağ/güvenlik yüzeyi aynı kalır.

## IaC
Tümü `deploy/monitor/` altında: ajan compose + exporter tanımları (`agent/`), yeni dashboard JSON'ları (`grafana/dashboards/`), import script güncellemesi, Traefik middleware (monitör compose), dead-man script + timer, Grafana alarm kuralı. PR kullanıcı açar.
