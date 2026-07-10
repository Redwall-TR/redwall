#!/usr/bin/env bash
# reapply-traefik-metrics.sh — ERP (Frappe) redwall.yml Traefik metrik-flag'lerini
# İDEMPOTENT şekilde yeniden uygular.
#
# NEDEN: /opt/frappe_docker/redwall.yml elle eklenmiş Traefik Prometheus metrik
# flag'leri taşıyor (bkz. README.md "Traefik metrikleri"). Frappe'nin sürüm
# yükseltme / config-regenerate akışı bu dosyayı YENİDEN OLUŞTURABİLİR ve elle
# eklenen flag'ler SİLİNEBİLİR (erp sunucusunda geçmişte `redwall.yml.bak-pre-v16-*`
# yedekleri bu tür regenerate'lerin izidir). Frappe'nin generate mekanizması
# frappe_docker reposunun kendi tooling'i olduğundan (repo-dışı), tam-IaC/otomatik
# önleme mümkün değil — bu script regenerate SONRASI ELLE çalıştırılan bir
# telafi/reapply aracıdır. Tur 3 Task 10 (K2).
#
# Kullanım (ERP sunucusunda, regenerate/upgrade sonrası):
#   /opt/redwall-mon/reapply-traefik-metrics.sh [redwall.yml yolu]
# Varsayılan yol: /opt/frappe_docker/redwall.yml
#
# Davranış:
#   1. Traefik command bloğunda gerekli 5 metrik flag'i var mı kontrol eder.
#   2. Hepsi zaten varsa: HİÇBİR ŞEYE DOKUNMAZ, "idempotent" mesajıyla çıkar
#      (traefik yeniden başlatılmaz — gereksiz kesinti yok).
#   3. Eksik varsa: dosyayı timestamp'li yedekler → eksik flag'leri traefik
#      command bloğuna (--accesslog=true çapa satırından sonra) ekler →
#      `docker compose config -q` ile sözdizimini DOĞRULAR → yalnız doğrulama
#      BAŞARILIYSA dosyayı günceller ve SADECE traefik servisini yeniden
#      oluşturur (`docker compose up -d traefik`; backend/db/queue/websocket
#      vb. diğer servislere DOKUNULMAZ).
#   4. Doğrulama başarısız olursa (çapa satırı bulunamadı veya sözdizimi
#      geçersiz) HİÇBİR ŞEY UYGULANMAZ, orijinal dosya bozulmadan kalır, script
#      hata koduyla çıkar — operatör elle müdahale eder.
#
# Referans: deploy/monitor/exporters/README.md ("Traefik metrikleri" bölümü),
# .superpowers/sdd/task-10-report.md (redwall repo, Tur 3 Task 10).

set -euo pipefail

COMPOSE_FILE="${1:-/opt/frappe_docker/redwall.yml}"
ANCHOR='- --accesslog=true'
REQUIRED_FLAGS=(
  '--entrypoints.metrics.address=:8082'
  '--metrics.prometheus=true'
  '--metrics.prometheus.entrypoint=metrics'
  '--metrics.prometheus.addEntryPointsLabels=true'
  '--metrics.prometheus.addServicesLabels=true'
)

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "HATA: $COMPOSE_FILE bulunamadı." >&2
  exit 1
fi

missing=()
for f in "${REQUIRED_FLAGS[@]}"; do
  if ! grep -qF -- "$f" "$COMPOSE_FILE"; then
    missing+=("$f")
  fi
done

if [[ ${#missing[@]} -eq 0 ]]; then
  echo "OK — tüm Traefik metrik flag'leri zaten mevcut, değişiklik gerekmedi (idempotent)."
  exit 0
fi

echo "Eksik flag(ler) bulundu:"
printf '  %s\n' "${missing[@]}"

if ! grep -qF -- "$ANCHOR" "$COMPOSE_FILE"; then
  echo "HATA: Yerleştirme çapası ('$ANCHOR') $COMPOSE_FILE içinde bulunamadı." >&2
  echo "Traefik command bloğu beklenenden farklı yapılandırılmış olabilir — ELLE düzeltin." >&2
  exit 2
fi

TS=$(date +%Y%m%d-%H%M%S)
BACKUP="${COMPOSE_FILE}.bak-reapply-metrics-${TS}"
cp "$COMPOSE_FILE" "$BACKUP"
echo "Yedek alındı: $BACKUP"

TMP=$(mktemp)
CONFIG_ERR=$(mktemp)
trap 'rm -f "$TMP" "$CONFIG_ERR"' EXIT

# Çapa satırından sonra eksik flag'leri, çapa satırıyla aynı girintiyle ekle.
# NOT: -v ile awk'a çok-satırlı string geçmek bazı awk uygulamalarında ("newline
# in string") hataya yol açar — bu yüzden flag'ler tek satırda \x01 ile ayrılıp
# awk içinde split() ile satır satır basılır (macOS/BSD awk + gawk uyumlu).
INDENT=$(grep -F -- "$ANCHOR" "$COMPOSE_FILE" | head -1 | sed -E 's/^([[:space:]]*).*/\1/')
JOINED_MISSING=$(IFS=$'\x01'; echo "${missing[*]}")

awk -v anchor="$ANCHOR" -v indent="$INDENT" -v joined="$JOINED_MISSING" '
BEGIN { n = split(joined, flags, "\x01") }
{
  print $0
  if (index($0, anchor) > 0) {
    for (i = 1; i <= n; i++) {
      print indent "- " flags[i]
    }
  }
}
' "$COMPOSE_FILE" > "$TMP"

echo "Sözdizimi doğrulanıyor (docker compose config -q)..."
if ! docker compose -f "$TMP" config -q 2>"$CONFIG_ERR"; then
  echo "HATA: Değişiklik sonrası compose sözdizimi geçersiz — HİÇBİR ŞEY UYGULANMADI." >&2
  cat "$CONFIG_ERR" >&2
  exit 3
fi

cp "$TMP" "$COMPOSE_FILE"
echo "Uygulandı: $COMPOSE_FILE güncellendi."

echo "Traefik yeniden oluşturuluyor (YALNIZ traefik servisi, diğer servisler etkilenmez)..."
cd "$(dirname "$COMPOSE_FILE")"
docker compose -f "$(basename "$COMPOSE_FILE")" up -d traefik

echo "Doğrulama:"
docker compose -f "$(basename "$COMPOSE_FILE")" ps traefik

echo "Tamamlandı. Uygulanan flag'ler:"
printf '  %s\n' "${REQUIRED_FLAGS[@]}"
