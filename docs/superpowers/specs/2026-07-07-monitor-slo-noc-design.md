# Monitör Kurumsallaştırma Tur 2-A — SLO Alarm + NOC Dashboard

- **Tarih:** 2026-07-07
- **Branch:** `ops/monitor-enterprise-tur1` (Tur 2 aynı monitör IaC üzerinde ilerler; PR ayrımı uygulama sırasında kararlaştırılır)
- **Kapsam:** Monitör kutusu (194.62.52.22) — Prometheus/Grafana/Kuma. Uygulama sunucularına **sıfır dokunuş**.
- **İlgili:** `deploy/monitor/`, Tur 1 (`2026-07-07-monitor-enterprise-tur1-design.md`), monitör Faz 1-3.

## 1. Amaç ve bağlam

Tur 1 tüm metrik/log/alarm borularını kurdu, ancak alarmlar **kaynak seviyesinde** (host başına disk/bellek/CPU — bir *sebep* alarmı). Bu alt-proje gözlemlenebilirliği **servis seviyesine** çıkarır: "kullanıcı acı çekiyor mu?" — yani *belirti* tabanlı SLO alarmı (Google SRE ilkesi) + tek bakışta durumu veren NOC ("tek cam") dashboard'u.

**Kilit mimari kısıt:** YangınPro production sunucuları ileride gelecek ve **en yüksek öncelikli** servisler olacak. Bu yüzden SLO tanımları **veri-güdümlü** olmalı — yeni servis eklemek "bir YAML dosyası + yeniden üret + commit" kadar kolay olmalı, elle kural çoğaltma olmamalı.

## 2. Kararlar (brainstorm'da kilitlendi)

| # | Karar | Seçim | Gerekçe |
|---|---|---|---|
| SLI kaynağı | Erişilebilirlik / başarı / gecikme sinyali | **Hibrit:** erişilebilirlik Kuma'dan, başarı-oranı + gecikme Traefik RED'den | Farklı arıza sınıflarını yakalar (blackbox + whitebox) |
| Kapsam | Hangi servisler, kademe | **2 kademe:** Tier-1 (prod, sayfalayıcı) + Tier-2 (iç/staging, yalnız uyarı) | Test ortamı gece 3'te uyandırmamalı |
| Motor | SLO/burn-rate hesabı | **Sloth** — YAML → Prometheus recording+alerting kuralları (git'te) | Endüstri-standart yöntem (Google SRE burn-rate) + veri-güdümlü + çalışma anında ekstra servis yok |
| Yönlendirme | Alarm router | **Alertmanager** → Telegram + e-posta | Native gruplama + inhibition (dedupe) + susturma; Sloth'un kanonik eşi |
| Kademe yönlendirme (5a) | Tier'a göre | Tier-1 acil (Telegram+e-posta); Tier-2 yalnız e-posta uyarı | Gürültü/sessiz-saat ayrımı |
| Gürültü (5b) | Aynı olayda çift alarm | `service` etiketiyle grupla + Kuma↔Traefik **inhibition** | Tek bildirim, iki sinyal |
| Bakım (5c) | Planlı deploy blip'i | Burn-rate multi-window blip'i doğal yutar + Alertmanager silence runbook'ta | Yanlış-pozitif önleme |

## 3. Mimari

```
SLO tanımları (YAML, elle)        Sloth (docker, tek seferlik)      Prometheus                 Alertmanager
────────────────────────────      ────────────────────────────     ────────────────           ─────────────
deploy/monitor/slo/slos/    ──▶   generate.sh                 ──▶   generated/*.rules.yml ──▶  gruplama +
  redwall-tr.yml                  (multi-window                     recording + alerting       inhibition +
  erp.yml                          multi-burn-rate üretir)          kuralları (git'te)         silence
  ...                                                                    │                          │
                                                                        ▼                          ▼
                                                              Grafana NOC dashboard        Telegram + e-posta
                                                              (recording metriklerini      (mevcut "Redwall Alarm"
                                                               okur)                         hedefleri; config
                                                                                             alertmanager.yml'de
                                                                                             tekrar tanımlı)
```

**Neden iki alarm sistemi (kabul edilen ödünç):** Tur 1'in kaynak-alarmları Grafana-managed alerting'de kalır; SLO alarmları Alertmanager'dan gider. Bu kısa vadeli bölünme kabul edildi — Alertmanager, 5b/5c gereksinimlerinin native çözümü ve Sloth'un kanonik eşi. İleride (bu turun kapsamı DIŞINDA) kaynak-alarmları da Prometheus kurallarına taşınıp tek çatı altında birleştirilebilir.

## 4. SLI sorguları (canlı metrik adlarına oturmuş)

Traefik metrikleri Tur 1'de `:8082`'de canlı ve Traefik-RED dashboard'unda doğrulanmış. Kuma `/metrics` **henüz kazınmıyor** → ön koşul (bkz. 6.1).

| SLO türü | Kaynak | Sloth SLI tipi | Sorgu (özet) |
|---|---|---|---|
| **Erişilebilirlik** | Kuma `monitor_status` | `raw` (error_ratio_query) | `1 - avg_over_time(monitor_status{monitor_name="<svc>"}[{{.window}}])` |
| **Başarı oranı** | `traefik_service_requests_total{service,code}` | `events` | total = tüm istekler; error = `code=~"5.."` |
| **Gecikme** | `traefik_service_request_duration_seconds_bucket{service,le}` | `events` | total = tüm istekler; error = 1s eşiğini aşanlar (`le="1"` kovası dışı) |

> Not: gerçek `service`/`monitor_name` etiket değerleri uygulama sırasında Prometheus/Kuma'dan doğrulanacak (Traefik servis adları `<stack>-<svc>@swarm` biçiminde olabilir; Kuma monitör adları Faz 3'te tanımlanan 10 monitör).

