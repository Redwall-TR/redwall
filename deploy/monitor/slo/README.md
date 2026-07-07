# SLO Alarm Sistemi — deploy/monitor/slo

Spec: `docs/superpowers/specs/2026-07-07-monitor-slo-noc-design.md`
Mimari: `slos/*.yml` (elle) → `generate.sh` (Sloth v0.16.0, `--default-slo-period=28d`)
→ `generated/*.rules.yml` (git'te — sunucuda Sloth GEREKMEZ)
→ Prometheus → Alertmanager → Telegram + e-posta. `static/` = elle yazılmış meta-monitoring
(watchdog / Kuma-scrape-öldü gibi "izleyeni izleyen" kurallar).

## Hangi alarm nereden? (iki sistem — bilinçli ayrım)

| Sistem | Ne için | Kanal |
|---|---|---|
| **Grafana-managed** (Tur 1) | KAYNAK alarmları: disk %85, RAM %90, CPU %90, disk-predict (`predict_linear`) | Grafana contact point (e-posta) |
| **Alertmanager** (bu dizin) | SLO burn-rate + meta alarmları | Aşağıdaki yönlendirme |

Alertmanager yönlendirme (`alertmanager/alertmanager.yml`):
- `tier="2"` → **her zaman yalnız e-posta** (severity fark etmez).
- `severity="page"` (Tier-1) → **Telegram + e-posta** (`urgent` receiver).
- `severity="ticket"` → e-posta.
- `group_by: [service]` → aynı servisin çift sinyali (Kuma + Traefik) TEK bildirim.
- Inhibit: `category="availability"` FIRING iken aynı servisin `success|latency` alarmları
  bastırılır (site zaten DOWN'ken "5xx yüksek" gürültüsü olmaz).

## Envanter (2026-07 kurulumu)

**13 servis SLO'lu** — 4 Tier-1, 9 Tier-2:
- **Tier-1:** `redwall-tr` (tam set: availability + success + latency),
  `erp` ve `license` (availability + success), `registry` (yalnız availability).
- **Tier-2 (yalnız availability, %99):** `analitik`, `durum`, `hata` (GlitchTip), `loki`,
  `monitor`, `yp-test`, `yp-test-api`, `yp-shtest`, `yp-shtest-api`.

Kuma'da **18 monitör** var ama SLO'ya yalnız servis başına **TEK birincil monitör** girer —
grup ve health-endpoint monitörleri (örn. "Kurumsal Health") SLO'ya GİRMEZ.

## Yeni servis ekleme (ör. YangınPro production geldiğinde)

1. **Kuma'da monitör oluştur** (UI veya Tur 1 python deseni — bkz. tuzak #4).
2. **`monitor_name`'i keşfet.** Kuma monitör adları İNSAN-DOSTU TÜRKÇE
   ("Resmi Web Sitesi" = redwall.tr gibi) — adı tahmin ETME, `monitor_url` etiketinden eşle:
   ```promql
   monitor_status{monitor_url=~".*yeni-servis.*"}
   ```
   Dönen serinin `monitor_name` etiketini SLO dosyasına yaz.
3. **`slos/<ad>.yml` yaz** — mevcut bir dosyayı kopyala (Tier-2 için `durum.yml`,
   Tier-1 için `erp.yml`/`redwall-tr.yml`); `service`/`tier`/`objective`/`monitor_name`
   değiştir. Traefik SLI'sı da olacaksa seçici **instance-KAPSAMLI olmalı** — aynı servis
   adı birden çok sunucuda olabilir (örn. `frontend@docker` 3 instance'ta var):
   ```promql
   # keşif: hangi instance + service?
   sum by(instance, service)(rate(traefik_service_requests_total[30m]))
   # SLI deseni: {instance="redwall-erp",service="frontend@docker"}
   ```
4. `./generate.sh` (üretir + promtool doğrular; hata varsa deploy ETME).
5. `git commit`; `rsync -av deploy/monitor/slo/ root@194.62.52.22:/opt/monitor/slo/`
   (dizin-mount olduğu için normal rsync yeter — tek-dosya bind-mount tuzağı için bkz. tuzak #2).
6. Prometheus reload:
   ```bash
   docker compose exec prometheus wget -qO- --post-data="" http://localhost:9090/-/reload
   ```
7. Doğrula: `sloth_slo_info{sloth_service="<ad>"}` Prometheus'ta görünür.

## Bakım susturması (planlı deploy)

Kısa blip'leri multi-window burn-rate zaten yutar. Uzun bakım için:
```bash
docker compose exec alertmanager amtool silence add service=<ad> --duration=1h \
  --comment="planlı bakım" --author="<kim>"
# Listeleme: amtool silence query        Silme: amtool silence expire <id>
```

## 28-gün SLO gözden geçirmesi (ilk pencere: ~2026-08-04)

Her SLO için ölçülen performansa bak (NOC hata bütçesi paneli —
https://monitor.redwall.tr/d/redwall-noc):
- Bütçe hep ~%100 → hedef sıkılaştırılabilir (ör. Tier-1 avail 99.5 → 99.9).
- Bütçe sahte-tetiklenmelerle eriyor (düşük trafik) → o servisin success SLO'sunu
  ticket'a indir veya avail-only yap.
- Değişiklik = `slos/*.yml` düzenle → `./generate.sh` → commit → rsync → reload.

## Test edildi

- **2026-07-07:** sentetik ihlal (slo-e2e-test) → page alarmı → Telegram + e-posta
  FIRING ve RESOLVED teslim edildi (kullanıcı onaylı).
- Kuma monitörleri runtime'da (API ile) kurulur — DB'de yaşar, repoda üretme scripti yok
  (Tur 1 ile aynı yaklaşım). Kuma API key: `/opt/monitor/secrets/prometheus/kuma_api_key`.

## Uygulamada öğrenilen tuzaklar

1. **Secret dosya sahipliği:** prometheus ve alertmanager container'ları `nobody`
   (65534) çalışır → `/opt/monitor/secrets/**` dosyaları `chown 65534:65534` ister;
   `root:root` + 600 bırakılırsa **permission denied**. Restart'ta chown yarışı
   görülebilir (Alertmanager 7 retry sonrası kendine geldi — panik yapma, bekle).
2. **TEK-DOSYA bind-mount rsync inode tuzağı:** `prometheus.yml`, `alertmanager.yml`,
   `docker-compose.yml` tek-dosya mount. Normal rsync **yeni inode** üretir → container
   ESKİ dosyayı okumaya devam eder, reload no-op olur. Çözüm: `rsync --inplace`.
   Dizin-mount'lar (`slo/generated` gibi) etkilenmez — yeni kural dosyasında reload yeter.
3. **Alertmanager teslim kanıtı:** ilk-denemede başarılı notify yalnız DEBUG log
   seviyesinde görünür → "log'da yok" ≠ "gönderilmedi". Kanıt için
   `alertmanager_notifications_total` / `alertmanager_notifications_failed_total`
   metriklerini veya nflog'u kullan. Log bakacaksan `docker logs <container>` tercih et
   (`docker compose logs` güvenilmez görüldü).
4. **Kuma otomasyonu (monitör ekleme):** 2FA açıkken python `api.login()` TOTP ister —
   API key YALNIZ `/metrics` ucunu açar, monitör CRUD yapamaz. Monitör eklemek gerekirse:
   geçici 2FA kapat (kullanıcı yapar) veya UI'dan elle. Kuma 2.4'te `conditions`
   NOT NULL hatası bypass'ı: `_build_monitor_data` + `data["conditions"] = []` +
   `_call("add", data)`.
5. **node-exporter köprü-ağda:** `node_network_*` metrikleri veth arayüzlerini gösterir
   (host NIC'i değil). NOC yalnız CPU/RAM/disk kullandığı için etkisiz — ağ paneli
   ekleyeceksen bunu bil.
6. **Prometheus staleness:** silinen Kuma monitörünün serisi ~5 dk "hayalet" kalır —
   temizlik doğrulamasında Prometheus sorgusunu değil **Kuma API'yi esas al**.
