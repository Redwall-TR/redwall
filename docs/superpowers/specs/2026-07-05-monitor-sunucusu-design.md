# Monitör / Gözlemlenebilirlik Sunucusu — Tasarım

**Tarih:** 2026-07-05
**Sunucu:** 194.62.52.22 (temiz Ubuntu 24.04, 6 çekirdek, 11 GB RAM, 60 GB boş disk, Docker yok, ufw kapalı, yalnız SSH açık)
**Amaç:** Redwall altyapısının tamamı için merkezi gözlemlenebilirlik: uptime + disk/CPU/RAM + docker(swarm) container durumu + merkezi log toplama. Self-hosted, ücretsiz.

## İzlenecek hedefler
ERP · resmi web sitesi (194.62.52.14) · YangınPro test · YangınPro shtest · license server.
Kesin IP/erişim listesi kullanıcı tarafından ayrıca verilecek (Faz 2 girdisi).

## Kararlar (brainstorming'de onaylandı)
- **Erişim/TLS:** subdomain + Cloudflare (turuncu/proxied), monitör sunucusunda Traefik. **Cert: redwall'daki kanıtlanmış desen — Cloudflare "Full" origin cert'i doğrulamaz → Traefik varsayılan self-signed cert sunar, router'da `tls=true` yeter, ACME/Let's Encrypt YOK.** `monitor.redwall.tr` kaydı hazır (proxied). Monitör tek düğüm → Swarm değil, düz `docker compose` + Traefik `docker` provider.
- **Yığın:** Grafana-merkezli — Prometheus + Loki + Grafana + Uptime Kuma. (ELK/Graylog reddedildi: bu kutu için çok ağır. Beszel reddedildi: Grafana loglar için zaten geliyorsa metriği de içine almak tek pano verir.)
- **Log kapsamı:** tüm sunucular (yalnız YangınPro değil).
- **Alarm:** Telegram + e-posta (SMTP), her ikisi.
- **Ek barındırma:** Umami (analytics) + GlitchTip (hata takibi) bu sunucuda toplanır (önceki ops yol haritasından; bu o sunucu).
- **Subdomain şeması:** `monitor.` → Grafana · `durum.` → Uptime Kuma · `analitik.` → Umami · `hata.` → GlitchTip. Prometheus/Loki dışarı açılmaz (yalnız Grafana içinden).

## Mimari

```
Cloudflare (turuncu) *.redwall.tr
        │
        ▼
MONİTÖR SUNUCUSU 194.62.52.22
  Traefik + Let's Encrypt (80/443)
   ├─ Grafana      monitor.redwall.tr   (metrik + log tek pano, birleşik alarm)
   ├─ Uptime Kuma  durum.redwall.tr     (uptime + durum sayfası)
   ├─ Prometheus   (iç)                 (node_exporter/cAdvisor çeker)
   ├─ Loki         (iç)                 (log deposu + saklama)
   ├─ Umami        analitik.redwall.tr  (analytics)
   └─ GlitchTip    hata.redwall.tr      (hata takibi)
        ▲ Prometheus çeker (pull)   ▲ Alloy log iter (push, HTTPS+basic-auth)
        │                           │
HEDEF SUNUCULARDA (her biri salt-okuma):
   • node_exporter (host CPU/disk/RAM)
   • cAdvisor      (docker/swarm container metriği)
   • Grafana Alloy (docker log → Loki)
```

## Bileşenler ve sorumluluklar

### Monitör sunucusu (hepsi Docker)
| Servis | Sorumluluk | Bağımlılık | Dışa açık |
|---|---|---|---|
| Traefik | Ters proxi, HTTPS (self-signed, CF Full arkası), tüm UI'ları subdomain'lere yönlendirir | Docker socket (read-only), 80/443 | 80/443 |
| Grafana | Metrik (Prometheus) + log (Loki) tek pano; birleşik alarm → Telegram + SMTP | Prometheus, Loki | monitor.redwall.tr |
| Prometheus | Hedeflerdeki node_exporter + cAdvisor'ı çeker; 30 gün saklama | hedef exporter'ları | hayır (iç) |
| Loki | Alloy'dan gelen logları saklar; 30 gün retention (compactor) | — | itme ucu Traefik+basic-auth |
| Uptime Kuma | HTTP/TCP/ping + durum sayfası; kendi Telegram+SMTP bildirimi | — | durum.redwall.tr |
| Umami | Çerezsiz analytics (redwall yol haritasından) | kendi Postgres | analitik.redwall.tr |
| GlitchTip | Hata/olay takibi (redwall yol haritasından) | kendi Postgres + Redis | hata.redwall.tr |

