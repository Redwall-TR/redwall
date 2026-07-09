# Tempo — Dağıtık İzleme (Trace) — Ops Sunucu Kurulumu

Redwall için self-hosted Tempo (Grafana). **Ops/monitör sunucusunda** çalışır (Prometheus/Loki/
Grafana ile birlikte, `monitor_monitor-net` ağına bağlanır) — redwall web VDS'inde DEĞİL.

## Kurulum
1. `cp .env.example .env` → `TEMPO_BASICAUTH` doldur (`htpasswd -nbB agent 'GUCLU_PAROLA'` üret,
   çıktıdaki her `$` işaretini `$$` yap — bkz. `.env.example` içindeki not).
2. `docker compose up -d`
3. Alım ucu: `https://izler.redwall.tr/v1/traces` (OTLP-HTTP, basic-auth arkasında).
   Sorgu API'si (3200) dışa açılmaz — yalnız `monitor-net` içinden (Grafana datasource).
4. Grafana'da Tempo datasource ekle: URL `http://tempo:3200`, monitor-net üzerinden erişilebilir
   (aynı stack'te veya external network paylaşımıyla).

## Sürüm / saklama
- İmaj: `grafana/tempo:3.0.2` (etiket `v`'siz — GitHub release tag'i `v3.0.2`, imaj etiketi `3.0.2`).
- Saklama: 7 gün (`backend_scheduler`/`backend_worker` altında `block_retention: 168h` — Tempo v3
  mimarisinde eski `compactor:` bloğu kalktı, bkz. `tempo.yaml` içindeki not).

## Runbook (T7'de dolar)
### Yeni servis bağlama
_TODO — T7._

### Sampling değiştirme
_TODO — T7._

### Disk izleme
_TODO — T7._

## TLS / ingress
`izler.redwall.tr` monitör Traefik'ine (file/docker provider, `monitor_monitor-net`) bağlanır —
Cloudflare "Full" modu, Traefik self-signed sertifika sunar (ACME yok), monitör deseniyle aynı.