## 5. Servis kademeleri ve SLO hedefleri (taslak — uygulamada teyit edilir)

| Kademe | Servisler | SLO'lar | Hedef | Alarm |
|---|---|---|---|---|
| **Tier-1** | redwall.tr, erp, license, registry | erişilebilirlik + başarı (+ redwall.tr'ye gecikme) | erişilebilirlik %99.9, başarı %99.5, gecikme p95<1s | **acil** (Telegram+e-posta) |
| **Tier-2** | YP test, YP shtest, monitor, analitik, hata | yalnız erişilebilirlik | %99 | **uyarı** (yalnız e-posta) |
| **Tier-1 (gelecek)** | 🔜 YangınPro production | tam set | en yüksek öncelik | acil |

- **Pencere:** 28-günlük yuvarlanan (SRE standardı). Hata bütçesi = 1 − hedef.
- **Genişletme deseni:** yeni servis = `slos/<svc>.yml` (kademe = label), `generate.sh`, commit. Kural/dashboard elle düzenlenmez.

## 6. Bileşenler ve dosya düzeni

```
deploy/monitor/
  slo/
    slos/                    # elle yazılan kompakt SLO tanımları (gerçeğin kaynağı)
      redwall-tr.yml
      erp.yml
      license.yml
      registry.yml
      yp-test.yml
      yp-shtest.yml
      monitor-internal.yml   # monitor/analitik/hata (Tier-2)
    generated/               # Sloth çıktısı — COMMIT'li (çalışma anında sloth gerekmez)
      *.rules.yml
    generate.sh              # sloth'u docker ile çalıştırır: slos/ → generated/ ; sonra promtool check
    README.md                # runbook: yeni servis ekleme + bakım susturması
  alertmanager/
    alertmanager.yml         # route (tier→severity), group_by:[service], inhibit (kuma↔traefik), receivers (telegram+email)
    # secret'lar (bot token, SMTP parola) sunucu .env'inden env_file ile enjekte edilir; repoda literal YOK
  grafana/dashboards/
    noc.json                 # 5 bölümlü NOC dashboard
  prometheus/prometheus.yml  # + rule_files: generated/, + alerting: alertmanager, + kuma scrape job
  docker-compose.yml         # + alertmanager servisi (monitor-net), + prometheus'a --web... (gerekirse)
```

### 6.1 Prometheus değişiklikleri
- **Kuma scrape job'ı (ön koşul):** `kuma:3001/metrics`, Kuma API-key ile basic/bearer auth. Yalnız iç ağdan (monitor-net); dışa açılmaz.
- **`rule_files:`** → `/etc/prometheus/rules/*.rules.yml` (generated/ buraya mount).
- **`alerting:`** → `alertmanager:9093`.

### 6.2 Alertmanager
- İmaj: `prom/alertmanager` (son kararlı — [[redwall-hep-son-surum]], sürüm uygulama anında doğrulanır).
- `route`: `severity=page` (Tier-1) → Telegram+e-posta; `severity=ticket/warning` (Tier-2) → yalnız e-posta.
- `group_by: [service]` — çift sinyal tek bildirim (5b).
- `inhibit_rules`: Kuma "down" (erişilebilirlik) alarmı, aynı servisin Traefik başarı/gecikme alarmını bastırır (kök-neden önce; dedupe).
- `receivers`: mevcut Telegram botu (8812650503 / chat 7620610929) + SMTP (smtp.gmail.com:587, no-reply@redwall.tr → admin@redwall.tr). Secret'lar sunucu .env'inden; repoda literal yok.
- Cloudflare-ips origin sıkılaştırma deseni: Alertmanager dışa açılmaz (yalnız iç ağ) → ek panel gerekmez.

### 6.3 Sloth
- İmaj: `ghcr.io/slok/sloth` (son kararlı, doğrulanır). `generate.sh` docker ile tek seferlik çalışır; çıktı git'e commit'lenir.
- Multi-window multi-burn-rate (Google SRE) varsayılan alert şablonu; `page`/`ticket` severity label'ları Alertmanager route'una eşlenir.

### 6.4 NOC dashboard (5 bölüm)
1. **Servis sağlık ızgarası** — her servis tek renk hücre (Kuma up/down + Traefik hata oranı birleşik), kademeye göre gruplu.
2. **Hata bütçesi satırı** — Tier-1: kalan 28g hata bütçesi % + burn-rate (Sloth recording metriklerinden).
3. **Aktif SLO alarmları** — o an ateşleyen alarmlar (Alertmanager/Prometheus ALERTS metriği).
4. **Altyapı üst-satırı** — 5 sunucu CPU/disk/bellek özet ışıkları, derin dashboard'lara drill-down link.
5. **Tier-1 gecikme özeti** — p95 latency tek bakışta.
- Import: mevcut `import-dashboards.sh` deseni (datasource uid runtime enjeksiyonu — Grafana 13 sabit-uid crash tuzağı için).
- Kiosk/TV: `?kiosk&refresh=30s` URL parametreleri (yerleşik; ekstra iş yok).

## 7. Test ve doğrulama

- **Kural sözdizimi:** `generate.sh` sonunda `promtool check rules generated/*.yml`.
- **Uçtan uca sentetik ihlal:** bir test-servisini Kuma'da down'a düşür veya test-servise 5xx üret → burn-rate alarmı ateşler → Alertmanager grupla/yönlendir → Telegram+e-posta gelir → inhibition doğru mu (Kuma alarmı Traefik alarmını bastırıyor mu) → düzelt/susur. (Tur 1'deki geçici-always-firing deseninin SLO karşılığı.)
- **Gruplama/susturma:** iki sinyali aynı anda tetikle → tek gruplu bildirim geldiğini doğrula; `amtool silence` ile bakım penceresi dene.
- **NOC dashboard:** her panelin canlı veri gösterdiğini göz + `preview`/tarayıcı ile doğrula; kiosk URL'i çalışıyor mu.
- **Kısıtlar:** uygulamalara sıfır dokunuş; push modeli + no-inbound + CF-Full korunur; Alertmanager dışa açık değil.

## 8. Riskler ve tuzaklar

1. **Kuma /metrics auth:** Kuma 2.4 metrics ucu API-key ister; yanlış auth → scrape 401 (Tur 1 Loki `$$`-kaçış dersinin muadili: secret'ı .env'de literal tut, compose'da tek `$` yeme riskine dikkat).
2. **İki alarm sistemi:** Grafana (kaynak) + Alertmanager (SLO) bölünmesi bilinçli; runbook'ta "hangi alarm nereden" net yazılır.
3. **Traefik servis etiketi biçimi:** `<stack>-<svc>@swarm` gibi olabilir; SLI sorgusundaki `service=` değeri canlıdan alınır (tahmin edilmez).
4. **Sıfır-trafik körlüğü:** Traefik SLI trafik yokken sinyal vermez → erişilebilirlik SLO'su (Kuma) bu boşluğu kapatır (hibrit seçiminin sebebi).
5. **Alertmanager secret tekrarı:** Telegram/SMTP config Grafana + Alertmanager'da iki yerde; ikisi de sunucu .env'inden beslenir, repoda literal yok.
6. **generated/ commit disiplini:** `slos/` değişince `generate.sh` çalıştırılıp `generated/` yeniden commit edilmezse Prometheus eski kuralı okur → runbook + (opsiyonel) CI kontrolü.

## 9. Uygulama sırası (artımlı, bağımsız)

1. **Ön koşul:** Prometheus'a Kuma scrape job'ı → `monitor_status` Prometheus'ta görünür.
2. **Sloth iskeleti:** `slo/` dizini + 1 pilot servis (redwall.tr) YAML → `generate.sh` → `promtool check` yeşil → generated commit.
3. **Alertmanager:** compose servisi + `alertmanager.yml` (route/group/inhibit/receivers) + prometheus `alerting:` + sentetik ihlalle uçtan uca test.
4. **Kalan servisleri doldur:** Tier-1 + Tier-2 YAML'ları → yeniden üret → commit.
5. **NOC dashboard:** `noc.json` + import + göz doğrulama + kiosk.
6. **Runbook + kapanış:** README (yeni servis ekleme, bakım susturması, "hangi alarm nereden"), hafıza güncelle.

## 10. Kapsam dışı (bu tur değil)

- Tur 1 kaynak-alarmlarının Alertmanager'a taşınıp birleştirilmesi.
- Tempo/dağıtık izleme (Tur 2-B), SSO/RBAC (Tur 2-C), off-site yedek (ertelendi — kamu-verisi/egemenlik).
- YangınPro production SLO'ları (sunucular geldiğinde YAML eklenerek; desen bu turda hazırlanır).
