# Authentik SSO — Ops Sunucu Kurulumu

Redwall'un 4 iç panelini (Grafana, Uptime Kuma, Umami, GlitchTip) tek bir merkezi kimlik
doğrulama katmanının arkasına toplayan self-hosted SSO. Bu, **monitör/ops sunucusunda**
(194.62.52.22, Traefik + monitor_monitor-net ile birlikte) çalışır — redwall web VDS'inde DEĞİL.

## Ön koşullar
1. **DNS (Cloudflare, turuncu/proxied):** `auth` A kaydı → ops sunucu IP'si.
2. **Cloudflare SSL:** zone geneli "Full" (redwall.tr). Monitör deseniyle aynı — ACME/Let's
   Encrypt YOK, Traefik self-signed cert sunar (`tls=true`).
3. Sunucuda Docker Engine + compose plugin kurulu (monitör hub kurulumuyla aynı — bkz.
   `deploy/monitor/README.md`).
4. `monitor_monitor-net` ağı zaten var olmalı (monitör hub'ı ile paylaşılır).

## Kurulum
```bash
# 1) Deploy dizinini sunucuya al (örn. /opt/authentik)
mkdir -p /opt/authentik && cd /opt/authentik
# (deploy/authentik içeriğini buraya kopyala: git clone veya scp)

# 2) .env üret
cp .env.example .env && nano .env
# AUTHENTIK_SECRET_KEY, AUTHENTIK_PG_PASSWORD, AUTHENTIK_BOOTSTRAP_PASSWORD,
# AUTHENTIK_BOOTSTRAP_TOKEN → openssl rand -base64 36 ile güçlü değerler üret.
chmod 600 .env

# 3) Ayağa kaldır
docker compose up -d
docker compose ps
```

İlk boot sonrası `https://auth.redwall.tr` üzerinden `akadmin` kullanıcısı ve
`.env`'deki `AUTHENTIK_BOOTSTRAP_PASSWORD` ile giriş yapılabilir. `AUTHENTIK_BOOTSTRAP_TOKEN`
otomasyon (API) erişimi için üretilir — yalnız ilk boot'ta işlenir, sonrasında panelden
yönetilir.

## Runbook

### Break-glass

SSO, izlediği kutunun kendisinde yaşıyor — Authentik çökerse panellere erişim ANINDA gerekebilir.
İki katman var, ikisi de tatbikatla kanıtlandı (2026-07-09, ~55s kesinti, alarm tetiklenmedi —
bkz. `.superpowers/sdd/task-8-report.md`); davranış Tur 3 Task 9'da DEĞİŞTİ, aşağıda güncel:

**Kesinti anındaki davranış — 5xx (fail-closed, BEKLENEN, Tur 3 Task 9 sonrası):** Authentik-server
durunca `durum.redwall.tr` / `analitik.redwall.tr` artık **500/502 bad-gateway** döner (404 DEĞİL).
Sebep: `authentik-fa` (forwardAuth) middleware'i Tur 3 Task 9'da container label'ından Traefik
file-provider'a taşındı (`deploy/monitor/traefik/dynamic.yml`, router'lar `authentik-fa@file` ile
referans verir) — bu yüzden authentik-server durunca middleware TANIMI kaybolmuyor, router
AYAKTA kalıyor; yalnız forwardAuth'un hedef adresine (`http://authentik-server:9000/...`)
ulaşamadığı için Traefik 5xx döndürüyor. **T8 döneminde** (bu değişiklikten ÖNCE) middleware
container label'ında tanımlıydı; container durunca middleware TANIMI da kaybolur, onu
referanslayan router TAMAMEN düşerdi (404). Her iki davranış da FAIL-CLOSED'tır (auth
ATLANMAZ, panel asla auth'suz dışarı açılmaz) — yalnız hata kodu ve router'ın kendisinin
ayakta kalıp kalmadığı değişti (canlı doğrulandı: `.superpowers/sdd/task-9-report.md`).
Erişim için tünel deseni AYNEN geçerli, aşağıda:

