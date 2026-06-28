# Redwall — Docker Swarm Yayın Runbook'u

Sıfırdan kurulan **yeni bir VDS** üzerinde Redwall sitesini Docker Swarm + Traefik ile
yayına almak ve GitHub Actions ile otomatik deploy etmek için adım adım kılavuz.

**Mimari özet:** `main`'e push → GitHub Actions imajı build edip **Docker Hub**'a push eder
→ SSH ile sunucuya bağlanıp `docker stack deploy` çalıştırır. Traefik 80/443'ü dinler,
Let's Encrypt ile TLS'i otomatik alır, `redwall.tr` trafiğini Next.js konteynerine (`:3000`) yönlendirir.

```
GitHub (push main)
   │  build + push
   ▼
Docker Hub  ──pull──►  VDS / Docker Swarm
                          ├─ traefik  (:80/:443, Let's Encrypt)
                          └─ web ×2   (Next.js :3000)   redwall.tr
```

---

## 1. Sunucu hazırlığı (tek seferlik)

Ubuntu 22/24 varsayımıyla, `root` veya sudo'lu kullanıcıyla:

```bash
# Docker Engine + Compose plugin
curl -fsSL https://get.docker.com | sh

# Swarm'ı başlat (tek düğüm yeterli; <PUBLIC_IP> = VDS'in dış IP'si)
docker swarm init --advertise-addr <PUBLIC_IP>

# Traefik ↔ web ortak overlay ağı (CI de oluşturur ama önce kurmak iyi)
docker network create --driver overlay --attachable traefik-public

# Deploy dizini (CI stack.yml'i buraya kopyalar)
mkdir -p /opt/redwall

# Firewall: 22 (SSH), 80 + 443 (HTTP/HTTPS) açık olmalı.
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw enable
```

> **80 portu ACME için şart:** Let's Encrypt sertifika doğrulaması 80/443 üzerinden yapılır.
> DNS henüz yönlenmemişse sertifika alınamaz (aşağıya bakın).

### Deploy kullanıcısı (öneri)
CI'nın bağlanacağı kullanıcı docker çalıştırabilmeli:
```bash
adduser deploy && usermod -aG docker deploy
# CI public anahtarını ekle:
mkdir -p /home/deploy/.ssh && nano /home/deploy/.ssh/authorized_keys
```

---

## 2. DNS

| Kayıt | Tür | Değer |
|---|---|---|
| `redwall.tr` | A | `<PUBLIC_IP>` |
| `www.redwall.tr` | A | `<PUBLIC_IP>` |

Yayılma sonrası `dig +short redwall.tr` VDS IP'sini döndürmeli. Traefik ilk istekte
sertifikayı otomatik alır (birkaç saniye sürebilir).

---

## 3. GitHub yapılandırması

Repo → **Settings → Secrets and variables → Actions**.

### Secrets (gizli)
| Ad | Açıklama |
|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub kullanıcı adı |
| `DOCKERHUB_TOKEN` | Docker Hub access token (Account → Security) |
| `SSH_HOST` | VDS IP veya hostname |
| `SSH_USER` | `deploy` (veya kullandığınız kullanıcı) |
| `SSH_KEY` | Deploy kullanıcısının **private** SSH anahtarı (PEM) |
| `SANITY_API_READ_TOKEN` | Sanity sunucu-yalnızı okuma token'ı |

### Variables (gizli değil — tarayıcıya da gider)
| Ad | Değer |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `22ukr7s6` |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | `2024-10-01` |
| `NEXT_PUBLIC_SITE_URL` | `https://redwall.tr` |
| `SITE_HOST` | `redwall.tr` |
| `ACME_EMAIL` | `info@redwall.tr` |

---

## 4. İlk deploy

1. Bu dalı (`feat/deploy-swarm`) gözden geçirip `main`'e merge edin.
2. `main`'e push → **Actions → Build & Deploy** çalışır (veya **workflow_dispatch** ile elle tetikleyin).
3. Sunucuda doğrulayın:
   ```bash
   docker stack services redwall        # redwall_web 2/2, redwall_traefik 1/1
   docker service logs -f redwall_web
   ```

### Manuel deploy (CI olmadan, acil durum)
```bash
cd /opt/redwall
export WEB_IMAGE=docker.io/<DOCKERHUB_USERNAME>/redwall-web:latest
export SITE_HOST=redwall.tr ACME_EMAIL=info@redwall.tr
export SANITY_API_READ_TOKEN=<token>
docker stack deploy -c stack.yml redwall --with-registry-auth
```

---

## 5. Yayın sonrası kontrol listesi

- [ ] `https://redwall.tr/tr` ve `/en` açılıyor, Sanity içeriği geliyor (token doğru)
- [ ] `https://www.redwall.tr` → `https://redwall.tr` (301)
- [ ] `http://redwall.tr` → `https://` (yönlendirme)
- [ ] TLS sertifikası geçerli (Let's Encrypt)
- [ ] `https://redwall.tr/studio` Sanity Studio açılıyor (CORS ekli)
- [ ] `docker service ps redwall_web` → çalışan görevler, restart yok

---

## 6. Operasyon ipuçları

```bash
# Yeniden başlat / yeni imaj çek
docker service update --force --with-registry-auth redwall_web

# Replica sayısını değiştir
docker service scale redwall_web=3

# Rollback (önceki imaj sürümüne)
docker service rollback redwall_web

# Traefik / ACME günlükleri
docker service logs -f redwall_traefik
```

---

## 7. (Opsiyonel) Sır sıkılaştırma — Docker secrets

`environment:` ile verilen `SANITY_API_READ_TOKEN`, `docker service inspect`'te görünür.
Daha sıkı bir kurulum için Docker secret kullanın:

```bash
printf '%s' '<token>' | docker secret create sanity_read_token -
```
`stack.yml`'de `web` servisine:
```yaml
    secrets:
      - sanity_read_token
secrets:
  sanity_read_token:
    external: true
```
ve konteyner girişinde `SANITY_API_READ_TOKEN=$(cat /run/secrets/sanity_read_token)`
olarak export eden küçük bir entrypoint ekleyin. (Faz 2'de Payload sırlarıyla birlikte standardize edilecek.)

---

## 8. Sonraki faz — Payload CMS

Sanity'den self-hosted Payload'a göç planı: [`superpowers/plans/2026-06-28-redwall-swarm-deploy-payload.md`](superpowers/plans/2026-06-28-redwall-swarm-deploy-payload.md) (Faz 2).
Postgres + MinIO + Payload servisleri `deploy/stack.cms.yml`'de tanımlanacak; `cms.redwall.tr` Traefik route'u ile.
