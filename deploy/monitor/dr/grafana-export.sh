#!/usr/bin/env bash
# grafana-export.sh — Grafana runtime-config'ini (dashboard'lar + datasource'lar +
# alert-provisioning: kural/contact-point/notification-policy) JSON'a döker.
#
# NEDEN: dashboard JSON'ları zaten repo'da duruyor (deploy/monitor/grafana/dashboards/
# + import-dashboards.sh ile kuruluyor) — ama Grafana admin veya kullanıcılar
# panelde elle değişiklik yapabilir (panel taşıma, yeni panel, eşik değiştirme).
# Bu script CANLI durumun bir anlık görüntüsünü alır, repo'daki dosyalarla
# karşılaştırma/DR'da fark tespiti için. Alert-rule/contact-point/policy repo'da
# HİÇ yok (Tur 3'te alarmlar Alertmanager+Loki-ruler'a taşındı, Grafana tarafı
# şu an büyük ölçüde boş) — yine de gelecekte biri Grafana'dan alert eklerse
# yakalansın diye export'a dahil edildi.
#
# ÇALIŞMA ORTAMI: bu script Grafana'ya host'tan DOĞRUDAN erişemez (Traefik'e
# host-publish yok, yalnız monitor-net içinden). Bu yüzden her curl çağrısı
# `docker run --rm --network monitor_monitor-net curlimages/curl` ile container
# içinden yapılır; çıktı host'taki jq'ye pipe edilir (host'ta curl+jq zaten var,
# bkz. README'deki Prometheus sorgu deseniyle aynı desen).
#
# SECRET'LAR: admin parolası /opt/monitor/.env içindeki GF_ADMIN_PASSWORD'den
# okunur (script'te literal YOK). Grafana'nın kendisi zaten secret alanlarını
# (datasource şifreleri, contact-point token'ları) API yanıtında REDACTED/boş
# döner — bu script'in çıktısında ham secret bulunmaz (doğrulandı: 2026-07-11).
set -euo pipefail

MONITOR_ENV_FILE="${MONITOR_ENV_FILE:-/opt/monitor/.env}"
NETWORK="${GRAFANA_EXPORT_NETWORK:-monitor_monitor-net}"
GRAFANA_URL="${GRAFANA_URL:-http://grafana:3000}"
OUTPUT="${1:-${GRAFANA_EXPORT_OUTPUT:-/opt/monitor-backups/grafana-config.json}}"

log() { echo "[grafana-export] $(date '+%F %T') $*" >&2; }

if [[ ! -r "$MONITOR_ENV_FILE" ]]; then
  log "HATA: $MONITOR_ENV_FILE okunamıyor (GF_ADMIN_PASSWORD lazım)."
  exit 1
fi

# Yalnız GF_ADMIN_PASSWORD'ü çek — tüm .env'i source etmek istenmeyen yan
# etkiler doğurabilir (başka değişkenler shell'e sızar).
GF_ADMIN_PASSWORD="$(grep -E '^GF_ADMIN_PASSWORD=' "$MONITOR_ENV_FILE" | head -1 | cut -d= -f2-)"
if [[ -z "$GF_ADMIN_PASSWORD" ]]; then
  log "HATA: GF_ADMIN_PASSWORD $MONITOR_ENV_FILE içinde bulunamadı."
  exit 1
fi

curl_grafana() {
  # $1: path (örn. /api/search?type=dash-db)
  local path="$1"
  local resp
  resp="$(docker run --rm --network "$NETWORK" curlimages/curl -s -w '\n%{http_code}' \
    -u "admin:${GF_ADMIN_PASSWORD}" "${GRAFANA_URL}${path}")"
  local code="${resp##*$'\n'}"
  local body="${resp%$'\n'*}"
  if [[ "$code" != "200" ]]; then
    log "HATA: GET $path -> HTTP $code"
    return 1
  fi
  echo "$body"
}

# Büyük dashboard JSON'ları (örn. node-exporter-full ~1MB) --argjson ile komut
# satırı argümanı olarak geçilirse ARG_MAX'a takılıyor (doğrulandı: "Argument
# list too long"). Bu yüzden HER ŞEY dosyaya yazılıp --slurpfile ile okunuyor
# — argv değil, dosya tanıtıcısı üzerinden.
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

