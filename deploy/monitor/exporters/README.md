# Monitör exporter'ları — DB/Redis metrikleri (push modeli, no-inbound-port)

Exporter'lar hedef sunucuda çalışır, **app'in DB-overlay'i + traefik-public köprüsünde** dinler
(host portu YOK). Oradaki **Alloy ajanı köprüden servis-DNS'iyle scrape eder** → monitör'e push.

## Salt-okuma izleme rolü (veri/şema DEĞİŞMEZ)

**PostgreSQL** (her Postgres'te, app DB süper-kullanıcısıyla — rol yoksa):
```sql
CREATE ROLE monitoring LOGIN PASSWORD '<uret>';
GRANT pg_monitor TO monitoring;
```
`pg_monitor` = `pg_read_all_settings + pg_read_all_stats + pg_stat_scan_tables` — yalnız izleme.

**MariaDB/MySQL** (ERP):
```sql
CREATE USER 'monitoring'@'%' IDENTIFIED BY '<uret>';
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'monitoring'@'%';
```

## Deploy

**Swarm sunucuları** (license, yp-test, yp-shtest, kurumsal) — `swarm-stack.yml`:
```bash
DB_NET=<app-db-overlay> PG_HOST=<pg-servis> PG_MON_PASS=<p> \
  REDIS_HOST=<redis-servis> [REDIS_PASS=<p>] [PG_DB=<db>] \
  docker stack deploy -c swarm-stack.yml redwall-mon
# DNS: redwall-mon_postgres-exporter:9187 / redwall-mon_redis-exporter:9121
```
Redis yok (kurumsal) → deploy sonrası `docker service rm redwall-mon_redis-exporter`, ya da
yalnız postgres-exporter içeren bir varyantla deploy.

**ERP** (plain compose) — `erp-compose.yml`:
```bash
MYSQL_MON_PASS=<p> docker compose -f erp-compose.yml up -d
# İsimler: redwall-mon-mysqld:9104 / redwall-mon-redis-cache:9121 / redwall-mon-redis-queue:9121
```

## Alloy ajanı (hedef `/opt/redwall-agent/.env`)
```
MON_BRIDGE_NET=traefik-public              # ERP'de: frappe_docker_frappe_network
TRAEFIK_METRICS_ADDR=<traefik-servis>:8082
PG_EXPORTER_ADDR=redwall-mon_postgres-exporter:9187   # yoksa boş + config'den blok çıkar
REDIS_EXPORTER_ADDR=redwall-mon_redis-exporter:9121
MYSQL_EXPORTER_ADDR=                        # yalnız ERP
```
Sonra: yeni `config.alloy` + `.env` → `docker compose up -d`. O sunucuda olmayan exporter'ın
scrape bloğu, deploy edilen config'den çıkarılır (boş `__address__` hedefini önlemek için).

## Traefik metrikleri
Her Traefik command'ına: `--metrics.prometheus=true --metrics.prometheus.addEntryPointsLabels=true
--metrics.prometheus.addServicesLabels=true --entrypoints.metrics.address=:8082
--metrics.prometheus.entrypoint=metrics`. Traefik traefik-public'te olduğundan Alloy erişir.

### ERP kalıcılık riski + reapply script'i (Tur 3 Task 10, K2)
ERP'de (`/opt/frappe_docker/redwall.yml`) bu flag'ler **elle** eklenmiştir — Swarm
label'ı değil, plain `docker compose` komut satırı. Frappe'nin sürüm yükseltme /
config-regenerate akışı bu dosyayı yeniden oluşturabilir ve elle eklenen flag'leri
SİLEBİLİR (sunucuda geçmiş `redwall.yml.bak-pre-v16-*` yedekleri bu tür
regenerate'lerin izidir). Frappe'nin generate mekanizması frappe_docker reposunun
kendi tooling'i olduğundan (repo-dışı), tam-IaC/otomatik önleme mümkün değil.

Telafi: `reapply-traefik-metrics.sh` (bu dizinde, ERP'de `/opt/redwall-mon/`'a
kurulu) — regenerate/upgrade SONRASI elle çalıştırılır. İdempotent: flag'ler
zaten varsa dokunmaz; eksikse yedekler + `docker compose config -q` ile
doğrular + doğrulama başarılıysa yalnız `traefik` servisini yeniden oluşturur
(diğer ERP servisleri etkilenmez). Doğrulama başarısız olursa hiçbir şey
uygulanmaz. Kullanım: `/opt/redwall-mon/reapply-traefik-metrics.sh
[redwall.yml yolu]` (varsayılan `/opt/frappe_docker/redwall.yml`).

## Rollback
`docker stack rm redwall-mon` (Swarm) / `docker compose -f erp-compose.yml down` (ERP) +
Alloy `.env` eski hâli + Traefik metrics flag'lerini geri al. Push modeli/inbound yüzeyi değişmez.
Rol'ü geri almak için: `DROP ROLE monitoring;` / `DROP USER 'monitoring'@'%';`.
