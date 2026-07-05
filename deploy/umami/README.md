# Umami Analytics — Ops Sunucu Kurulumu

Redwall için self-hosted, çerezsiz (KVKK dostu) analytics. Bu, **ops/monitör sunucusunda**
(Uptime Kuma / GlitchTip ile birlikte) çalışır — redwall web VDS'inde DEĞİL.

## Kurulum
1. `cp .env.example .env` → `UMAMI_DB_PASSWORD` ve `UMAMI_APP_SECRET`'i güçlü değerlerle doldur
   (ör. `openssl rand -hex 32`).
2. `docker compose up -d`
3. Panele git: `http://<ops-sunucu>:3001` (ya da Traefik/ingress ile `https://analytics.redwall.tr`).
   İlk giriş: kullanıcı `admin`, parola `umami` → **hemen parolayı değiştir**.
4. Settings → Websites → **Add website**: Name=Redwall, Domain=`redwall.tr` → kaydet.
   Üretilen **Website ID**'yi kopyala.

## redwall sitesine bağlama
GitHub repo → Settings → Variables'a ekle:
- `NEXT_PUBLIC_UMAMI_URL` = `https://analytics.redwall.tr` (ya da ops URL'in)
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID` = panelden aldığın Website ID
Sonra redwall'ı yeniden deploy et (main'e push / workflow_dispatch). İzleme başlar.
Bu var'lar boşken site sorunsuz çalışır (Analytics inert).

## TLS / ingress
Ops sunucun Traefik/nginx kullanıyorsa `analytics.redwall.tr`'yi umami:3000'e yönlendir.
Doğrudan port ile de çalışır (3001) ama TLS önerilir.
