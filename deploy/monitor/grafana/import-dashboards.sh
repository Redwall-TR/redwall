#!/usr/bin/env bash
# Grafana dashboard import (API) — grafana/dashboards/*.json → Grafana.
#
# NEDEN API + script (file-provisioning DEĞİL): Grafana 13, datasources.yml'de
# sabit `uid` verilince provisioning'de çöküyor ("data source not found"). Bu yüzden
# datasource'lar uid'siz (Grafana auto-uid üretir); dashboard'lar bu otomatik uid'lere
# bağlanmalı. Bu script çalışma anında gerçek uid'leri sorgular, dashboard JSON'larındaki
# placeholder uid'leri ("prometheus"/"loki") gerçek uid'lerle değiştirir ve API'den import eder.
#
# Kullanım (monitör sunucusunda veya erişimi olan yerden):
#   GF_URL=https://monitor.redwall.tr GF_USER=admin GF_PASS=... ./import-dashboards.sh
set -euo pipefail

GF_URL="${GF_URL:-https://monitor.redwall.tr}"
GF_USER="${GF_USER:-admin}"
GF_PASS="${GF_PASS:?GF_PASS gerekli (Grafana admin parolası)}"
DIR="$(cd "$(dirname "$0")/dashboards" && pwd)"

echo "Datasource uid'leri sorgulanıyor..."
DS_JSON="$(curl -fsS -u "$GF_USER:$GF_PASS" "$GF_URL/api/datasources")"
PROM_UID="$(printf '%s' "$DS_JSON" | python3 -c 'import sys,json;print(next(d["uid"] for d in json.load(sys.stdin) if d["type"]=="prometheus"))')"
LOKI_UID="$(printf '%s' "$DS_JSON" | python3 -c 'import sys,json;print(next(d["uid"] for d in json.load(sys.stdin) if d["type"]=="loki"))')"
echo "  Prometheus=$PROM_UID  Loki=$LOKI_UID"

for f in "$DIR"/*.json; do
  name="$(basename "$f" .json)"
  body="$(PROM="$PROM_UID" LOKI="$LOKI_UID" F="$f" python3 - <<'PY'
import json,os
d=json.load(open(os.environ["F"]))
prom,loki=os.environ["PROM"],os.environ["LOKI"]
def fix(o):
    if isinstance(o,dict):
        ds=o.get("datasource")
        if isinstance(ds,dict):
            if ds.get("uid")=="prometheus": ds["uid"]=prom
            elif ds.get("uid")=="loki": ds["uid"]=loki
        elif ds=="prometheus": o["datasource"]=prom
        elif ds=="loki": o["datasource"]=loki
        for v in o.values(): fix(v)
    elif isinstance(o,list):
        for v in o: fix(v)
fix(d); d["id"]=None
print(json.dumps({"dashboard":d,"overwrite":True}))
PY
)"
  status="$(printf '%s' "$body" | curl -fsS -u "$GF_USER:$GF_PASS" -H 'Content-Type: application/json' -X POST "$GF_URL/api/dashboards/db" --data-binary @- | python3 -c 'import sys,json;d=json.load(sys.stdin);print("OK",d.get("url")) if d.get("status")=="success" else print("HATA",d.get("message"))')"
  echo "  $name → $status"
done
echo "Bitti."
