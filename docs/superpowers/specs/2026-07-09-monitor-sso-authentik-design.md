# Monitör Kurumsallaştırma Tur 2-C — SSO/RBAC (Authentik)

- **Tarih:** 2026-07-09
- **Branch:** `ops/monitor-sso-tur2c` (tur1/2-A dalı üzerine istiflenmiş)
- **Kapsam:** Monitör kutusu (194.62.52.22) + Cloudflare DNS (1 kayıt, kullanıcı açar). Uygulama sunucularına **sıfır dokunuş**.
- **İlgili:** `deploy/monitor/`, `deploy/{umami,glitchtip}` (kurulum deseni), Tur 2-A SLO sistemi (`deploy/monitor/slo/README.md`).

## 1. Amaç

Monitör kutusundaki 4 insan panelinin (Grafana/Kuma/Umami/GlitchTip) her birinin ayrı parolası var; 2FA yalnız Kuma'da. Bu alt-proje **tek kimlik + tek 2FA + tek yerden oturum yönetimi** getirir (SSO) ve ekip büyüdüğünde kullanıcı eklemeyi "panel-başına hesap" işinden "Authentik'te kullanıcı + grup" işine indirir (RBAC iskeleti).

## 2. Kararlar (brainstorm'da kilitlendi)

| Karar | Seçim | Gerekçe |
|---|---|---|
| Kapsam | **B: tüm paneller tek çatı** | SSO'nun asıl değeri; panel-başına parola biter |
| Kimlik sağlayıcı | **Authentik (self-hosted)** | OIDC + forward-auth tek üründe native; egemen (TR/AB çizgisiyle tutarlı); yerleşik TOTP/WebAuthn |
| Adres | **auth.redwall.tr** | Kullanıcı seçimi |
| Kullanıcı modeli | Tek admin (bugün) + hazır rol iskeleti | `monitor-admins` + `monitor-viewers` (boş) grupları |
| 2FA | TOTP **zorunlu** (WebAuthn opsiyonel açık) | Tek authenticator'da toplanır |
| Oturum | Panel 24 saat / SSO 7 gün | Konfor + cihaz kaybında Authentik'ten toplu oturum öldürme |
| Break-glass | **2 katman** (aşağıda §6) | İzleme sisteminde döngüsel kilitlenme kabul edilemez |

## 3. Kapsam haritası (onaylı)

| Panel | Yöntem | Ayrıntı |
|---|---|---|
| Grafana (monitor.) | **Native OIDC** | Authentik OAuth2/OIDC provider; grup→rol eşleme (admins→Admin, viewers→Viewer); **yerel admin girişi fallback olarak AÇIK kalır** (`oauth_auto_login=false` — login ekranında iki seçenek) |
| GlitchTip (hata.) | **Native OIDC** | django-allauth OpenID Connect; kayıt kapalı kalır (mevcut `ENABLE_OPEN_USER_REGISTRATION=false`) |
| Uptime Kuma (durum.) | **Forward-auth + iç giriş KAPALI** | Traefik `forwardAuth` → Authentik embedded outpost; Kuma "Disable Auth" modu (dış auth'a güven) — tek giriş Authentik, Kuma-TOTP'si emekli olur |
| Umami (analitik.) | **Forward-auth (iç giriş kalır)** | Umami OSS'de OIDC yok → Authentik kapısı + arkada Umami girişi (çift giriş, nadir kullanım — kabul edildi) |
| loki. / push. | **DOKUNULMAZ** | Makine kimliği (basic-auth), ajan trafiği — SSO insan içindir |
| Alertmanager/Prometheus | **Değişmez** | Zaten dışa kapalı (iç ağ) |

## 4. Mimari ve bileşenler

```
Cloudflare (orange, CF-Full) ─▶ Monitör Traefik v3.7.6 (mevcut)
   auth.redwall.tr    ─▶ Authentik server (:9000) ── embedded outpost: /outpost.goauthentik.io/auth/traefik
   monitor.           ─▶ Grafana  (OIDC → auth.redwall.tr)
   hata.              ─▶ GlitchTip (OIDC → auth.redwall.tr)
   durum.             ─▶ [authentik-forward-auth mw] ─▶ Kuma (iç auth kapalı)
   analitik.          ─▶ [authentik-forward-auth mw] ─▶ Umami
```

- **Authentik yığını** (`deploy/authentik/`, Umami/GlitchTip kurulum deseniyle birebir): `authentik-server` + `authentik-worker` + `postgres` + `redis`; `/opt/authentik`, düz compose, `monitor_monitor-net` dış-ağı, Traefik label'ları `tls=true` + `cloudflare-ips`. Sürüm: kurulum anında en son kararlı doğrulanır ([[redwall-hep-son-surum]]). Secrets (PG parola, AUTHENTIK_SECRET_KEY) sunucu `.env` (600), repoya girmez.
- **forwardAuth middleware** Authentik server container'ının LABEL'ında tanımlanır (`authentik-fa`): sahibi=auth'un kendisi (Authentik çökmüşse forward-auth'un da çökmesi davranışsal fark yaratmaz; Tur 1 kuma-middleware kırılganlık dersi bilinçli olarak bu şekilde ele alındı). Kuma/Umami router'ları `authentik-fa` middleware'ini referanslar.
- **Kaynak bütçesi:** yığın ~1GB RAM; kurulum öncesi kutunun mevcut kullanımı ölçülür (11GB toplam; Faz1+Umami+GlitchTip+AM sonrası boşluk doğrulanır — yetmezse kullanıcıya raporlanır, zorla kurulmaz).

