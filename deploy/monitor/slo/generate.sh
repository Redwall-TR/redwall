#!/usr/bin/env bash
# SLO tanımları (slos/*.yml) → Sloth → Prometheus kuralları (generated/*.rules.yml).
# Çıktı GIT'E COMMIT EDİLİR — çalışma anında (sunucuda) Sloth GEREKMEZ.
# Yeni servis eklemek: slos/<ad>.yml yaz → ./generate.sh → commit → rsync → reload.
# (bkz. README.md runbook)
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
SLOTH_IMAGE="ghcr.io/slok/sloth:v0.16.0"       # en son kararlı — Step 1'de doğrulandı
PROM_IMAGE="prom/prometheus:v3.13.0"           # promtool için (compose'daki sürümle aynı)

mkdir -p "$DIR/generated"
for f in "$DIR"/slos/*.yml; do
  name="$(basename "$f" .yml)"
  docker run --rm -v "$DIR:/work" "$SLOTH_IMAGE" generate \
    -i "/work/slos/$name.yml" -o "/work/generated/$name.rules.yml" \
    --default-slo-period=28d
  echo "üretildi: generated/$name.rules.yml"
done

# Sözdizimi doğrulaması (static kurallar dahil) — hatalıysa çık, deploy etme.
# NOT: glob (*.rules.yml) container İÇİNDE genişlemeli — bu yüzden sh -c ile
# çağrılıyor (doğrudan --entrypoint promtool ile host shell glob'u erken
# genişletmeye çalışıp "path does not exist" hatası veriyordu).
docker run --rm --entrypoint sh -v "$DIR:/work" "$PROM_IMAGE" -c \
  'promtool check rules /work/generated/*.rules.yml /work/static/*.rules.yml'
echo "promtool: TAMAM"