### Her hedef sunucuda (Faz 2, salt-okuma)
| Agent | Sorumluluk | Erişim |
|---|---|---|
| node_exporter | Host CPU/disk/RAM/ağ metriği | host read-only; port yalnız monitör IP'sine (ufw) |
| cAdvisor | Docker/swarm container başına kaynak | docker socket read-only; port yalnız monitör IP'sine (ufw) |
| Grafana Alloy | Docker container log'larını tail + Loki'ye push | docker log read-only; dışarı HTTPS push |

## Veri akışı
- **Metrik (pull):** Prometheus (monitör) → hedef `node_exporter:9100` + `cAdvisor:8080`. Grafana Prometheus'u sorgular.
- **Log (push):** Alloy (hedef) → Loki (monitör) HTTPS + basic-auth. Grafana Loki'yi sorgular.
- **Uptime:** Uptime Kuma → hedef URL/`/api/health` HTTP GET.

## Güvenlik
- Hedeflerde exporter portları internete AÇILMAZ: `ufw` ile yalnız monitör IP'sine (194.62.52.22) izin.
- Loki itme ucu Traefik arkasında basic-auth + HTTPS; yalnız kimlikli agent yazar.
- Hedeflere kurulan 3 agent de salt-okuma; YangınPro minio/postgres/uygulama verisine erişmez/yazmaz. Kurulum öncesi kullanıcı onayı alınır.
- Panel login'leri (Grafana/Kuma/GlitchTip) güçlü parolayla; Prometheus/Loki hiç dışa açılmaz.
- Monitör sunucusu ufw: yalnız 22 + 80/443 dışarı; Loki itme ucu yalnız hedef IP'lerine.
- Cloudflare "Full" ayarına dokunulmaz (redwall zone geneli); Traefik self-signed origin cert sunar → CF Full doğrulamaz, uyumlu (ACME yok).

## Alarm (Telegram + e-posta)
- Grafana birleşik alarm → contact points: Telegram bot (token + chat id) + SMTP (Gmail, redwall'daki). Kurallar: node down, disk %85+, CPU sürekli yüksek, container/stack durdu, opsiyonel log hata patlaması.
- Uptime Kuma → kendi Telegram + SMTP bildirimi (site düşünce).

## Saklama (60 GB disk)
- Prometheus 30 gün (veya boyut sınırı), Loki 30 gün (compactor + retention). Sınırlar baştan; disk dolması engellenir.

## IaC / repo
- Compose + config git'te: `deploy/monitor/` (Traefik, Grafana + provisioning, Prometheus, Loki, Uptime Kuma, örnek Alloy config, hedef-agent compose'u). Mevcut `deploy/umami/` + `deploy/glitchtip/` de bu sunucuda koşar. Sırlar sunucudaki `.env`'de (commit edilmez); `.env.example` commit edilir.

## Fazlama
1. **Faz 1 — Hub:** Docker + Traefik + Grafana + Prometheus + Loki + Uptime Kuma. UI'lar HTTPS'te, sertifikalar geçerli. *(Şimdi.)*
2. **Faz 2 — Hedefler:** sunucu listesi gelince her hedefe agent + ufw + Prometheus scrape + Kuma monitor. *(Liste bekliyor.)*
3. **Faz 3 — Alarm + dashboard + Umami/GlitchTip taşıma.**

## Doğrulama (her faz)
UI'lar geçerli sertifikayla açılıyor; Prometheus hedefleri "up"; Grafana veri kaynakları yeşil; test log satırı Loki'de; Kuma monitörleri yeşil; kasıtlı test alarmı Telegram + e-postaya düşüyor.

## Kapsam dışı (YAGNI)
- **YangınPro production sunucuları:** henüz mevcut değil, çok sonra kurulacak. Faz 2'ye DAHİL DEĞİL. Mimari bunları ileride aynı Faz-2 deseniyle (agent + ufw + scrape/log/monitor) sorunsuz kaldırır — o gün sadece hedef eklenir, tasarım değişmez.
- Uzun-dönem metrik arşivi (Thanos/Mimir), tracing (Tempo), APM. İhtiyaç doğarsa ayrı proje.
- WireGuard mesh: firewall-tabanlı erişim yeterli; hardening istenirse sonra.
