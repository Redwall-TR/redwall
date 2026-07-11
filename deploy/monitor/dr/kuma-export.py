#!/usr/bin/env python3
"""
kuma-export.py — Uptime Kuma runtime-config'ini (monitörler + bildirimler +
status-page'ler + API-key metadata'sı) JSON'a döker. DR (felaket kurtarma)
için: Kuma'nın tüm ayarları YALNIZ sqlite DB'sinde yaşar (repo'da YOK), bu
script kutu-içi gece yedeğine (box-backup.sh) eklenerek konfigürasyonun
insan-okunur/import-edilebilir bir kopyasını da tutar.

KİMLİK DOĞRULAMA — keşif notu:
  Bu Kuma kurulumunda Settings → "disableAuth" AÇIK (true). Bu bilinçli bir
  tercih: Kuma'nın kendi login formu, durum.redwall.tr'ye zaten Authentik
  forward-auth (SSO) ile giriş yapmış insanlar için GEREKSİZ ikinci bir kapı
  olurdu. disableAuth açıkken Kuma sunucusu, socket.io ile bağlanan HER
  soket'i otomatik olarak admin kullanıcı olarak login eder (server.js:
  "if (await setting('disableAuth')) { afterLogin(socket, ...) }").
  Bu yüzden bu script'in kullanıcı adı/parola/2FA'ya İHTİYACI YOK — güvenlik
  sınırı ağ seviyesinde: yalnız monitor_monitor-net içindeki container'lar
  uptime-kuma:3001'e erişebilir (Traefik'e host-publish YOK). Dıştan erişim
  zaten Cloudflare-IP-allowlist + Authentik forward-auth ile korunuyor
  (bkz. docker-compose.yml kuma servisi label'ları).
  disableAuth ileride kapatılırsa: KUMA_USERNAME/KUMA_PASSWORD/KUMA_TOTP_SECRET
  ortam değişkenleriyle normal login+2FA akışına geçmek için `_login()`
  fonksiyonunu genişletin (login event'i zaten data.token alanını destekler,
  bkz. Kuma server.js socket.on("login")).

KULLANIM:
  # Dışa aktar (varsayılan: /opt/monitor-backups/kuma-config.json)
  python3 kuma-export.py export

  # Cert-bitiş bildirimini tüm HTTPS monitörlerinde aç (Tur 3 Task 8 — Adım 4)
  python3 kuma-export.py export --enable-cert-expiry

  # Geri yönde: bir export JSON'ından monitör+bildirimleri YENİDEN OLUŞTUR
  # (DR sırasında, sıfırdan kurulmuş boş bir Kuma'ya). İSİM eşleşen kayıtlar
  # ATLANIR (idempotent — tekrar çalıştırmak güvenli, çift kayıt oluşturmaz).
  # NOT: status-page'ler bu script ile import EDİLMEZ (Kuma'da tek status-page
  # var, düşük karmaşıklık — DR-runbook.md'de elle adım olarak anlatılmıştır).
  python3 kuma-export.py import --input /opt/monitor-backups/kuma-config.json

Çalıştırma ortamı: monitor_monitor-net ağına bağlı bir container (örn.
`docker run --rm --network monitor_monitor-net -v ...:/script.py:ro
python:3.12-slim bash -c "pip install --quiet 'python-socketio[client]' &&
python3 /script.py export"`) — host'ta pip3 YOK (keşif: 2026-07-11), bu
yüzden bağımlılıklar her çalıştırmada ephemeral container içinde kurulur.
box-backup.sh bu deseni zaten kullanıyor (bkz. backup/box-backup.sh).
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import threading
import time
from datetime import datetime, timezone

try:
    import socketio  # python-socketio[client]
except ImportError:
    print(
        "HATA: python-socketio paketi yok. Bu script container-içinde "
        "'pip install python-socketio[client]' sonrası çalıştırılmalı "
        "(bkz. dosya başındaki KULLANIM notu).",
        file=sys.stderr,
    )
    sys.exit(1)

DEFAULT_KUMA_URL = os.environ.get("KUMA_URL", "http://uptime-kuma:3001")
DEFAULT_OUTPUT = os.environ.get("KUMA_EXPORT_OUTPUT", "/opt/monitor-backups/kuma-config.json")
CONNECT_TIMEOUT = 15
EVENT_TIMEOUT = 20

# Kuma'da TLS/sertifika kontrolü anlamlı olan monitör tipleri (HTTP ailesi).
# "group" gibi konteyner monitörlerde url yok, cert-expiry uygulanamaz.
HTTPS_CAPABLE_TYPES = {"http", "keyword", "json-query"}


class KumaSession:
    """socket.io bağlantısını açar, ilk push'ları (monitorList vb.) toplar."""

    def __init__(self, url: str):
        self.url = url
        self.sio = socketio.Client(logger=False, engineio_logger=False)
        self.state: dict = {}
        self._events = {
            "monitorList": threading.Event(),
            "notificationList": threading.Event(),
            "statusPageList": threading.Event(),
            "apiKeyList": threading.Event(),
        }
        for name in self._events:
            self.sio.on(name, self._make_handler(name))

    def _make_handler(self, name):
        def handler(data):
            self.state[name] = data
            self._events[name].set()

        return handler

    def connect(self):
        self.sio.connect(self.url, transports=["websocket"], wait_timeout=CONNECT_TIMEOUT)
        for name, ev in self._events.items():
            if not ev.wait(timeout=EVENT_TIMEOUT):
                raise TimeoutError(
                    f"'{name}' olayı {EVENT_TIMEOUT}s içinde gelmedi — Kuma "
                    "disableAuth kapalı olabilir (bkz. dosya başı notu) ya da "
                    "ağ erişimi yok."
                )

    def disconnect(self):
        if self.sio.connected:
            self.sio.disconnect()

    def emit_ack(self, event: str, *args, timeout: int = EVENT_TIMEOUT) -> dict:
        """callback bekleyen bir socket.io emit — sonucu senkron döner."""
        done = threading.Event()
        result: dict = {}

        def cb(res=None):
            if res is not None:
                result.update(res)
            done.set()

        self.sio.emit(event, *args, callback=cb)
        if not done.wait(timeout=timeout):
            raise TimeoutError(f"'{event}' emit'ine {timeout}s içinde callback gelmedi.")
        return result


