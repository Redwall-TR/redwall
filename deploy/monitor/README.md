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

# 2) KRİTİK — Docker daemon API uyumu (bkz. "Docker daemon API uyumu" bölümü)
#    Traefik v3.3 istemcisi API 1.24 konuşur; Engine 29 min 1.40 ister → çözülmezse 404.
mkdir -p /etc/systemd/system/docker.service.d
printf '[Service]\nEnvironment="DOCKER_MIN_API_VERSION=1.24"\n' > /etc/systemd/system/docker.service.d/api-compat.conf
systemctl daemon-reload && systemctl restart docker

# 3) Firewall: yalnız SSH + HTTP/HTTPS
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable

# 4) Repoyu/deploy dizinini sunucuya al (örn. /opt/monitor)
mkdir -p /opt/monitor && cd /opt/monitor
# (deploy/monitor içeriğini buraya kopyala: git clone veya scp)

# 5) .env hazırla
cp .env.example .env && nano .env   # GF_ADMIN_PASSWORD, LOKI_BASICAUTH, SMTP_* doldur

# LOKI_BASICAUTH üretimi (DİKKAT: $ kaçışı):
#   docker run --rm httpd:2 htpasswd -nbB agent 'GUCLU_PAROLA'
#   çıktıdaki her '$' → '$$' yap, .env'e yaz. Compose env-değerini de yorumlar; tek '$'
#   ile bcrypt hash'in parçaları değişken sanılıp yenir (401). Çift '$$' → Traefik doğru
#   hash'i alır. Not: hash'i asla `source` edilen shell dosyasında tutma (yine yenir).

# 6) Ayağa kaldır
docker compose up -d
docker compose ps
```

## Docker daemon API uyumu (zorunlu)
Traefik v3.3'ün Docker provider'ı istemci API sürümü **1.24** ile konuşur. Docker Engine
29 minimum API **1.40** ister ve 1.24'ü reddeder → Traefik container label'larını okuyamaz,
hiçbir router oluşmaz, her istek **404** döner (TLS geçerli ama origin 404). Çözüm daemon
tarafında `DOCKER_MIN_API_VERSION=1.24` ile 1.24'ü yeniden etkinleştirmektir (yukarıda 2.
adım). Traefik container'ına `DOCKER_API_VERSION` env vermek bunu ÇÖZMEZ (test edildi).
Bu, redwall prod sunucusunda da uygulanan aynı uyumluluk ayarıdır.

## Doğrulama
- `https://monitor.redwall.tr` → Grafana giriş ekranı (admin / GF_ADMIN_PASSWORD).
  Connections → Data sources: **Prometheus** ve **Loki** "green/OK".
- `https://durum.redwall.tr` → Uptime Kuma ilk kurulum ekranı (admin oluştur).
- Prometheus (iç): `docker compose exec prometheus wget -qO- localhost:9090/-/healthy` → `Prometheus Server is Healthy`.
- Loki (iç): `docker compose exec loki wget -qO- localhost:3100/ready` → `ready`.
- Loki push ucu (auth): `curl -u agent:PAROLA https://loki.redwall.tr/loki/api/v1/push -XPOST -H 'Content-Type: application/json' --data '{"streams":[{"stream":{"job":"test"},"values":[["'"$(date +%s)"'000000000","merhaba"]]}]}'` → HTTP 204. Auth'suz → 401.

## Dashboard'lar (Grafana)
Hazır dashboard'lar: Node Exporter Full + cAdvisor + Redwall Loglar (`grafana/dashboards/*.json`).

