# DR Runbook — Monitör Kutusu (194.62.52.22) Sıfırdan Kurulum

Kapsam: bu sunucuda çalışan TÜM servisler — Traefik + Grafana + Prometheus + Loki +
Alertmanager + Uptime Kuma + node-exporter + self-agent (monitör kutusunun kendi
telemetrisi) ve aynı kutudaki Authentik (SSO), Umami (analytics), GlitchTip (hata
takibi), Tempo (iz/trace). Senaryo: sunucu tamamen kaybedildi (disk arızası, yanlışlıkla
silme, sağlayıcı sorunu) — yeni bir VDS'te sıfırdan kurulum.

Önkoşul: nightly `box-backup.sh` çıktısı elde — en az bir `/opt/monitor-backups/<TS>/`
seti (bkz. `backup/box-backup.sh`) off-site bir yere kopyalanmış olmalı (bu kutunun
KENDİ diskinde tutulan yedek, disk kaybında işe yaramaz — bkz. `backup/README.md`
"off-site yedek" backlog notu). Bu runbook, o setin ELİNİZDE olduğunu varsayar.

---

## Adım 0 — Ön koşullar (yeni sunucu)

1. DNS (Cloudflare, turuncu/proxied) kayıtları yeni sunucu IP'sine güncellenir:
   `monitor`, `durum`, `loki`, `izler`, `auth`, `analitik`, `hata` (+ varsa diğerleri).
2. Cloudflare SSL: zone geneli "Full" (redwall.tr) — DEĞİŞTİRME, zaten böyle.
3. Docker Engine + compose plugin kur, `DOCKER_MIN_API_VERSION=1.24` uyumluluğunu uygula
   (bkz. `../README.md` "Docker daemon API uyumu" — Traefik v3.x + Engine 29 zorunlu adım).
4. Firewall: yalnız 22/80/443.
5. Repoyu sunucuya çek: `git clone` veya off-site yedekten `deploy/` ağacını kopyala.

## Adım 1 — Dizin iskeleti + compose'ları yerleştir

```bash
mkdir -p /opt/{monitor,authentik,umami,glitchtip,tempo}
cp -r deploy/monitor/*      /opt/monitor/
cp -r deploy/authentik/*    /opt/authentik/
cp -r deploy/umami/*        /opt/umami/
cp -r deploy/glitchtip/*    /opt/glitchtip/
cp -r deploy/tempo/*        /opt/tempo/
```

