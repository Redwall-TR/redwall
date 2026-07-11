# Monitör Tur 3 — Eksiksizleştirme (öz-dayanıklılık + tek-çatı + tam görünürlük)

- **Tarih:** 2026-07-10 · **Branch:** `ops/monitor-tur3`
- **Hedef (kullanıcı):** "Monitör sunucusunu artık eksiksiz istiyorum" — 2026-07-10 canlı-envanter analizindeki TÜM vadeler.
- **Kapsam:** ağırlıkla monitör kutusu (194.62.52.22); K-bloğu diğer sunucularda ops-durability. Uygulama kodlarına dokunulmaz.
- **İlkeler:** [[redwall-monitor-gurultu-ilkesi]] (yalnız gerçek sinyal) + hep-son-sürüm + push/no-inbound/CF-Full korunur + bilinen tüm tuzak-dersleri geçerli.

## Kapsam blokları

**A. Öz-telemetri (Eksik #1):** Prometheus'a yerel scrape job'ları: loki, tempo, grafana, alertmanager, monitör-traefik (`:8082` metrik flag'i eklenecek — kutunun kendi Traefik'inde yok), authentik (uç/auth keşifle). Static kurallara her biri için `up==0 → page/ticket` (AM-öz-izleme dahil) + **dead-man kapılaması genişler:** `check-and-ping.sh` koşulu "Prometheus healthy" → "Prometheus VE Alertmanager healthy" (AM ölümü = bildirim kanalı ölümü → dead-man yakalar; öz-referans problemi böyle dışarıdan çözülür).

**B. Kutu logları + container-metrikleri (Eksik #2+#5):** Kutuya Alloy ajanı (mevcut `deploy/monitor/agent` deseni, `host=redwall-monitor`): docker-logları + cadvisor. **Çakışma kuralı:** kutuda node_exporter zaten var → Alloy'un unix-exporter bloğu bu kurulumdan STRIP edilir (tek kaynak ilkesi; Tur 1 tailored-config deseni). Gürültü-süzgeci bloğu dahil.

**C. Kutu-içi gece yedekleri + tazelik metriği (Eksik #3 + yeni):** Gece cron/systemd-timer: authentik-pg, umami-pg, glitchtip-pg dump'ları + kuma sqlite + grafana.db + `/opt/*` config tar'ı → `/opt/monitor-backups/` (7 gün döngü). Her başarılı yedek sonrası node_exporter **textfile-collector**'a `redwall_backup_last_success_timestamp{set="monitor-box"}` yazılır; static kural: >26 saat eski → ticket. **Prometheus/Loki/Tempo TSDB'leri yedeklenmez** (tarih verisi; kabul edilen kayıp — off-site karar sonrası ele alınır). Not: bu KUTU-İÇİ yedek — off-site egemen yedek ayrı büyük karar (kapsam dışı, aşağıda).

**D. Runtime-config reprodüksiyonu (Eksik #4):** Repoya iki script: `kuma-export.py` (API ile monitörler+bildirimler → JSON; import karşılığıyla) ve `grafana-alerts-export.sh` (alarm kuralları + bildirim politikaları API-export/import). DR runbook'una "kutu sıfırdan kurulum" bölümü. (Kuma 2FA → export API token'la okunabilir mi keşif; olmuyorsa kullanıcı-kapılı adım.)

**E. Log-tabanlı alarm (Eksik #7):** Loki **ruler** aktive (AM'a bağlar). İlk kural seti (gürültü-ilkesine sadık, az ve öz): (1) app FATAL/Uncaught patlaması (`sum by (host) rate(... |~ FATAL [5m]) > eşik` → page), (2) herhangi hosttan log akışının tamamen kesilmesi (`absent`-benzeri, host başına 15dk sıfır satır → ticket; ajan-ölümü yakalar). Kurallar repoda.

**F. Alarm tek-çatı:** Tur 1 Grafana-managed kaynak alarmları (disk %85, RAM %90, CPU %90, predict_linear-disk) Prometheus static-rules'a taşınır → Alertmanager (aynı severity/tier/service etiket sözleşmesi). Grafana'daki kopyalar silinir; `slo/README.md` "hangi alarm nereden" → **tek cevap: Alertmanager**. Grafana-managed alerting boşaltılmış olur (SMTP'si kalır — yalnız kullanılmaz).

**G. Tempo metrics_generator + servis haritası:** Tempo config'e `metrics_generator` (service-graphs + span-metrics; remote_write → Prometheus). Grafana'da servis-haritası görünümü + NOC'a "izlerden RED" mini-paneli. Disk/kardinalite notu: yalnız test+shtest izleri — düşük hacim.

**H. Kuma cert-bitiş bildirimleri (Eksik #6):** Kuma'nın yerleşik certificate-expiry bildirimi tüm HTTPS monitörlerde aktive (varsayılan eşikler 7/14/21g). API ile dene (2FA-token kısıtı) — olmazsa kullanıcı-UI adımı (tek ayar).

**I. Küçükler:** AM compose healthcheck (`wget /-/healthy`) + `chat_id`'nin `${TELEGRAM_CHAT_ID}` env'e alınması; monitör Traefik'ine `:8082` metrik flag'leri (A ile birlikte).

**J. cloudflare-ips → file-provider:** Monitör Traefik'ine `dynamic.yml` (file provider) eklenir; cloudflare-ips + authentik-fa middleware TANIMLARI oraya taşınır (kuma/authentik container'ları restart olduğunda middleware kaybolması penceresi kapanır — Tur 1 kırılganlık notu + T8'deki 404-fail-closed davranışı DEĞİŞİR: authentik ölse bile router'lar artık düşmez, forward-auth 5xx verir → yine fail-closed ama farklı kod; runbook güncellenir).

**K. Dış-durability (diğer sunucular, ops):**
1. kurumsal + yp-test/yp-shtest Traefik'lerinde `readTimeout` DEĞERLENDİRMESİ: Payload medya (kurumsal, CF-100MB sınırlı) ve YP dosya yüklemeleri (MinIO'ya mı gidiyor keşif) 60s'i aşabilir mi → aşıyorsa 30m flag'i (kurumsal: redwall `deploy/stack.yml`; yp: YANGINPRO compose — kullanıcı PR).
2. erp Traefik-metrik durability: `/opt/frappe_docker/redwall.yml` düzenlemesinin frappe-regenerate'e dayanıklı hale getirilmesi (en az: README + yeniden-uygulama scripti `/opt/redwall-mon/`e).
3. LicenseServer repo'suna readTimeout=30m işlenmesi → **kullanıcı/developer aksiyonu** (repo bizde yok; hatırlatma runbook+hafızada).

## Kapsam DIŞI (bilinçli — ayrı kararlar/projeler)
- **Off-site egemen yedek** (TR/AB hedef kararı sende — C bloğu bunun ön-koşulunu hazırlar: düzenli dump'lar taşınabilir hale gelir).
- **SSH-anahtar geçişi** (erişim-kontrol değişikliği — kural gereği sen yaparsın; yapınca hafızadaki parolalar silinir).
- **Frontend tracing** (YANGINPRO uygulama projesi — 2-B faz-2 olarak ayrıca).
- **YangınPro prod onboarding** (sunucular gelince tek oturum) · **on-call/eskalasyon** (tek kişilik ekip).

## Doğrulama felsefesi
Her blok kendi kanıt-adımıyla kapanır (bu oturumların standardı): öz-telemetri→up==1 hepsi + kasıtlı-durdurma alarmı; yedek→dosyalar + tazelik metriği + yaşlandırma testi; ruler→sentetik FATAL ile alarm; tek-çatı→eski Grafana alarm listesi BOŞ + AM'de eşdeğerleri firing-testli; file-provider→kuma restart'ında middleware ayakta; K1→ölçüm/karar belgeli. Final whole-branch review (opus) + break-glass/dead-man tatbikatlarının tekrarı (F ve A dead-man'i değiştirdiği için).

## Riskler
Loki ruler ilk kez açılıyor (config hatası Loki'yi düşürebilir → önce -config.verify/dry-run, .bak, tek restart penceresi) · F geçişinde alarm-boşluğu penceresi (önce Prometheus'ta kur-doğrula, SONRA Grafana'dakini sil) · G kardinalite (span-metrics filtreli başlar) · J, T8'de belgelenen 404-davranışını değiştirir (runbook güncellemesi zorunlu) · B'de çift-node-metrik riski (unix-strip şart) · tüm tek-dosya rsync'ler `--inplace`.