**TUZAK — Grafana 13 datasource uid:** Grafana 13, `datasources.yml`'de sabit `uid`
verilince provisioning'de çöküyor ("Datasource provisioning error: data source not found",
crash-loop). Bu yüzden datasource'lar **uid'siz** (Grafana otomatik uid üretir). Dashboard'lar
da bu otomatik uid'lere bağlanmalı → **file-provisioning yerine API import** kullanılır:
```bash
GF_URL=https://monitor.redwall.tr GF_USER=admin GF_PASS=<parola> \
  deploy/monitor/grafana/import-dashboards.sh
```
Script gerçek uid'leri sorgular, dashboard JSON'larındaki placeholder ("prometheus"/"loki")
uid'leri değiştirir ve import eder. Deploy sonrası bir kez çalıştır (idempotent, overwrite).

## İşletim
- Saklama: Prometheus 30g, Loki 30g. Disk izle: `df -h /`.
- Loglar: `docker compose logs -f <servis>`.
- Güncelleme: imaj etiketini bump et → `docker compose pull && docker compose up -d`.
- **Faz 2 (hedef sunucular) — CANLI:** her hedefte Grafana Alloy ajanı (`agent/`) host+container
  metriği + docker loglarını monitör'e PUSH eder (bkz. `agent/README yok — docker-compose.yml + config.alloy`).
  Prometheus remote-write ucu: `push.redwall.tr/api/v1/write` (basic-auth). Log ucu: `loki.redwall.tr`.
- **Alarm tek-çatı (Tur 3 Task 5):** TÜM alarmlar (SLO burn-rate + meta + kaynak
  [disk/RAM/CPU/disk-predict] + kutu-yedeği tazelik) Prometheus → Alertmanager'dan
  gider. Grafana-managed alerting (Tur 1'de kaynak alarmları için kullanılıyordu)
  **emekli** — kural yok, SMTP contact-point config'i dursa da kullanılmıyor. Detay:
  `slo/README.md` (Sloth üretimi, Alertmanager yönlendirme, yeni servis ekleme,
  bakım susturması). NOC: https://monitor.redwall.tr/d/redwall-noc (kiosk: ?kiosk&refresh=30s)
- **SSO / kimlik doğrulama (Grafana/Kuma/Umami/GlitchTip tek çatı):** bkz.
  `../authentik/README.md` (break-glass, yeni kullanıcı, oturum öldürme, panel envanteri).
- **Traefik middleware'leri file-provider'da (Tur 3 Task 9 — CANLI):** `cloudflare-ips` ve
  `authentik-fa` artık container label'ında DEĞİL, `traefik/dynamic.yml`'de tanımlı (bkz.
  `docker-compose.yml`'deki `--providers.file.filename=/etc/traefik/dynamic.yml` +
  `--providers.file.watch=true`, mount `./traefik/dynamic.yml:/etc/traefik/dynamic.yml:ro`).
  Router label'ları `<ad>@file` ile referans verir. Neden: eskiden bu middleware'ler onları
  TANIMLAYAN container'ın (kuma / authentik-server) label'ında yaşıyordu — o container restart
  olunca middleware TANIMI kaybolur, referans veren TÜM router'lar (başka compose projelerinde
  olsalar bile) düşerdi (Tur 1 kırılganlık notu). Artık kuma/authentik-server restart olsa da
  BAŞKA panellerin router'ları ETKİLENMİYOR — yalnız restart olan servisin KENDİ router'ı
  (kaçınılmaz biçimde, backend container yok) kısa süre düşebilir. authentik-server durunca
  forward-auth'lu paneller artık **404 değil 5xx (bad-gateway)** döner — güncel break-glass
  açıklaması ve canlı kanıt: `../authentik/README.md` ("Break-glass" bölümü) +
  `.superpowers/sdd/task-9-report.md`.
