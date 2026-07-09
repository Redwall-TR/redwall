# GlitchTip Hata Takibi — Ops Sunucu Kurulumu

Redwall için self-hosted, Sentry-uyumlu hata takibi. **Ops/monitör sunucusunda** çalışır
(Umami / Uptime Kuma ile birlikte) — redwall web VDS'inde DEĞİL.

## Kurulum
1. `cp .env.example .env` → `GLITCHTIP_SECRET_KEY` (`openssl rand -hex 32`), `GLITCHTIP_DB_PASSWORD`,
   `GLITCHTIP_DOMAIN` (ör. `https://hata.redwall.tr`) doldur.
2. `docker compose up -d` (ilk açılışta `glitchtip-migrate` DB şemasını kurar).
3. Panele git: `http://<ops-sunucu>:8000` (ya da Traefik/ingress ile GLITCHTIP_DOMAIN). İlk kayıt olan
   kullanıcı admin olur → **güçlü parola** kullan.
4. Organization → **Create Project** (platform: Next.js) → üretilen **DSN**'i kopyala.

## redwall sitesine bağlama
GitHub repo → Settings:
- **Variables**: `NEXT_PUBLIC_SENTRY_DSN` = DSN (client; public — sorun değil)
- **Secrets**: `SENTRY_DSN` = aynı DSN (server; secret olarak)
Sonra redwall'ı yeniden deploy et. Prod runtime hataları GlitchTip'e düşer.
Bu var'lar boşken site sorunsuz çalışır (Sentry init atlanır, inert).

## TLS / ingress
`hata.redwall.tr`'yi glitchtip-web:8000'e Traefik/nginx ile yönlendir (TLS önerilir).

## SSO (Authentik OIDC)

**Yöntem keşfi (2026-07-09, GlitchTip 6.2.0, django-allauth 65.16.1):** resmî docs
(glitchtip.com/documentation/install → "Social Authentication"/"OpenID Connect") ve
kaynak kodu (`glitchtip/settings.py`, `glitchtip/urls.py`) doğrulandı — generic OIDC
provider'ı için **env-var yolu YOK**. `SOCIALACCOUNT_PROVIDERS_*` env'leri yalnız
gitlab/gitea/nextcloud/microsoft gibi adlandırılmış sağlayıcıların yardımcı ayarları
(ör. self-hosted URL) için var; client_id/secret + generic OIDC her zaman DB'deki
`SocialApp` kaydı üzerinden çalışıyor (admin UI: `/admin/socialaccount/socialapp/`,
ya da aşağıdaki gibi programatik olarak `manage.py shell`).

Callback URL kalıbı (django-allauth openid_connect provider, `provider_id=authentik`):
```
https://hata.redwall.tr/accounts/oidc/authentik/login/callback/
```

Authentik tarafı: Task 3'teki (Grafana) desenle aynı — `providers/oauth2/` (slug/name
`glitchtip`, `redirect_uris` obje-listesi, `authorization_flow`/`invalidation_flow` pk'leri,
openid+email+profile property mapping'leri, `grant_types` açıkça `authorization_code`+
`refresh_token`) + `core/applications/` (slug `glitchtip`). Issuer:
`https://auth.redwall.tr/application/o/glitchtip/`.

GlitchTip tarafı — SocialApp kaydını oluşturmak/güncellemek için (sunucuda, `/opt/glitchtip`):
```bash
docker exec -i glitchtip-glitchtip-web-1 python manage.py shell <<'PY'
from allauth.socialaccount.models import SocialApp
app, created = SocialApp.objects.update_or_create(
    provider="openid_connect",
    provider_id="authentik",
    defaults={
        "name": "Authentik",
        "client_id": "<Authentik provider client_id>",
        "secret": "<Authentik provider client_secret>",
        "settings": {
            "server_url": "https://auth.redwall.tr/application/o/glitchtip/",
            "token_auth_method": "client_secret_basic",
        },
    },
)
print("SocialApp id:", app.id, "created:", created)
PY
```
client_id/secret'ı bir dosyaya/komuta düz yazmadan aktarmak için (secret sızıntısını
önlemek adına) geçici bir dosya oluşturup `docker exec -i ... < dosya` ile stdin'den
beslemek, sonra dosyayı silmek önerilir (bu görevde böyle yapıldı).

**Kayıt davranışı:** yukarıdaki `docker-compose.yml` yorumuna bak — `ENABLE_USER_REGISTRATION`
(doğrudan e-posta/parola kaydı) kapalı, `ENABLE_SOCIAL_APPS_USER_REGISTRATION` (Authentik SSO ile
ilk girişte hesap açma) açık tutulur. **İlk SSO girişinde kullanıcı bir organizasyona otomatik
atanmaz** (`ENABLE_ORGANIZATION_CREATION=false`) — admin panelden mevcut organizasyona elle
üye eklenmesi gerekir (bkz. Organization → Members).
