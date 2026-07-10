# Monitör kutusunun öz-ajanı — self-agent

`deploy/monitor/agent/` (hedef-sunucu Alloy ajan deseni) kutunun (194.62.52.22) kendisine
uyarlanmış kopyası. Amaç: monitör kutusunun **kendi container logları + container metrikleri**
de diğer 5 hedef gibi Grafana/Loki'de görünsün ("izleyen kendini izlemiyor" kör noktası).

## Hedef-ajanlardan farklar
- **İç ağdan yazar:** Loki push `http://loki:3100/loki/api/v1/push`, Prometheus remote-write
  `http://prometheus:9090/api/v1/write` — servis-DNS, `monitor_monitor-net` ağı üzerinden.
  Dış `loki.redwall.tr` / `push.redwall.tr` uçları KULLANILMAZ, basic-auth GEREKMEZ (iç ağ).
- **`prometheus.exporter.unix` YOK:** kutuda host metriği zaten ayrı `node-exporter`
  container'ından geliyor (`deploy/monitor/docker-compose.yml`, job=node,
  instance=redwall-monitor). Aynısını Alloy'dan da göndermek çift-seri yaratır — bilinçli
  olarak çıkarıldı.
- **Uygulama/DB exporter blokları (traefik/postgres/redis/mysql) YOK:** kutudaki
  Traefik/Loki/Tempo/Grafana/Alertmanager zaten Prometheus'un kendi statik scrape
  config'inden (`prometheus/prometheus.yml`) doğrudan kazınıyor.
- **cadvisor + docker-logları + gürültü süzgeci KALDI** — hedef-ajan deseniyle birebir aynı
  mantık (`loki.process "gurultu"` bloğu değişmeden taşındı).

## Deploy (kutuda, /opt/monitor/self-agent)
```bash
cp .env.example .env   # AGENT_HOSTNAME=redwall-monitor sabit, değiştirme
docker compose up -d
docker compose logs alloy   # parse hatası yok, "Up" doğrula
```

## Doğrulama
```bash
# 1) cadvisor container metrikleri (kutunun ~18 container'ı)
docker compose exec prometheus wget -qO- \
  'http://localhost:9090/api/v1/query?query=count(container_last_seen%7Binstance%3D%22redwall-monitor%22%7D)'

# 2) Loki'de kutu logları (iç ağdan curlimages/curl ile)
docker run --rm --network monitor_monitor-net curlimages/curl -s \
  --data-urlencode 'query={host="redwall-monitor"}' \
  --data-urlencode 'start='$(date -u -d '5 min ago' +%s)000000000 \
  --data-urlencode 'end='$(date -u +%s)000000000 \
  'http://loki:3100/loki/api/v1/query_range'

# 3) ÇİFT-NODE KONTROLÜ — redwall-monitor için hâlâ TEK seri (unix exporter göndermiyor)
docker compose exec prometheus wget -qO- \
  'http://localhost:9090/api/v1/query?query=count(count%20by(instance)(node_uname_info))'
```
