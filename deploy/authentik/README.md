# Authentik SSO — Ops Sunucu Kurulumu

Redwall'un 4 iç panelini (Grafana, Uptime Kuma, GlitchTip, Traefik dashboard vb.) tek bir
merkezi kimlik doğrulama katmanının arkasına toplayan self-hosted SSO. Bu, **monitör/ops
sunucusunda** (194.62.52.22, Traefik + monitor_monitor-net ile birlikte) çalışır — redwall
web VDS'inde DEĞİL.

## Ön koşullar
1. **DNS (Cloudflare, turuncu/proxied):** `auth` A kaydı → ops sunucu IP'si.
2. **Cloudflare SSL:** zone geneli "Full" (redwall.tr). Monitör deseniyle aynı — ACME/Let's
   Encrypt YOK, Traefik self-signed cert sunar (`tls=true`).
3. Sunucuda Docker Engine + compose plugin kurulu (monitör hub kurulumuyla aynı — bkz.
   `deploy/monitor/README.md`).
4. `monitor_monitor-net` ağı zaten var olmalı (monitör hub'ı ile paylaşılır).

## Kurulum
```bash
# 1) Deploy dizinini sunucuya al (örn. /opt/authentik)
mkdir -p /opt/authentik && cd /opt/authentik
# (deploy/authentik içeriğini buraya kopyala: git clone veya scp)

# 2) .env üret
cp .env.example .env && nano .env
# AUTHENTIK_SECRET_KEY, AUTHENTIK_PG_PASSWORD, AUTHENTIK_BOOTSTRAP_PASSWORD,
# AUTHENTIK_BOOTSTRAP_TOKEN → openssl rand -base64 36 ile güçlü değerler üret.
chmod 600 .env

# 3) Ayağa kaldır
docker compose up -d
docker compose ps
```

İlk boot sonrası `https://auth.redwall.tr` üzerinden `akadmin` kullanıcısı ve
`.env`'deki `AUTHENTIK_BOOTSTRAP_PASSWORD` ile giriş yapılabilir. `AUTHENTIK_BOOTSTRAP_TOKEN`
otomasyon (API) erişimi için üretilir — yalnız ilk boot'ta işlenir, sonrasında panelden
yönetilir.

## Runbook

### Break-glass

*(Task 8'de dolacak)*

### Yeni kullanıcı

*(Task 8'de dolacak)*

### Oturum öldürme

*(Task 8'de dolacak)*

### Panel entegrasyon envanteri

*(Task 8'de dolacak)*
