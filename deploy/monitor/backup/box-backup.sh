#!/usr/bin/env bash
# Kutu-içi gece yedeği: authentik/umami/glitchtip pg_dump + Kuma&Grafana sqlite + config-tar.
# Her adım hata-kontrollü (backup-hardening dersi): set -euo pipefail + her yedek dosyası
# >1KB kontrolünden geçmeli. Herhangi bir adım başarısız olursa script FAIL eder ve tazelik
# textfile'ı (backup.prom) GÜNCELLENMEZ — bu durum T5'teki tazelik alarmını tetikler.
#
# Kuma sqlite: container'da sqlite3 CLI var VE db WAL modunda (kuma.db-wal/-shm mevcut) →
# tutarlı kopya için `sqlite3 .backup` kullanılır (canlı yazma sırasında bile tutarlı çıktı
# garantisi verir). Grafana sqlite: grafana imajında sqlite3 CLI YOK, grafana.db yanında
# WAL yan-dosyası da yok (rollback-journal modu) → `docker cp` ile doğrudan kopya kullanılır;
# 03:30'da düşük yazma trafiği olduğundan yarım-yazma riski kabul edilebilir seviyede.
#
# Secret'lar yedeğe GİRMEZ: config-tar --exclude='.env' --exclude='secrets' (yedek şifresiz
# diskte durur). pg_dump'lar container-içi unix-socket üzerinden trust-auth ile çalışır,
# script içinde parola tutulmaz.
set -euo pipefail

BACKUP_ROOT="/opt/monitor-backups"
TEXTFILE_DIR="/var/lib/node_exporter/textfile"
TEXTFILE="$TEXTFILE_DIR/backup.prom"
TS="$(date +%Y%m%d-%H%M%S)"
DEST="$BACKUP_ROOT/$TS"

AUTHENTIK_DB_CTN="authentik-authentik-db-1"
UMAMI_DB_CTN="umami-umami-db-1"
GLITCHTIP_DB_CTN="glitchtip-glitchtip-db-1"
KUMA_CTN="monitor-uptime-kuma-1"
GRAFANA_CTN="monitor-grafana-1"

log() { echo "[box-backup] $(date '+%F %T') $*"; }

# Dosya boyutu kontrolü: yoksa/boşsa/1KB altındaysa yedek BAŞARISIZ sayılır (set -e ile durur).
check_backup_file() {
  local f="$1"
  if [[ ! -s "$f" ]]; then
    log "HATA: $f oluşmadı veya boş — yedek başarısız."
    exit 1
  fi
  local size
  size=$(stat -c%s "$f")
  if (( size < 1024 )); then
    log "HATA: $f çok küçük (${size} bayt, <1KB eşiği) — yedek başarısız sayıldı."
    exit 1
  fi
  log "OK: $f (${size} bayt)"
}

mkdir -p "$DEST"
log "Yedek dizini: $DEST"

# ── 1) Postgres dump'ları (docker exec + unix-socket trust-auth, parola script'te YOK) ──
log "authentik pg_dump başlıyor..."
docker exec "$AUTHENTIK_DB_CTN" pg_dump -U authentik authentik | gzip > "$DEST/authentik-db.sql.gz"
check_backup_file "$DEST/authentik-db.sql.gz"

log "umami pg_dump başlıyor..."
docker exec "$UMAMI_DB_CTN" pg_dump -U umami umami | gzip > "$DEST/umami-db.sql.gz"
check_backup_file "$DEST/umami-db.sql.gz"

log "glitchtip pg_dump başlıyor..."
docker exec "$GLITCHTIP_DB_CTN" pg_dump -U glitchtip glitchtip | gzip > "$DEST/glitchtip-db.sql.gz"
check_backup_file "$DEST/glitchtip-db.sql.gz"

# ── 2) Uptime Kuma sqlite (WAL modunda — sqlite3 .backup ile tutarlı kopya) ──
log "kuma sqlite .backup başlıyor..."
docker exec "$KUMA_CTN" sqlite3 /app/data/kuma.db ".backup '/app/data/kuma-backup-tmp.db'"
docker cp "$KUMA_CTN:/app/data/kuma-backup-tmp.db" "$DEST/kuma.db"
docker exec "$KUMA_CTN" rm -f /app/data/kuma-backup-tmp.db
gzip "$DEST/kuma.db"
check_backup_file "$DEST/kuma.db.gz"

# ── 3) Grafana sqlite (imajda sqlite3 CLI yok — doğrudan docker cp) ──
log "grafana.db docker cp başlıyor..."
docker cp "$GRAFANA_CTN:/var/lib/grafana/grafana.db" "$DEST/grafana.db"
gzip "$DEST/grafana.db"
check_backup_file "$DEST/grafana.db.gz"

# ── 4) Config-tar: /opt/{monitor,authentik,umami,glitchtip,tempo} — secret'lar HARİÇ ──
# --exclude desenleri slash içermediği için ağaçtaki HER seviyede eşleşir (örn.
# self-agent/.env de dışlanır). "secrets" adlı dizinler (örn. /opt/monitor/secrets) de dışlanır.
log "config-tar başlıyor..."
tar czf "$DEST/config.tar.gz" \
  --exclude='.env' \
  --exclude='secrets' \
  -C /opt monitor authentik umami glitchtip tempo
check_backup_file "$DEST/config.tar.gz"

# ── 5) 7 günden eski yedek setlerini sil (yalnız $BACKUP_ROOT içinde) ──
log "7 günden eski yedekler siliniyor..."
find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -mtime +7 -exec rm -rf {} +

# ── 6) Tazelik metriği — YALNIZ tüm adımlar başarılıysa buraya gelinir. Atomik yaz (tmp+mv). ──
mkdir -p "$TEXTFILE_DIR"
TMP_METRIC="$(mktemp "$TEXTFILE_DIR/.backup.prom.XXXXXX")"
{
  echo "# HELP redwall_backup_last_success_timestamp Son başarılı kutu-içi yedeğin unix zaman damgası."
  echo "# TYPE redwall_backup_last_success_timestamp gauge"
  echo "redwall_backup_last_success_timestamp{set=\"monitor-box\"} $(date +%s)"
} > "$TMP_METRIC"
chmod 644 "$TMP_METRIC"
mv -f "$TMP_METRIC" "$TEXTFILE"

log "Yedek tamamlandı: $DEST"