## 5. RBAC iskeleti

- Gruplar: `monitor-admins` (kullanıcı), `monitor-viewers` (boş — gelecek ekip).
- Grafana rol eşleme: OIDC `groups` claim → `monitor-admins`=Admin, `monitor-viewers`=Viewer, diğer=erişim yok.
- GlitchTip: OIDC girişli kullanıcı mevcut org'a üye olmalı (ilk girişte elle onay — kayıt kapalı deseni korunur).
- Yeni ekip üyesi prosedürü runbook'a: Authentik'te kullanıcı yarat → gruba ekle → bitti.

## 6. Break-glass (kilitlenme önleme — ZORUNLU tasarım)

SSO, izlediği kutuda yaşar → Authentik çökerse paneller arıza ANINDA gerekir. İki katman:
1. **Grafana yerel admin fallback:** OIDC yanında username/password formu açık kalır (admin parolası .env'de mevcut). NOC/dashboards'a erişim Authentik'ten bağımsız her zaman mümkün.
2. **SSH-tünel doğrudan erişim (runbook'ta komutlarıyla):** `ssh -L 3001:kuma-iç:3001 root@194.62.52.22` deseniyle Kuma/Umami/GlitchTip'e container portundan erişim (internete hiçbir şey açmadan) + gerekirse Traefik'ten `authentik-fa` middleware referansını kaldıran tek satırlık acil adım.
- **Sıra şartı:** Kuma'nın iç girişi, tünel yolu CANLI TEST edilmeden kapatılMAZ.

## 7. Kendi izlemesi

- `auth.redwall.tr` → yeni Kuma monitörü + `slos/auth.yml` (**Tier-2**, avail-only 99, ticket) — SLO sistemine 15. servis (veri-güdümlü desen: YAML+generate+commit).
- Not: Kuma monitör ekleme 2FA nedeniyle UI'dan (kullanıcı) — Tur 2-A dersi.

## 8. Rollout sırası (artımlı, her adım geri alınabilir)

1. **Ön koşul (kullanıcı):** Cloudflare'de `auth` A kaydı → 194.62.52.22, proxied/orange.
2. Authentik yığını kur + `auth.redwall.tr` canlı + admin hesabı + TOTP zorunlama + gruplar. (Hiçbir panele dokunulmadı — sıfır risk.)
3. **Grafana OIDC** (en güvenli ilk entegrasyon; fallback açık; bozulursa env geri alınır).
4. GlitchTip OIDC.
5. **Kuma forward-auth:** önce middleware yalnız test-path'te → tünel break-glass testi → Kuma "Disable Auth".
6. Umami forward-auth.
7. SLO (auth.yml) + runbook (`deploy/authentik/README.md`: break-glass, yeni kullanıcı, oturum öldürme) + hafıza güncelleme.

## 9. Test/doğrulama

- Her entegrasyonda: SSO ile giriş + yanlış-kullanıcı reddi + (Grafana'da) rol eşlemesi doğru mu.
- Break-glass tatbikatı: Authentik container'ı KASITLI durdurulur → Grafana yerel girişle açılıyor mu + tünel yolu çalışıyor mu → Authentik geri açılır. (Sentetik-ihlal e2e'nin SSO karşılığı.)
- Redirect-döngüsü testi: CF üzerinden tam giriş akışı (orange proxy + forward-auth başlıkları).
- CF-cache tuzağı kontrolü: `/outpost.goauthentik.io/*` yanıtlarının cache'lenmediği doğrulanır.

## 10. Riskler

1. Aynı-kutu döngüselliği → §6 break-glass (tasarımın çekirdeği).
2. Kuma kilitlenmesi → §8 sıra şartı (tünel testi önce).
3. CF + forward-auth redirect döngüsü → doğru `X-Forwarded-*`; test §9.
4. RAM yetersizliği → kurulum öncesi ölçüm; yetmezse DUR + raporla.
5. Grafana OIDC yanlış yapılandırması admin'i kilitlemez (fallback) — en kötü durumda env revert.
6. Umami çift-giriş UX'i — bilinçli kabul (kapsam dışına alınabilir, tek satır).

## 11. Kapsam dışı

Sunucu SSH girişleri (ayrı iş: SSH anahtarına geçiş — [[redwall-sunucu-erisim]] notu) · YangınPro uygulama SSO'su · loki/push makine uçları · Tur 2-B (Tempo — ayrı spec).
