# Kutu-içi gece yedekleri — deploy/monitor/backup

Monitör kutusunun (194.62.52.22) düz-compose projeleri (`/opt/monitor`, `/opt/authentik`,
`/opt/umami`, `/opt/glitchtip`, `/opt/tempo`) hiç yedeklenmiyordu. Bu, kutuyu her gece
`/opt/monitor-backups/<TARİH-SAAT>/` altına yedekler + node_exporter textfile-collector
üzerinden bir tazelik metriği üretir (T5'teki tazelik alarmı bunu kullanır).

## Ne yedekleniyor
| Dosya | İçerik | Yöntem |
|---|---|---|
| `authentik-db.sql.gz` | Authentik Postgres | `docker exec ... pg_dump \| gzip` |
| `umami-db.sql.gz` | Umami Postgres | `docker exec ... pg_dump \| gzip` |
| `glitchtip-db.sql.gz` | GlitchTip Postgres | `docker exec ... pg_dump \| gzip` |
| `kuma.db.gz` | Uptime Kuma sqlite | `sqlite3 .backup` (WAL modda tutarlı kopya) + gzip |
| `grafana.db.gz` | Grafana sqlite | `docker cp` (imajda sqlite3 yok, WAL yan-dosyası yok) + gzip |
| `config.tar.gz` | `/opt/{monitor,authentik,umami,glitchtip,tempo}` — **secret'lar HARİÇ** | `tar --exclude='.env' --exclude='secrets'` |

pg_dump'lar container-içi unix-socket üzerinden trust-auth ile çalışır — script'te parola
YOK. Config-tar'da `.env` ve `secrets` adlı her dosya/dizin (ağacın her seviyesinde) dışlanır;
yedek şifresiz diskte durduğu için secret'ların yedeğe girmemesi kritik.

## Hata-kontrolü (backup-hardening)
`set -euo pipefail` + her yedek dosyası üretildikten sonra `check_backup_file` ile
>1KB kontrolü yapılır. Herhangi bir adım (dump boş/başarısız, dosya küçük) FAIL ederse
script `exit 1` ile durur ve **tazelik metriği (adım 6) hiç yazılmaz** — bu, T5'teki
`redwall_backup_last_success_timestamp` tazelik alarmını tetikler.

## Tazelik metriği
Başarılı koşuda `/var/lib/node_exporter/textfile/backup.prom` atomik yazılır (tmp+mv):
```
redwall_backup_last_success_timestamp{set="monitor-box"} <unix-ts>
```
node-exporter'ın `--collector.textfile.directory` bayrağı bu dizini okur; Prometheus
zaten `job=node, instance=redwall-monitor` altında bu kutuyu kazıyor (bkz.
`deploy/monitor/prometheus/prometheus.yml`) — ek scrape-config GEREKMEZ.

## Saklama
`/opt/monitor-backups/` içinde 7 günden eski yedek SETLERİ (tarihli alt-dizinler) her
koşuda silinir (`find ... -mtime +7`). Başka hiçbir dizine dokunulmaz.

## Kurulum (sunucuda)
```bash
mkdir -p /opt/monitor/backup
scp deploy/monitor/backup/box-backup.sh deploy/monitor/backup/redwall-box-backup.* \
  root@194.62.52.22:/opt/monitor/backup/
ssh root@194.62.52.22 'bash -s' <<'EOF'
chmod +x /opt/monitor/backup/box-backup.sh
cp /opt/monitor/backup/redwall-box-backup.service /etc/systemd/system/
cp /opt/monitor/backup/redwall-box-backup.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now redwall-box-backup.timer
EOF
```
node-exporter'a `--collector.textfile.directory` bayrağı + volume mount eklendi
(`deploy/monitor/docker-compose.yml`) — `docker compose up -d node-exporter` ile devreye alınır.

## Doğrulama
```bash
bash /opt/monitor/backup/box-backup.sh
ls -lh /opt/monitor-backups/*/
cat /var/lib/node_exporter/textfile/backup.prom
systemctl list-timers redwall-box-backup.timer
# Prometheus'ta:
curl -s 'http://localhost:9090/api/v1/query?query=redwall_backup_last_success_timestamp' | python3 -m json.tool
```

## Geri yükleme (özet)
- Postgres: `gunzip -c X-db.sql.gz | docker exec -i <db-container> psql -U <user> <db>`
- Kuma/Grafana sqlite: `gunzip` sonra `docker cp` ile ilgili container'ın veri dizinine
  koy (önce container'ı durdur, dosyayı değiştir, tekrar başlat).
- Config: `tar xzf config.tar.gz -C /opt` (not: `.env`/`secrets` yedekte YOK, elle yeniden
  girilmeli).