Bring-up SIRASI önemli: `monitor` önce ayağa kalkmalı (paylaşılan `monitor_monitor-net`
ağını o oluşturur — diğerlerinin compose'ları bu ağı `external: true` referanslar).

## Adım 2 — `.env` dosyaları + secret'lar YENİDEN ÜRETİLİR

Hiçbir `.env`/`secrets/` dosyası config.tar.gz içinde YOK (box-backup.sh bilinçli olarak
`--exclude='.env' --exclude='secrets'` uygular — bkz. `backup/box-backup.sh` yorumu).
Bunlar elle/parola-yöneticisinden yeniden girilir:

| Dosya | Kaynak |
|---|---|
| `/opt/monitor/.env` | `.env.example`'dan kopya. `GF_ADMIN_PASSWORD` yeni güçlü parola. `LOKI_BASICAUTH`/`PROM_BASICAUTH` → `htpasswd -nbB agent 'PAROLA'` (her `$`→`$$`, bkz. README). `SMTP_*` gmail app-password. `GF_OAUTH_CLIENT_ID/SECRET` → Authentik'te "grafana" provider'ı YENİDEN kurulduktan SONRA doldurulur (Adım 4). `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` → Alertmanager page-kanalı; **`docker compose up` ÖNCESİ dolu olmalı** (boş kalırsa Telegram bildirimleri sessizce kırık başlar). |
| `/opt/monitor/secrets/alertmanager/smtp_password` | Gmail app-password (tek satır, newline yok). |
| `/opt/monitor/secrets/alertmanager/telegram_bot_token` | Telegram bot token (BotFather). |
| `/opt/monitor/secrets/prometheus/kuma_api_key` | Kuma ayağa kalktıktan SONRA panelden (Settings→API Keys) yeni key üret, buraya yaz (Adım 5 sonrası). |
| `/opt/authentik/.env`, `/opt/umami/.env`, `/opt/glitchtip/.env`, `/opt/tempo/.env` | İlgili `.env.example`'dan; `openssl rand -hex 32` ile secret key'ler (bkz. her servisin kendi README'si). |

Parolaların GERÇEK değerleri bu runbook'ta YOKTUR — operatörün parola yöneticisinden/
hafızasından alması gerekir (bkz. proje hafızası "Sunucu erişim" notu, yalnız yetkili
operatörde).

## Adım 3 — Servisleri ayağa kaldır

```bash
cd /opt/monitor    && docker compose up -d   # önce — monitor_monitor-net'i oluşturur
cd /opt/authentik  && docker compose up -d
cd /opt/umami      && docker compose up -d
cd /opt/glitchtip  && docker compose up -d
cd /opt/tempo      && docker compose up -d
```

`docker compose ps` her stack'te tüm container'ların `running`/`healthy` olduğunu
doğrulayın. Bu noktada Postgres/sqlite'lar BOŞ (taze şema) — veri Adım 4'te gelir.

## Adım 4 — Veri restore (pg_dump + sqlite)

Yedek setinden ($BACKUP/<TS>/):

```bash
BACKUP=/path/to/restored/opt/monitor-backups/<TS>

# Postgres'ler (her DB için: konteynerin YENİ boş DB'sine restore)
gunzip -c "$BACKUP/authentik-db.sql.gz" | docker exec -i authentik-authentik-db-1 psql -U authentik authentik
gunzip -c "$BACKUP/umami-db.sql.gz"     | docker exec -i umami-umami-db-1         psql -U umami umami
gunzip -c "$BACKUP/glitchtip-db.sql.gz" | docker exec -i glitchtip-glitchtip-db-1 psql -U glitchtip glitchtip

# Kuma sqlite (container DURDURULMALI — canlı yazarken dosya değiştirilmez)
docker compose -f /opt/monitor/docker-compose.yml stop uptime-kuma
gunzip -c "$BACKUP/kuma.db.gz" > /tmp/kuma.db
docker cp /tmp/kuma.db monitor-uptime-kuma-1:/app/data/kuma.db
docker compose -f /opt/monitor/docker-compose.yml start uptime-kuma

# Grafana sqlite (aynı desen)
docker compose -f /opt/monitor/docker-compose.yml stop grafana
gunzip -c "$BACKUP/grafana.db.gz" > /tmp/grafana.db
docker cp /tmp/grafana.db monitor-grafana-1:/var/lib/grafana/grafana.db
docker compose -f /opt/monitor/docker-compose.yml start grafana
```

Bu adım BAŞARILI olduysa Kuma/Grafana zaten TÜM eski haliyle (monitörler, cert-expiry
bayrakları, dashboard'lar, kullanıcılar) geri gelir — Adım 5'teki JSON-import'a GEREK
YOKTUR. `kuma-config.json`/`grafana-config.json` bu senaryoda yalnız DOĞRULAMA için
kullanılır (Adım 6).

## Adım 5 — YALNIZ sqlite dosyası da kayıpsa: JSON'dan geri yükle

Nadir senaryo (sqlite dosyası bozuk/eksik ama JSON export'lar sağlam). Bu durumda
Kuma/Grafana'yı BOŞ haliyle bırakıp config'i script'lerle yeniden kurun:

```bash
# Kuma: monitör + bildirim geri yükle (status-page HARİÇ — aşağıda elle)
docker run --rm --network monitor_monitor-net \
  -v /opt/monitor/dr/kuma-export.py:/kuma-export.py:ro \
  -v "$BACKUP":/backup:ro \
  python:3.12-slim bash -c \
    "pip install --quiet 'python-socketio[client]' && \
     python3 /kuma-export.py import --input /backup/kuma-config.json"
```

**Sınırlamalar (script çıktısında da uyarı olarak basılır):**
- İSİM eşleşen monitör/bildirim ATLANIR (idempotent — iki kez çalıştırmak güvenli).
- Grup-içi monitörlerin **parent bağı** import sonrası ELLE kurulmalı (Kuma panelinde
  monitörü aç → Grup alanından eskisi gibi ata) — yeni ID'ler eskiyle örtüşmediği için
  script bunu otomatik yapamıyor.
- **Status-page** import EDİLMEZ (tek status-page var, düşük karmaşıklık) — panelden
  elle yeniden oluşturun; hangi monitörlerin hangi sırada olduğu
  `kuma-config.json`'daki `statusPages` alanında referans olarak durur.
- Cert-expiry bayrağı import edilen monitörlerde KORUNUR (JSON'da zaten `true` olarak
  duruyorsa) — yine de Adım 6'daki doğrulamayı çalıştırın.

Grafana tarafında JSON-import GEREKMEZ: dashboard'lar zaten repo'da JSON olarak duruyor
(`deploy/monitor/grafana/dashboards/*.json`) — sıfırdan kurulum zaten şunu çalıştırır:

```bash
GF_URL=https://monitor.redwall.tr GF_USER=admin GF_PASS=<yeni-parola> \
  deploy/monitor/grafana/import-dashboards.sh
```

`grafana-config.json` yalnız "canlıda panelden elle eklenmiş, repo'da olmayan" bir
dashboard var mıydı diye KARŞILAŞTIRMA için kullanılır (elle diff, otomatik import yok —
bkz. script başındaki "Geri yön" notu).

## Adım 6 — Doğrulama

- `https://monitor.redwall.tr` → Grafana girişi; Connections → Data sources: Prometheus
  + Loki + Tempo "green/OK" (3 datasource, bkz. `grafana-config.json.counts.datasources`).
- `https://durum.redwall.tr` → Kuma paneli, monitör sayısı `kuma-config.json.counts.monitors`
  ile eşleşiyor mu kontrol et.
- Cert-expiry doğrulaması (bu görevin asıl konusu):
  ```bash
  docker run --rm --network monitor_monitor-net \
    -v /opt/monitor/dr/kuma-export.py:/kuma-export.py:ro \
    python:3.12-slim bash -c \
      "pip install --quiet 'python-socketio[client]' && python3 /kuma-export.py export --enable-cert-expiry --output /tmp/verify.json"
  ```
  Çıktıda `cert-expiry özet: ... başarısız=0` olmalı. `--enable-cert-expiry` idempotent —
  zaten açık olanları atlar, yalnız eksikleri açar.
- Prometheus (iç): `docker compose exec prometheus wget -qO- localhost:9090/-/healthy`.
- Loki (iç): `docker compose exec loki wget -qO- localhost:3100/ready`.
- Alertmanager: `docker compose exec alertmanager wget -qO- localhost:9093/-/healthy`.
- Telegram/SMTP bildirim testi: Kuma panelinde bir bildirime "Test" bas — gerçek mesaj
  gelmeli (secret'lar Adım 2'de doğru girildiyse çalışır).
- `deploy/monitor/slo/generate.sh` çalıştırılıp SLO kurallarının yeniden üretildiğinden
  emin olun (Sloth kaynak `slos/*.yml` repoda duruyor, `generated/` çıktı — sqlite'a
  bağlı değil, taze kurulumda sıfırdan üretilmesi gerekir).
- `redwall-deadman` + `redwall-box-backup` systemd timer'ları yeniden kurulup
  etkinleştirilmeli (`deadman/`, `backup/` dizinlerindeki `.service`/`.timer`
  dosyaları `systemctl enable --now`).

## Adım 7 — box-backup.sh'i yeniden zamanla

```bash
cp /opt/monitor/backup/redwall-box-backup.service /opt/monitor/backup/redwall-box-backup.timer \
  /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now redwall-box-backup.timer
```

Bu, gece yedeğini (pg_dump + sqlite + `kuma-export.py`/`grafana-export.sh` JSON'ları +
config-tar) yeniden başlatır — DR sonrası kutunun kendisi de bir sonraki felakete karşı
hemen korumaya girer.

---

## Notlar

- **disableAuth bağımlılığı:** `kuma-export.py`, Kuma'nın `disableAuth=true` ayarına
  (Authentik forward-auth'a güvenerek Kuma'nın kendi login'inin kapalı olması) dayanır —
  bkz. script başındaki KİMLİK DOĞRULAMA notu. Restore edilen `kuma.db` bu ayarı da
  taşır, ekstra adım gerekmez. Sıfırdan kurulan bir Kuma'da (Adım 5 senaryosu) ilk
  kurulum sihirbazından SONRA Settings → Security → "Disable Auth" AÇIN, yoksa script
  login'in `tokenRequired` engeline takılır (2FA/parola desteklemiyor, bkz. script başı).
- **Neden JSON export DEĞİL sqlite restore birincil yol:** sqlite `.backup` ile alınan
  kopya birebir aynı veri (heartbeat geçmişi, kullanıcı hesabı, 2FA secret'ı dahil) —
  JSON export bunların hiçbirini taşımaz (yalnız config). JSON, sqlite kaybolduğunda
  bir "ikinci şans"tır, birincil DR yolu DEĞİLDİR.
