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