**auth.redwall.tr'nin KENDİSİ (authentik-server'ın router'ı, forward-auth'a bağlı DEĞİL):**
authentik-server container'ı durunca kendi router'ı da Traefik docker-provider'dan düşer (404) —
bu kaçınılmaz: router doğrudan bu container'a bağlı backend'dir, container yoksa yönlendirilecek
yer yok. Bu, Tur 3 Task 9'un çözdüğü CROSS-CONTAINER kırılganlıktan (BAŞKA container'ların
middleware referansı kaybolması) FARKLI ve dokunulamaz bir sınır — Kuma'nın kendi restart'ında da
aynı desen gözlenir (kendi router'ı kısa süre 404, ama BAŞKA hiçbir panel etkilenmez).

**1) Grafana yerel admin fallback (kullanıcı testi gerektirmez):**
Grafana login ekranında Authentik OIDC butonunun YANINDA klasik kullanıcı/parola formu her
zaman açık kalır (`oauth_auto_login=false`). Parola sunucuda `/opt/monitor/.env` →
`GF_ADMIN_PASSWORD`. Authentik tamamen çökse bile bu form çalışmaya devam eder — Grafana kendi
oturum/parola doğrulamasını yapar, Authentik'e hiç sormaz.

**2) SSH-tünel doğrudan erişim (Kuma/Umami/GlitchTip — forward-auth'un arkasındaki gerçek panel):**
```bash
# a) Panel container'ının iç IP'sini bul (compose ağı, monitor_monitor-net)
ssh root@194.62.52.22 "docker inspect \$(docker ps -qf name=uptime-kuma) \
  --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'"
# → örn. 172.18.0.5 (Kuma iç portu 3001; Umami 3000; GlitchTip glitchtip-web 8000)

# b) Tünel aç (container-IP:port'a doğrudan, Traefik/forward-auth'u TAMAMEN atlar)
ssh -f -N -L 13005:172.18.0.5:3001 root@194.62.52.22
curl -sI http://localhost:13005          # 200/302 bekleniyor (panelin kendi davranışı)

# c) Test bitince MUTLAKA kapat
pkill -f "13005:172.18.0.5:3001"
ps aux | grep "13005:172.18.0.5:3001" | grep -v grep || echo "tünel kapandı"
```
Bu yol internete hiçbir şey açmaz (yalnız SSH ile ulaşılabilir), Authentik'in durumundan
tamamen bağımsızdır ve Kuma/Umami/GlitchTip'in **kendi** giriş formuna düşer.

**Acil middleware-kaldırma (son çare, yalnız forward-auth'lu paneller — Kuma/Umami; Grafana/GlitchTip'i
etkilemez çünkü onlar native OIDC kullanır, forward-auth'a bağlı değil):** SSH-tüneli yeterli
olmuyorsa (ör. tam kesinti gerekiyorsa) sunucuda tek satırlık geri-alma:
```bash
# Kuma (Tur 3 Task 9 sonrası: middleware referansları @file son eki taşır):
ssh root@194.62.52.22 "sed -i 's/cloudflare-ips@file,authentik-fa@file/cloudflare-ips@file/' /opt/monitor/docker-compose.yml && cd /opt/monitor && docker compose up -d uptime-kuma"
# Umami:
ssh root@194.62.52.22 "sed -i 's/cloudflare-ips@file,authentik-fa@file/cloudflare-ips@file/' /opt/umami/docker-compose.yml && cd /opt/umami && docker compose up -d umami"
```
DİKKAT: bu, panelin ham iç girişini (Kuma'da `disableAuth=true` olduğu için hiç giriş formu bile
YOK — 2026-07-09'da canlı doğrulandı: `sqlite3 /app/data/kuma.db` → `disableAuth|true`) veya
Umami'nin kendi giriş formunu doğrudan internete açar.
Yalnız gerçek acil durumda kullan, sorun çözülünce satırı geri al (`authentik-fa` middleware'ini ekle).

**Tatbikat komutları (aynen tekrarlanabilir, kanıtlı sıra):**
```bash
cd /opt/authentik && docker compose stop authentik-server   # kesinti başlar
# ... yukarıdaki (1) ve (2) testleri burada yapılır ...
docker compose start authentik-server
# healthy bekle:
for i in $(seq 1 30); do
  S=$(docker inspect authentik-authentik-server-1 --format '{{.State.Health.Status}}')
  [ "$S" = "healthy" ] && break
  sleep 3
done
```

### Yeni kullanıcı

**1) Authentik'te kullanıcı yarat + gruba ata (API veya UI: Directory → Users):**
```bash
POST https://auth.redwall.tr/api/v3/core/users/
Authorization: Bearer <AUTHENTIK_BOOTSTRAP_TOKEN veya panel admin API token>
{"username":"<kullanici>","name":"<Ad Soyad>","email":"<eposta>","is_active":true,
 "groups":["<monitor-admins veya monitor-viewers grup pk'si>"]}
```
Grup pk'leri: `GET core/groups/?name=monitor-admins` / `?name=monitor-viewers` ile bulunur
(sabit değerler değişebilir — her seferinde sorgulanmalı).

Parola belirleme — SMTP olmadığı için kullanıcı kendi kendine "parolamı unuttum" YAPAMAZ
(bkz. "Bilinen sınırlar"). Admin recovery-linki üretir:
```bash
POST https://auth.redwall.tr/api/v3/core/users/<pk>/recovery/
→ {"link": "https://auth.redwall.tr/if/flow/default-recovery-flow/?flow_token=..."}
```
Link tek-kullanımlık; kullanıcıya güvenli bir kanaldan (elden, şifreli mesaj vb.) iletilir — asla
git/commit/rapor gibi kalıcı/paylaşımlı bir yere yazılmaz. İlk girişte TOTP kurulumu ZORUNLU
(device_classes: totp + webauthn opsiyonel) — kullanıcı QR ile kendi authenticator'ını bağlar.

**2) Grafana (monitor.redwall.tr) — otomatik, ek adım YOK:** kullanıcı ilk kez Authentik
üzerinden "Sign in with Authentik" ile giriş yaptığında `groups` claim'i okunur, rol otomatik
eşlenir (`monitor-admins`→Admin, `monitor-viewers`→Viewer, grupsuzsa erişim yok —
`ROLE_ATTRIBUTE_STRICT=true`). Grafana tarafında elle bir şey yapmaya gerek yok.

**3) GlitchTip (hata.redwall.tr) — org ataması MANUEL (otomatik değil):** `ENABLE_ORGANIZATION_CREATION=false`
olduğu için ilk SSO girişinde kullanıcı hesabı açılır ama HİÇBİR org'a otomatik üye edilmez.
Sunucuda (`/opt/glitchtip`), kullanıcı en az bir kez SSO ile giriş yaptıktan SONRA (kayıt böylece
oluşur), org üyeliği `manage.py shell` ile elle eklenir — Task 7/kontrolör deseni (2026-07-09
canlı doğrulandı, iç model yolu `django.apps.apps.get_model` ile keşfedildi, doğrudan
`from organizations_ext...` import YOLU YOK — app label modül yolundan farklı):
```bash
docker exec -i glitchtip-glitchtip-web-1 python manage.py shell <<'PY'
from django.apps import apps
from django.contrib.auth import get_user_model
Organization = apps.get_model("organizations_ext", "Organization")
OrganizationUser = apps.get_model("organizations_ext", "OrganizationUser")
User = get_user_model()

org = Organization.objects.get(slug="redwall-yazlm-dansmanlk-ve-muhendislik-hizmetleri")
user = User.objects.get(email="<yeni-kullanicinin-eposta-adresi>")
# role: 0=Member, 1=Admin, 2=Manager, 3=Owner
ou, created = OrganizationUser.objects.get_or_create(organization=org, user=user, defaults={"role": 0})
print("OrganizationUser id:", ou.id, "created:", created, "role:", ou.role)
PY
```
Mevcut örnek: `admin@redwall.tr` (yedek hesap) ve `hamdikalayci@gmail.com` ikisi de rol=3 (Owner).
Yeni ekip üyeleri için genelde `role=0` (Member) yeterli.

**4) Kuma (durum.redwall.tr) / Umami (analitik.redwall.tr):** panel-içi hesap YOK/gerekmiyor —
forward-auth kapısından geçen HERKES Authentik kimliğiyle içeri girer (Kuma: `disableAuth=true`,
kendi kullanıcı kavramı devre dışı; Umami: kendi girişi hâlâ ayrı — bkz. envanter altında "çift
giriş" notu). Yani "yeni kullanıcı Kuma'ya eklensin" diye ayrı bir adım YOK — Authentik grubuna
eklemek yeterli erişimi Authentik seviyesinde sağlar (RBAC panel-içi değil, forward-auth
seviyesinde "girebilir/giremez" ikili — ince taneli rol ayrımı yok).

### Oturum öldürme

**Tek kullanıcı / tekil oturum (UI, en kolay):** Authentik admin arayüzü → **Directory → Users**
→ kullanıcıya tıkla → **Sessions** sekmesi → ilgili satırda **Terminate Session**.

**Toplu (kullanıcının TÜM oturumları, API):**
```bash
# 1) kullanıcının tüm oturumlarını listele
GET https://auth.redwall.tr/api/v3/core/authenticated_sessions/?user=<user_pk>

# 2) her birini sil (UUID başına)
DELETE https://auth.redwall.tr/api/v3/core/authenticated_sessions/<session_uuid>/
```
(`core/authenticated_sessions/` liste uç noktası yalnız GET/HEAD/OPTIONS kabul eder — filtreleme
`?user=` ile yapılır; silme yalnız tekil `<uuid>/` alt-yolunda DELETE ile — toplu-sil tek çağrı
YOK, listeleyip döngüyle silmek gerekir.) Oturum silinince o tarayıcı bir sonraki istekte
Authentik'e yeniden yönlenir — panel tarafındaki (Grafana/Kuma/Umami/GlitchTip) kendi çerezi de
forward-auth/OIDC akışı yeniden tetiklendiğinde geçersiz kalır.

**Tüm kullanıcılar (acil, tüm ekip oturumlarını topluca düşürmek gerekirse):** yukarıdaki listeyi
`?user=` filtresi OLMADAN çekip tüm UUID'leri döngüyle sil — Authentik'te ayrı bir "tümünü
öldür" düğmesi/uç noktası yok, script gerekir.

### Panel entegrasyon envanteri

| Panel | Yöntem | Geri-alma (tek satır) |
|---|---|---|
| **Grafana** (monitor.redwall.tr) | Native OIDC (`generic_oauth`), yerel admin fallback açık, grup→rol eşleme | `deploy/monitor/docker-compose.yml` grafana `environment:` bloğundaki `GF_AUTH_GENERIC_OAUTH_*` (12 satır) sil + redeploy — yerel admin girişi zaten hep çalışır, geri-alma riski YOK |
| **GlitchTip** (hata.redwall.tr) | Native OIDC (django-allauth, DB'de `SocialApp` kaydı — env değil) | Sunucuda `manage.py shell`: `SocialApp.objects.filter(provider_id="authentik").delete()` — login ekranından Authentik butonu kaybolur, e-posta/parola girişi kayıt kapalı olduğu için hâlâ YOK (org-owner hesapları panelden parola sıfırlayabilir) |
| **Uptime Kuma** (durum.redwall.tr) | Forward-auth (Traefik middleware, Tur 3 Task 9'dan beri file-provider'da `authentik-fa@file`) + `disableAuth=true` (iç giriş TAMAMEN kapalı — 2026-07-09'da canlı doğrulandı, sqlite: disableAuth=true) | `deploy/monitor/docker-compose.yml` kuma router `middlewares` satırından `,authentik-fa@file` çıkar + redeploy. **DİKKAT:** `disableAuth=true` geri açılmadan middleware kaldırılırsa Kuma TAMAMEN AUTH'SUZ kalır (herkes girer) — acil durumda önce Kuma ayarından "Disable Auth"ı kapatıp kendi parolasını geri kur, SONRA middleware'i kaldır |
| **Umami** (analitik.redwall.tr) | Forward-auth (Traefik middleware, Tur 3 Task 9'dan beri file-provider'da `authentik-fa@file`), iç giriş AÇIK bırakıldı (çift giriş, bilinçli) | `deploy/umami/docker-compose.yml` umami router `middlewares` satırından `,authentik-fa@file` çıkar + redeploy — Umami'nin kendi girişi zaten canlı olduğu için risk yok |

**Umami public-uç istisnası (KRİTİK, unutulursa site analitiği kırılır):** `script.js` ve
`/api/send` redwall.tr'nin anonim ziyaretçi tarayıcılarınca çağrılır — forward-auth'un ARKASINDA
kalırsa (tüm router'a uygulanırsa) izleme tamamen durur (2026-07-09'da canlıda yaşandı ve
düzeltildi — bkz. `deploy/umami/docker-compose.yml`'daki `umami-public` router'ı, kural:
`Path(/script.js) || Path(/api/send)`, middleware yalnız `cloudflare-ips`, forward-auth YOK).
Umami middleware'i (satır yukarıda) ELLE dokunulurken bu ikinci router'a DOKUNULMAMALI.

**Kuma public-status-page uyarısı:** Şu an Kuma'da kamuya açık bir status-page YOK. İleride biri
eklenirse (`/status/<slug>` yolu) Umami'deki AYNI SINIF sorun tekrarlanır — status-page anonim
ziyaretçilerce görüntülenir, forward-auth arkasında kalırsa dışarıya kapanır. Eklenirse Umami
`umami-public` router'ı deseninde `Path(/status/...)` için forward-auth'suz ayrı bir router
tanımlanmalı.

## Bilinen sınırlar / tuzaklar

- **SMTP yok → self-servis parola sıfırlama yok:** Authentik'in stock "parolamı unuttum" akışı
  e-posta gerektirir; SMTP eklenene kadar recovery linkleri YALNIZ admin (bootstrap/panel API
  token sahibi) tarafından `POST core/users/<pk>/recovery/` ile üretilebilir (yukarıdaki "Yeni
  kullanıcı" bölümü). **SMTP eklendiğinde** `default-recovery-flow`'a bağlı
  `recovery-deny-anonymous` expression policy'si (anonim erişimi reddediyor, yalnız token'lı
  erişime izin veriyor) YENİDEN TASARLANMALI — aksi halde e-posta ile gelen self-servis link de
  "anonim" sayılıp reddedilir (policy şu an `not request.user.is_anonymous` kontrolü yapıyor,
  self-servis akışta kullanıcı gerçekten anonim/kimliksiz başlar).
- **`POST core/users/<id>/recovery/` token ROTASYONU YAPMAZ:** aynı kullanıcı için ardışık
  çağrılar AYNI token'ı döndürür (update_or_create davranışı). Eski linki geçersiz kılıp yeni
  üretmek gerekiyorsa ÖNCE `DELETE core/tokens/<token-identifier>/` (identifier deseni
  `<user-pk-slug>-password-reset`), SONRA tekrar `POST .../recovery/`.
- **Outpost `config` PATCH'i MERGE ETMEZ, EZER:** embedded outpost'un (`outposts/instances/<pk>/`)
  `config` alanı (`authentik_host`, `docker_map_ports`, `kubernetes_*` vb. 20+ alt-alan) kısmi bir
  PATCH ile güncellenirse DRF nested serializer TÜM `config`'i gönderilen alanla DEĞİŞTİRİR, diğer
  alt-alanlar SİLİNİR. Kural: HER ZAMAN önce tam `GET`, sonra TÜM `config` objesini (değişen
  alan(lar) dahil) geri gönder. Aynı kural `providers` listesi için de geçerli (yeni provider
  eklerken mevcut listeyi KORU, ezme).
- **`akadmin` = acil/break-glass hesabı:** parolası `/opt/authentik/.env` → `AUTHENTIK_BOOTSTRAP_PASSWORD`
  (yalnız sunucuda, repoya girmez). E-postası `root@example.com` — Authentik'in varsayılan
  bootstrap e-postası, kozmetik bir sapma, işlevsel sorun yaratmıyor (istenirse panelden
  değiştirilebilir). Günlük kullanım için DEĞİL — yalnız diğer tüm girişler (yerel admin,
  SSH-tünel) tükendiğinde başvurulacak son çare.
- **`security.W009` (Django SECRET_KEY uzunluk uyarısı) zararsız:** `AUTHENTIK_SECRET_KEY`
  base64(36 byte) = 48 karakter, Django'nun kendi ">50 karakter" eşiğinin hafif altında ama
  Authentik kendi anahtarını kullanıyor (Django'nun otomatik üretim mantığı devrede değil) —
  fonksiyonel etkisi yok, kozmetik.
- **API yolu `stages/authenticator/validate/`** (alt çizgi DEĞİL, `/` ayraçlı) — MFA zorunlama
  stage'i burada; brief/dokümantasyonlarda bazen `stages/authenticator_validate/` (alt çizgili)
  yazar, bu 404 döner, gerçek OpenAPI yolu yukarıdaki gibi `/`'lı.
