#!/usr/bin/env bash
# Sağlık-kapılı dead-man ping: Prometheus GERÇEKTEN çalışıyorsa healthchecks.io'ya ping atar.
# Kutu ölürse VEYA Prometheus kazımayı durdurursa ping kesilir → healthchecks grace sonrası uyarır.
# ping.url (600, commit EDİLMEZ) healthchecks check'inin ping URL'ini içerir.
set -uo pipefail
HC_URL="$(cat /opt/monitor/deadman/ping.url)"
q(){ docker run --rm --network monitor_monitor-net curlimages/curl:latest -s --max-time 8 "http://prometheus:9090$1" 2>/dev/null; }
q '/-/healthy' | grep -qi 'healthy' || exit 0
# AM de sağlıklı olmalı — AM ölürse tüm alarmlar sessizce kaybolur, bunu dead-man yakalar.
docker run --rm --network monitor_monitor-net curlimages/curl:latest -s --max-time 8 "http://alertmanager:9093/-/healthy" 2>/dev/null | grep -qi 'ok' || exit 0
n=$(q '/api/v1/query?query=count(up==1)' | python3 -c 'import sys,json;r=json.load(sys.stdin).get("data",{}).get("result",[]);print(int(float(r[0]["value"][1])) if r else 0)' 2>/dev/null || echo 0)
[ "${n:-0}" -ge 1 ] || exit 0
curl -fsS --max-time 10 "$HC_URL" >/dev/null
