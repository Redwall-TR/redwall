# Redwall Web Sitesi — Mola Sonrası Yol Haritası

Güncel durum: site `main`'de, tam CMS bağlı (Sanity, private dataset + token), CORS eklendi.
Kalan üç iş kolu aşağıda. **Önerilen sıra:** A (Yayın) → B (Form e-posta) → C (İçerik, paralel/sürekli).

---

## ⚠️ Mola sonrası İLK netleştirilecek kararlar

Bunlar plana yön verecek; ilk iş bunları konuşmak:

1. **VDS:** İşletim sistemi (Ubuntu 22/24?), root/SSH erişimi var mı, RAM/CPU? **Docker mı, bare (Node+PM2+nginx) mı?** Deploy **manuel mi, CI/CD (GitHub Actions → SSH) mi?**
2. **DNS:** `redwall.tr` (ve `www`) VDS IP'sine yönlendirildi mi? SSL'i kim üstlenecek (Let's Encrypt / Traefik otomatik)?
3. **E-posta:** **Resend** mi (önerilen) yoksa kendi **SMTP**'niz mi? Gönderen/alıcı adresler (örn. `noreply@redwall.tr` → `info@redwall.tr`)?

---

## A. VDS Yayın Kurulumu

> Not (kritik): `NEXT_PUBLIC_*` değişkenleri **build zamanında** bundle'a gömülür → build VDS'te env'lerle yapılmalı **veya** Docker build-arg ile geçilmeli. `SANITY_API_READ_TOKEN` runtime'da (server-only) okunur.

### Gerekli ortam değişkenleri (VDS'te)
```
NEXT_PUBLIC_SANITY_PROJECT_ID=22ukr7s6
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-10-01
NEXT_PUBLIC_SITE_URL=https://redwall.tr
SANITY_API_READ_TOKEN=<.env.local'deki token>   # server-only sır
RESEND_API_KEY=<form e-postası için, B adımında>  # server-only sır
```

### Yol 1 — Docker (öneri; YANGINPRO Docker stack'inizle uyumlu)
1. `next.config.ts`'e `output: 'standalone'` ekle (küçük image).
2. `Dockerfile` (multi-stage: deps → build → runner) + `.dockerignore`.
3. Build-arg ile `NEXT_PUBLIC_*` geç; runtime env ile `SANITY_API_READ_TOKEN`/`RESEND_API_KEY`.
4. Reverse proxy: **Traefik** (otomatik Let's Encrypt) veya **nginx + certbot** → container `:3000`.
5. `/studio` aynı domainde çalışır (CORS zaten ekli).
6. Deploy akışı: manuel (`git pull → docker build → up -d`) veya GitHub Actions → SSH.

### Yol 2 — Bare (Node 22 + PM2 + nginx)
1. Node 22 + npm, PM2 kur.
2. `git clone` → `npm ci` → `npm run build`.
3. PM2 ecosystem (`next start -p 3000`) + env dosyası.
4. nginx reverse proxy (`redwall.tr` → `:3000`, gzip) + certbot SSL.
5. Deploy: `git pull && npm ci && npm run build && pm2 reload redwall`.

### Yayın sonrası kontrol
- `/tr`, `/en`, `/studio` açılıyor; Sanity içeriği geliyor (token doğru girilmiş).
- SSL geçerli, www→apex (veya tersi) yönlendirme, 404 sayfası.

---

## B. Form E-posta Gönderimi (Server Action + Resend)

Şu an İletişim ve Teklif formları **gönderim yapmıyor** (client validasyon + sahte başarı).

### Kararlar
- Sağlayıcı: **Resend** (basit, modern) — alternatif kendi SMTP'niz (nodemailer).
- Resend hesabı + **API key** + **gönderen domain doğrulama** (redwall.tr için SPF/DKIM DNS kayıtları).

### Adımlar
1. `resend` paketini kur.
2. Server Action'lar: `src/app/actions/contact.ts` ve `quote.ts` — mevcut `validateContact`/`validateQuote` ile sunucu-tarafı doğrula, Resend ile e-posta gönder (To: `info@redwall.tr`), başarı/hata döndür.
3. `ContactForm` + `QuoteForm`: client submit → server action (`useActionState`/form `action`), başarı/hata durumlarını göster (mevcut başarı mesajı altyapısı var).
4. Spam koruması: gizli **honeypot** alanı + basit rate-limit (opsiyonel: Cloudflare Turnstile).
5. `RESEND_API_KEY` env (server-only) — VDS'te.
6. Gerçek gönderim testi (TR + EN form).

---

## C. Gerçek İçerik Girişi (Studio)

Çoğunlukla sizin işiniz; CMS hazır, `ICERIK-TODO.md` mevcut. Benim desteğim: girerken takıldığınız yerde şema eklemek/düzeltmek.

### Doldurma listesi (`/studio`)
- **Site Ayarları:** gerçek telefon, e-posta, adres, çalışma saatleri, sosyal linkler, istatistikler
- **Referanslar:** gerçek kurumlar + **logolar** (Logo alanı) + "Ana sayfada göster" işareti
- **Projeler:** gerçek işler + görseller + durum (devam eden/tamamlandı)
- **Ürünler:** YangınPro/MekanikPro ekran görüntüleri (özellik içerikleri girildi)
- **Blog / Kariyer:** yazılar / açık pozisyonlar
- **Kalite & Belgeler:** gerçek sertifikalar
- **Kurumsal:** hakkımızda/vizyon-misyon metinleri (taslak girildi, gözden geçirin)

---

## Açık/ileride opsiyonlar
- Blog için görsel/SEO iyileştirmeleri, OG görselleri
- Analytics (Plausible/Umami — KVKK dostu) eklenmesi
- Sitemap'e gerçek alan adı + Search Console doğrulaması
