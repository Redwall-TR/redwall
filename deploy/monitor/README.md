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

## Docker daemon API uyumu ( zorunlu)
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

## İşletim
- Saklama: Prometheus 30g, Loki 30g. Disk izle: `df -h /`.
- Loglar: `docker compose logs -f <servis>`.
- Güncelleme: imaj etiketini bump et → `docker compose pull && docker compose up -d`.
- **Faz 2** (hedef sunucular): `prometheus/targets/` altına `node-*.yml`/`cadvisor-*.yml` eklenir + hedeflere agent kurulur; ayrı plan.