def cmd_export(args):
    session = KumaSession(args.kuma_url)
    session.connect()
    try:
        monitors = session.state.get("monitorList", {})
        notifications = session.state.get("notificationList", [])
        status_pages = session.state.get("statusPageList", {})
        api_keys = session.state.get("apiKeyList", [])

        if args.enable_cert_expiry:
            _enable_cert_expiry(session, monitors)
            # editMonitor sonrası state güncel değil — objeleri yerinde işaretledik
            # (aşağıdaki _enable_cert_expiry monitors dict'ini mutasyona uğratıyor).

        export_obj = {
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "kuma_url": args.kuma_url,
            "counts": {
                "monitors": len(monitors),
                "notifications": len(notifications),
                "status_pages": len(status_pages),
                "api_keys": len(api_keys),
            },
            "monitors": monitors,
            "notifications": notifications,
            "statusPages": status_pages,
            "apiKeys": api_keys,
        }
    finally:
        session.disconnect()

    _write_json_atomic(args.output, export_obj)

    print(
        f"[kuma-export] OK: {args.output} yazıldı "
        f"(monitör={len(monitors)}, bildirim={len(notifications)}, "
        f"status-page={len(status_pages)}, api-key={len(api_keys)})",
        file=sys.stderr,
    )
    return 0


def _enable_cert_expiry(session: KumaSession, monitors: dict):
    """Her HTTPS monitöründe expiryNotification=true yapar (Tur 3 Task 8 — Adım 4).

    Bildirimlerin KENDİSİ (Telegram/E-posta) değiştirilmez — yalnız monitör
    başına 'sertifika bitiyor mu kontrol et' bayrağı açılır. Bildirim hangi
    kanaldan gideceği zaten monitörün notificationIDList'inde tanımlı, o alan
    DOKUNULMADAN aynen editMonitor'a geri gönderilir.
    """
    already, changed, failed = 0, 0, []
    for mid, monitor in monitors.items():
        mtype = monitor.get("type")
        url = monitor.get("url") or ""
        if mtype not in HTTPS_CAPABLE_TYPES or not url.startswith("https://"):
            continue
        if monitor.get("expiryNotification"):
            already += 1
            continue
        payload = dict(monitor)
        payload["expiryNotification"] = True
        try:
            result = session.emit_ack("editMonitor", payload)
        except TimeoutError as exc:
            failed.append((mid, monitor.get("name"), str(exc)))
            continue
        if result.get("ok"):
            monitor["expiryNotification"] = True  # export'a da yansısın
            changed += 1
            print(
                f"[kuma-export] cert-expiry açıldı: id={mid} name={monitor.get('name')!r}",
                file=sys.stderr,
            )
        else:
            failed.append((mid, monitor.get("name"), result.get("msg", "bilinmeyen hata")))

    print(
        f"[kuma-export] cert-expiry özet: zaten-açık={already} yeni-açılan={changed} "
        f"başarısız={len(failed)}",
        file=sys.stderr,
    )
    for mid, name, msg in failed:
        print(f"[kuma-export]   HATA id={mid} name={name!r}: {msg}", file=sys.stderr)

    if failed:
        raise RuntimeError(
            f"{len(failed)} monitörde cert-expiry açılamadı — box-backup.sh'in "
            "bunu FAIL saymasını istiyorsak burada exit≠0 gerekir."
        )


