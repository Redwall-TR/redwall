# Dead-man's switch (healthchecks.io) — "bekçiyi kim izler"

Monitör sunucusu tek nokta arıza; çökerse kör kalınır. Bu, **bağımsız dış heartbeat**:
monitör her dakika healthchecks.io'ya ping atar; ping kesilirse healthchecks.io (monitörden
AYRI bir sistem) e-posta/Telegram ile uyarır.

**Sağlık-kapılı:** `check-and-ping.sh` önce Prometheus'un `/-/healthy` + en az bir `up==1`
target'ı olduğunu doğrular; ancak o zaman ping atar. Böylece "host ayakta ama izleme ölü"
durumu da yakalanır.

## Kurulum (monitör sunucusu)
1. healthchecks.io'da check oluştur (Period 5m, Grace 5m, e-posta/Telegram bildirimi).
2. Ping URL'ini `/opt/monitor/deadman/ping.url`'e yaz (chmod 600 — COMMIT EDİLMEZ).
3. `check-and-ping.sh` → `/opt/monitor/deadman/` (chmod +x).
4. `.service` + `.timer` → `/etc/systemd/system/`; `systemctl daemon-reload && systemctl enable --now redwall-deadman.timer`.

## Test
- Elle: `/opt/monitor/deadman/check-and-ping.sh` → healthchecks "up" olur.
- Dead-man testi: `systemctl stop redwall-deadman.timer` → grace (10 dk) sonra healthchecks uyarısı gelir → tekrar `start`.