- **Dış-sunucu durability — readTimeout + erp-metrik reapply (Tur 3 Task 10 — CANLI):**
  license sunucusundaki 286MB registry push'unun Traefik varsayılan readTimeout=60s ile
  499'la kesilmesi olayının (bkz. `redwall-traefik-readtimeout-olayi` hafızası) aynı kalıbı
  kurumsal (redwall.tr, `../stack.yml`) + yanginpro test/shtest'te de değerlendirildi:
  kurumsalda `--entrypoints.{web,websecure}.transport.respondingTimeouts.readTimeout=30m`
  canlıya uygulandı (Payload `/api/media` boyut sınırı yok, CF 100MB proxy sınırına kadar
  risk); yp test/shtest'te de aynı flag YANGINPRO reposunda ayrı dal+PR ile eklendi (dosya
  ekleri app üzerinden Traefik'ten geçiyor, MinIO'ya presigned-URL değil). ERP'de elle
  eklenen Traefik metrik-flag'lerinin frappe-regenerate'e karşı kalıcılığı için
  `exporters/reapply-traefik-metrics.sh` eklendi (bkz. `exporters/README.md` "ERP kalıcılık
  riski" bölümü). **Açık kalan (K3):** LicenseServer repo'sunda readTimeout=30m fix'i o repo
  bizde olmadığından yalnız sunucu üzerinde canlı — repo'ya (IaC olarak) işlenmesi
  kullanıcı/developer aksiyonu, LicenseServer reposuna erişim olduğunda yapılmalı. Detay +
  ölçüm ham verisi: `.superpowers/sdd/task-10-report.md`.

## Tur 3 — Eksiksizleştirme (öz-telemetri + yedek/DR + gürültü kapanışı)

Tur 3 (11 task) monitör kutusunun **kendi kendini izlemesini**, **yedeklenmesini** ve
**tek-çatı alarm modelinin** son boşluklarını kapattı. Özet — detaylar her task'ın
`.superpowers/sdd/task-<N>-report.md` dosyasında.

**Öz-telemetri mimarisi:**
- Prometheus, kendi izleme zincirini de kazıyor: `loki`/`tempo`/`grafana`/`alertmanager`/
  `traefik-monitor` job'ları (Traefik `:8082/metrics`, iç ağ, dışa açık değil). NOC'ta
  "Öz-Telemetri" paneli bu 5 job'un `up` değerini gösterir.
- Kutunun kendisi de bir Alloy ajanıyla izleniyor (`self-agent/`): cadvisor container
  metrikleri + kendi docker logları Loki'ye akıyor. Hedef-ajan (`agent/`) şablonundan
  unix-exporter bloğu çıkarıldı (node-exporter zaten ayrı container, çift-metrik önlendi).
- **Dead-man kapısı:** `deadman/check-and-ping.sh` artık Prometheus-healthy → **Alertmanager-
  healthy** → up-count kontrolü sırasıyla ilerliyor; AM ölüyse ping hiç atılmıyor (healthchecks.io
  grace penceresi devreye girer) — AM'in kendini bildirememe riski ikinci bir kanaldan kapanıyor.
- **LogAkisiKesildi deseni (T6b):** 6 hedef ajanın hepsi kendi Alloy `loki.write` bileşen
  metriğini (`loki_write_sent_entries_total`) Prometheus'a taşıyor. Kural:
  `time() - max by(instance)(max_over_time(timestamp(loki_write_sent_entries_total)[4h:1m])) > 900`
  — "rate==0" deseni DENENDİ ve ELENDİ (staleness'ta seri sessizce kaybolur, asla ateşlenmez);
  `timestamp()` alt-sorgusu doğru çalışan kanıtlı desendir. **4h sınırı:** bir ajan 4 saatten
  uzun ölü kalırsa seri alt-sorgu penceresinden düşer ve alarm kendiliğinden resolve olur
  (o noktada ticket zaten açılmış olur — solo-ops için kabul edilen sınır, tek satırla
  büyütülebilir). NOC "Ajan Akışı" paneli aynı eşiği (900sn) kullanır.
- **⚠️ Rollout tuzağı:** hedef-ajan `config.alloy`'ları repo'da ŞABLON, canlı config'ler
  host-özel (erp/license/kurumsal exporter blokları farklı). Yeni bir Alloy bloğu filoya
  yayarken ŞABLONU BASMA — canlı config'i indir, insertion-only ekle, `alloy validate` ile
  doğrula, öyle deploy et (aksi halde host-özel exporter blokları silinir).

**Yedek / restore (T4 + T8):**
- Gece 03:30 (`redwall-box-backup.timer`) `backup/box-backup.sh`: authentik/umami/glitchtip
  pg_dump, Kuma+Grafana sqlite kopyası, config-tar (`.env`/secrets HARİÇ), artık
  `dr/kuma-export.py` (Kuma monitör/bildirim/status-page JSON) ve `dr/grafana-export.sh`
  (dashboard/datasource JSON) de zincire entegre — hepsi `/opt/monitor-backups/<TS>/`.
  Başarısızlıkta (`set -euo pipefail`) tazelik metriği hiç YAZILMAZ. 7 günden eski setler
  silinir. node-exporter textfile-collector `redwall_backup_last_success_timestamp{set="monitor-box"}`
  metriğini sunar — NOC "Son Yedek" paneli bunu saat cinsine çevirip gösterir (24h yeşil,
  26h+ kırmızı).
- Restore prosedürü + Kuma `disableAuth=true` bağımlılığı (script'in login akışına ihtiyacı
  yok, ağ sınırı yeterli) + grup-parent/status-page'in elle adım olduğu: `dr/DR-runbook.md`.
- Mantıksal dump'lar (schema+data), point-in-time recovery DEĞİL. Off-site kopya backlog'da
  (MEMORY.md).

**Alarm tek-çatı (T2 + T5 + T6):** Tüm alarmlar (SLO burn-rate, meta-izleme, kaynak
[disk/RAM/CPU/disk-predict], yedek-tazelik, log-tabanlı [`AppHataFirtinasi`,
`LogAkisiKesildi`]) TEK kanaldan — Prometheus/Loki-ruler → Alertmanager. Grafana-managed
alerting emekli (kural yok). Detay: `slo/README.md`.

**Traefik file-provider (T9):** `cloudflare-ips` ve `authentik-fa` middleware'leri artık
`traefik/dynamic.yml`'de tanımlı, herhangi bir container'ın label'ına bağlı DEĞİL — o
container (kuma/authentik-server) restart olsa da BAŞKA panellerin router'ları düşmüyor
(yalnız restart olanın KENDİ router'ı, backend yokluğundan kaçınılmaz biçimde, ~0.4-0.5s
etkilenebilir). authentik-server durunca forward-auth'lu paneller **404 değil 5xx** döner
(fail-closed sürüyor, auth atlanmıyor). Detay + canlı kanıt: `../authentik/README.md`
("Break-glass") + `.superpowers/sdd/task-9-report.md`.

**Bilinen-iyi durum (2026-07-11 canlı ölçüm, Tur 3 kapanışı):** 34/34 scrape serisi
`up==1` (14 job — loki/tempo/grafana/alertmanager/traefik-monitor/kuma/node/prometheus/
cadvisor×6/unix×5/mysql/postgres×4/redis×5/traefik×5), 49 alerting kuralının tamamı
`inactive`/`health:ok`, Alertmanager'da 0 aktif alarm, Loki ruler kuralı yüklü
(`AppHataFirtinasi`), son 1h'ta 6/6 host'tan log akışı, Tempo generator metrikleri
artıyor (10dk'da ~22K `traces_spanmetrics_calls_total` artışı), yedek zinciri <1h taze,
timer sıradaki koşuya kilitli, kutu RAM %34 kullanım / disk %31 kullanım (45G boş,
Tur 3 başından beri stabil). Bilinen, çözülmeyen gürültü: cadvisor `rootDiskErr`
(self-agent'ta, T3'ten beri — container metrikleri etkilenmiyor, crash-loop yok);
yeni bir gürültü sınıfı gözlenmedi.