def cmd_import(args):
    with open(args.input, "r", encoding="utf-8") as f:
        data = json.load(f)

    session = KumaSession(args.kuma_url)
    session.connect()
    try:
        existing_notifications = session.state.get("notificationList", [])
        existing_by_name = {n["name"]: n["id"] for n in existing_notifications}

        # ── 1) Bildirimler önce (monitörler notificationIDList ile bunlara referans verir) ──
        old_to_new_notification_id: dict = {}
        for notif in data.get("notifications", []):
            name = notif.get("name")
            if name in existing_by_name:
                old_to_new_notification_id[notif["id"]] = existing_by_name[name]
                print(f"[kuma-import] bildirim zaten var, atlandı: {name!r}", file=sys.stderr)
                continue
            # notif["config"] bir JSON STRING'dir (Kuma DB'de böyle saklanır) —
            # addNotification'ın beklediği payload budur (name/type/isDefault +
            # sağlayıcıya özel alanlar), sarmalayan {id,active,userId,...} DEĞİL.
            config = json.loads(notif["config"])
            result = session.emit_ack("addNotification", config, None)
            if not result.get("ok"):
                raise RuntimeError(f"Bildirim eklenemedi ({name!r}): {result}")
            old_to_new_notification_id[notif["id"]] = result["id"]
            print(f"[kuma-import] bildirim eklendi: {name!r} -> id={result['id']}", file=sys.stderr)

        # ── 2) Monitörler — önce group'lar (parent yok), sonra çocuklar ──
        existing_monitors = session.state.get("monitorList", {})
        existing_names = {m["name"] for m in existing_monitors.values()}

        monitors = data.get("monitors", {})
        ordered = sorted(monitors.values(), key=lambda m: 0 if m.get("type") == "group" else 1)

        old_to_new_monitor_id: dict = {}
        for monitor in ordered:
            name = monitor.get("name")
            if name in existing_names:
                print(f"[kuma-import] monitör zaten var, atlandı: {name!r}", file=sys.stderr)
                continue

            payload = dict(monitor)
            # Frontend/DB-türetilmiş alanları temizle — "add" event'i bunları
            # kabul etmez ya da anlamsızdır (bkz. Kuma server.js socket.on("add")).
            for key in (
                "id", "path", "pathName", "childrenIDs", "screenshot",
                "cacheBust", "includeSensitiveData", "dns_last_result",
                "maintenance", "active", "forceInactive",
            ):
                payload.pop(key, None)

            # notificationIDList eski id'lerle geldi — yeni id'lere remap et.
            old_notif_ids = payload.get("notificationIDList") or {}
            payload["notificationIDList"] = {
                str(old_to_new_notification_id.get(int(k), k)): v
                for k, v in old_notif_ids.items()
            }

            # parent eski monitör id'sine işaret ediyor olabilir — henüz remap
            # edemiyoruz (group'lar ilk sırada oluşturuluyor ama id'ler farklı
            # olacak). Best-effort: parent'ı None bırak, DR-runbook.md'de bu
            # elle-bağlanacak adım olarak not edilmiştir.
            if payload.get("parent") is not None:
                print(
                    f"[kuma-import] UYARI: {name!r} bir gruba bağlıydı (parent="
                    f"{payload['parent']}), import sonrası bu bağ ELLE kurulmalı "
                    "(bkz. DR-runbook.md).",
                    file=sys.stderr,
                )
                payload["parent"] = None

            result = session.emit_ack("add", payload)
            if not result.get("ok"):
                raise RuntimeError(f"Monitör eklenemedi ({name!r}): {result}")
            old_to_new_monitor_id[monitor["id"]] = result.get("monitorID")
            print(f"[kuma-import] monitör eklendi: {name!r}", file=sys.stderr)

        print(
            "[kuma-import] TAMAMLANDI. Status-page'ler bu script ile import "
            "EDİLMEDİ — DR-runbook.md'deki elle adımı izleyin.",
            file=sys.stderr,
        )
    finally:
        session.disconnect()

    return 0


def _write_json_atomic(path: str, obj: dict):
    """tmp+mv — yarım-yazılmış dosya asla görünmez (box-backup.sh deseniyle aynı)."""
    out_dir = os.path.dirname(path)
    os.makedirs(out_dir, exist_ok=True)
    tmp_path = f"{path}.tmp.{os.getpid()}"
    # 0600 ile AÇILIR (sonradan chmod değil) — secret içerik umask penceresine hiç düşmez.
    fd = os.open(tmp_path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
    os.replace(tmp_path, path)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--kuma-url", default=DEFAULT_KUMA_URL, help=f"varsayılan: {DEFAULT_KUMA_URL}")
    sub = parser.add_subparsers(dest="command", required=True)

    p_export = sub.add_parser("export", help="monitör+bildirim+status-page'leri JSON'a dök")
    p_export.add_argument("--output", default=DEFAULT_OUTPUT, help=f"varsayılan: {DEFAULT_OUTPUT}")
    p_export.add_argument(
        "--enable-cert-expiry",
        action="store_true",
        help="tüm HTTPS monitörlerinde expiryNotification=true yap (Adım 4)",
    )
    p_export.set_defaults(func=cmd_export)

    p_import = sub.add_parser("import", help="export JSON'ından monitör+bildirim geri yükle (DR)")
    p_import.add_argument("--input", required=True, help="kuma-export.py export çıktısı")
    p_import.set_defaults(func=cmd_import)

    args = parser.parse_args()
    try:
        sys.exit(args.func(args))
    except Exception as exc:  # noqa: BLE001 — CLI hata çıkışı, box-backup.sh bunu FAIL saymalı
        print(f"[kuma-{args.command}] HATA: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
