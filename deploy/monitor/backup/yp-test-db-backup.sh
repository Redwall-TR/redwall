#!/usr/bin/env bash
# YangınPro SaaS TEST (test.redwall.tr) veritabanı gece yedeği — yanginpro-test (194.62.52.42).
# Desen box-backup.sh ile aynı (backup-hardening): fail-hard + >1KB kontrolü + tazelik metriği.
# Yerel: /opt/yp-backups (7 gün). Off-site: age-ŞİFRELİ → Google Drive Ortak-Drive
# "redwall-yedek" altında gdrive:yanginpro-test/<TS>/ (14 gün).
#
# NOT (veri sınıfı): Bu TEST ortamı verisidir — kullanıcı kararıyla (2026-07-11) Drive'a
# şifreli gider. PROD YangınPro verisi Drive'a GİTMEZ (TR/AB egemen hedef: VDS+MinIO).
#
# age: sunucuda yalnız PUBLIC anahtar var (/opt/redwall-backup/age.pub) — bu kutu ele
# geçse bile eski yedekler AÇILAMAZ. Özel anahtar: monitör kutusu + kullanıcı parola yöneticisi.
#
# Metrik: Alloy unix-exporter textfile-collector → /var/lib/node_exporter/textfile/*.prom
# (container içi yol: /host/root/var/lib/...). Mevcut BackupStale/OffsiteBackupStale kuralları
# set-etiketine bakmaksızın TÜM serileri kapsar — yeni kural gerekmez.
set -euo pipefail

BACKUP_ROOT="/opt/yp-backups"
TEXTFILE_DIR="/var/lib/node_exporter/textfile"
TS="$(date +%Y%m%d-%H%M%S)"
DEST="$BACKUP_ROOT/$TS"
AGE_PUB="/opt/redwall-backup/age.pub"
OFFSITE_PREFIX="gdrive:yanginpro-test"
OFFSITE_RETENTION_DAYS=14

log() { echo "[yp-db-backup] $(date '+%F %T') $*"; }

check_backup_file() {
  local f="$1"
  [[ -s "$f" ]] || { log "HATA: $f oluşmadı/boş."; exit 1; }
  local size; size=$(stat -c%s "$f")
  (( size >= 1024 )) || { log "HATA: $f çok küçük (${size}B)."; exit 1; }
  log "OK: $f (${size} bayt)"
}

mkdir -p "$DEST"

# ── 1) pg_dump (Swarm task-container'ı; unix-socket trust-auth, parola script'te YOK) ──
PGC=$(docker ps --filter name=yanginpro_postgres --format '{{.Names}}' | head -1)
[[ -n "$PGC" ]] || { log "HATA: yanginpro_postgres container bulunamadı."; exit 1; }
log "pg_dump başlıyor ($PGC)..."
docker exec "$PGC" pg_dump -U yanginpro yanginpro | gzip > "$DEST/yanginpro-test-db.sql.gz"
check_backup_file "$DEST/yanginpro-test-db.sql.gz"

# ── 2) Yerel döngü (7 gün) ──
find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -mtime +7 -exec rm -rf {} +

# ── 3) Yerel tazelik metriği ──
mkdir -p "$TEXTFILE_DIR"
TMP="$(mktemp "$TEXTFILE_DIR/.backup-yp.prom.XXXXXX")"
{
  echo "# HELP redwall_backup_last_success_timestamp Son başarılı yedeğin unix zaman damgası."
  echo "# TYPE redwall_backup_last_success_timestamp gauge"
  echo "redwall_backup_last_success_timestamp{set=\"yanginpro-test-db\"} $(date +%s)"
} > "$TMP"; chmod 644 "$TMP"; mv -f "$TMP" "$TEXTFILE_DIR/backup-yp.prom"
log "Yerel yedek tamam: $DEST"

# ── 4) OFF-SITE: age-şifrele → Drive (yalnız kendi prefix'ini yönetir) ──
AGE_RECIPIENT="$(cat "$AGE_PUB")"
ENC_DIR="$(mktemp -d /tmp/ypoffsite.XXXXXX)"; trap 'rm -rf "$ENC_DIR"' EXIT
age -r "$AGE_RECIPIENT" -o "$ENC_DIR/yanginpro-test-db.sql.gz.age" "$DEST/yanginpro-test-db.sql.gz"
log "off-site: Drive'a yükleniyor..."
rclone copy "$ENC_DIR" "$OFFSITE_PREFIX/$TS" --transfers 4 --checksum
REMOTE_N=$(rclone lsf "$OFFSITE_PREFIX/$TS" | wc -l)
[[ "$REMOTE_N" -eq 1 ]] || { log "HATA: Drive doğrulaması ($REMOTE_N/1)."; exit 1; }
rclone delete "$OFFSITE_PREFIX" --min-age "${OFFSITE_RETENTION_DAYS}d" 2>/dev/null || true
rclone rmdirs "$OFFSITE_PREFIX" --leave-root 2>/dev/null || true

TMP="$(mktemp "$TEXTFILE_DIR/.backup-yp-off.prom.XXXXXX")"
{
  echo "# HELP redwall_offsite_backup_last_success_timestamp Son başarılı off-site yedeğin unix zaman damgası."
  echo "# TYPE redwall_offsite_backup_last_success_timestamp gauge"
  echo "redwall_offsite_backup_last_success_timestamp{set=\"yanginpro-test-db\",target=\"gdrive\"} $(date +%s)"
} > "$TMP"; chmod 644 "$TMP"; mv -f "$TMP" "$TEXTFILE_DIR/backup-yp-offsite.prom"
log "Tamam (yerel+off-site): $DEST → $OFFSITE_PREFIX/$TS"