log "dashboard listesi çekiliyor..."
curl_grafana '/api/search?type=dash-db' > "$TMPDIR/dashboard-list.json"
DASHBOARD_COUNT="$(jq 'length' "$TMPDIR/dashboard-list.json")"
if [[ "$DASHBOARD_COUNT" -lt 1 ]]; then
  log "HATA: dashboard listesi boş — beklenmiyordu, export durduruldu."
  exit 1
fi
log "OK: $DASHBOARD_COUNT dashboard bulundu."

log "her dashboard'un tam JSON'u çekiliyor..."
i=0
while IFS= read -r uid; do
  i=$((i + 1))
  curl_grafana "/api/dashboards/uid/${uid}" > "$TMPDIR/dash-${i}.json"
done < <(jq -r '.[].uid' "$TMPDIR/dashboard-list.json")
jq -s '.' "$TMPDIR"/dash-*.json > "$TMPDIR/dashboards.json"

log "datasource listesi çekiliyor..."
curl_grafana '/api/datasources' > "$TMPDIR/datasources.json"
DATASOURCE_COUNT="$(jq 'length' "$TMPDIR/datasources.json")"
log "OK: $DATASOURCE_COUNT datasource bulundu."

log "alert-provisioning (kural/contact-point/policy) çekiliyor — şu an büyük ölçüde boş olması BEKLENİYOR (Tur 3'te Alertmanager'a taşındı)..."
curl_grafana '/api/v1/provisioning/alert-rules' > "$TMPDIR/alert-rules.json"
curl_grafana '/api/v1/provisioning/contact-points' > "$TMPDIR/contact-points.json"
curl_grafana '/api/v1/provisioning/policies' > "$TMPDIR/notification-policies.json"

mkdir -p "$(dirname "$OUTPUT")"
TMP_OUTPUT="$(mktemp "${OUTPUT}.tmp.XXXXXX")"
jq -n \
  --arg exported_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg grafana_url "$GRAFANA_URL" \
  --argjson dashboard_count "$DASHBOARD_COUNT" \
  --argjson datasource_count "$DATASOURCE_COUNT" \
  --slurpfile dashboards "$TMPDIR/dashboards.json" \
  --slurpfile datasources "$TMPDIR/datasources.json" \
  --slurpfile alertRules "$TMPDIR/alert-rules.json" \
  --slurpfile contactPoints "$TMPDIR/contact-points.json" \
  --slurpfile notificationPolicies "$TMPDIR/notification-policies.json" \
  '{
    exported_at: $exported_at,
    grafana_url: $grafana_url,
    counts: { dashboards: $dashboard_count, datasources: $datasource_count },
    dashboards: $dashboards[0],
    datasources: $datasources[0],
    alertRules: $alertRules[0],
    contactPoints: $contactPoints[0],
    notificationPolicies: $notificationPolicies[0]
  }' > "$TMP_OUTPUT"
chmod 600 "$TMP_OUTPUT"
mv -f "$TMP_OUTPUT" "$OUTPUT"

log "OK: $OUTPUT yazıldı (dashboard=$DASHBOARD_COUNT, datasource=$DATASOURCE_COUNT)."

# ── Geri yön (import) — bilinçli olarak script'e YAZILMADI ──
# Dashboard'lar zaten repo'da JSON olarak duruyor (deploy/monitor/grafana/
# dashboards/*.json) ve import-dashboards.sh ile sıfırdan kurulabiliyor —
# bu export'un "import"u pratikte import-dashboards.sh'i tekrar çalıştırmaktır
# (bkz. DR-runbook.md Adım 5). Datasource'lar docker-compose'daki provisioning
# dosyalarından (grafana/provisioning/) otomatik kurulur — elle import
# GEREKMEZ. Alert-provisioning şu an boş olduğundan geri yükleyecek bir şey
# yok; ileride doluysa `POST /api/v1/provisioning/alert-rules` ile tek tek
# eklenir (Grafana'nın kendi provisioning-as-code dosya deseni tercih edilmeli).
