# Redwall Güvenlik Denetimi — 2026-07-04

**Kapsam:** Next.js 16 (App Router) + Payload CMS 3.85 + Postgres + MinIO, Docker Swarm + Traefik + Cloudflare "Full", GitHub Actions CI/CD.
**Repo:** `/Users/hamdikalayci/Code/Redwall-Projeleri/redwall` — Canlı: `redwall.tr`
**Yöntem:** Salt-okunur kaynak incelemesi + `npm audit` + zararsız GET ile canlı doğrulama. Hiçbir dosya değiştirilmedi.

---

## Özet — Risk Skoru Dağılımı

| Seviye | Adet |
|--------|------|
| Kritik | 1 |
| Yüksek | 2 |
| Orta | 4 |
| Düşük / Bilgi | 5 |
| **Toplam** | **12** |

**Genel değerlendirme:** Uygulama katmanı güvenlik açısından **olgun ve bilinçli** kurgulanmış. Payload access control disiplinli (canlıda 403 ile doğrulandı), formlar sunucu tarafında doğrulanıyor, SVG sanitize ediliyor, XSS için `dangerouslySetInnerHTML` hiç kullanılmıyor, migration'lar parametrik, altyapı ağ izolasyonu ve non-root çalışma doğru. En önemli tek sorun, yerel `.env.local` dosyasında duran **gerçek bir canlı SMTP parolası** (git'e girmemiş ama başka projeden kopyalanmış, geçerli kimlik bilgisi).

**En kritik 3 başlık:**
1. **[KRİTİK]** `.env.local` içinde gerçek/canlı Gmail SMTP app-password düz metin (`SMTP_PASS=lafsrvhefrywjfab`) — YangınPro'dan kopyalanmış, hâlâ geçerli.
2. **[YÜKSEK]** Turnstile doğrulaması "fail-open": `TURNSTILE_SECRET_KEY` env boşsa bot doğrulaması sessizce atlanıyor.
3. **[YÜKSEK]** Rate-limit yalnızca replica-başına bellek içi (2 replica × 5 istek, restart'ta sıfırlanır); dağıtık koruma yok.

---

## KRİTİK

### K-1. `.env.local` dosyasında gerçek canlı SMTP parolası (başka projeden kopyalanmış)
**Dosya:** `/.env.local:15-18`
**Kanıt:**
```
# SMTP (form bildirimleri) — YangınPro .env'den alındı (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_USER=no-reply@redwall.tr
SMTP_PASS=lafsrvhefrywjfab      ← gerçek Gmail app-password (16 hane)
```

**Açıklama:** `.gitignore` `.env*` desenini kapsıyor ve `git log -S 'lafsrvhefrywjfab'` ile geçmişte **hiç commit edilmediği doğrulandı** — yani şu an repoda değil. Ancak bu, geliştirici makinesinde düz metin duran, **hâlâ geçerli** bir Gmail SMTP app-password'dür ve yorumun kendi ifadesiyle **başka bir projeden (YangınPro) kopyalanmıştır**. Bu tek kimlik bilgisi iki projede paylaşılıyor; birinde sızarsa ikisi birden etkilenir.

**İstismar senaryosu:** Yedekleme, senkron klasör (Dropbox/iCloud), ekran paylaşımı, ele geçirilmiş bir dev bağımlılığı (postinstall script `.env.local` okuyabilir) ya da yanlışlıkla `git add -f` ile bu parola dışarı sızarsa saldırgan `no-reply@redwall.tr` üzerinden e-posta gönderebilir (kimlik avı, marka itibarı, Gmail kota tüketimi) ve aynı hesap YangınPro'da da kullanılıyorsa oraya da erişir.

**Öneri:**
1. Bu Gmail app-password'ü **hemen iptal et** (Google Hesap → Güvenlik → Uygulama şifreleri → sil).
2. Redwall için **ayrı** bir app-password üret; YangınPro ile paylaşma.
3. Yeni parolayı yalnız GitHub Secrets (`SMTP_PASS`) içine koy; `.env.local`'da geliştirme için gereken durumda dahi ayrı/atılabilir bir kimlik kullan.
4. `git log` temiz olsa da düzenli `gitleaks`/`trufflehog` taraması ekle.

---

## YÜKSEK

### Y-1. Turnstile doğrulaması "fail-open" — secret boşsa bot koruması sessizce devre dışı
**Dosya:** `src/app/actions/form-gonderim.ts:42-44`
```js
async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true   // özellik yapılandırılmamış → atla
```

**Açıklama:** `TURNSTILE_SECRET_KEY` env değişkeni tanımlı değilse fonksiyon **koşulsuz `true`** döndürüyor; yani doğrulama tamamen atlanıyor. CI (`deploy.yml:106`) bunu `${{ secrets.TURNSTILE_SECRET_KEY }}` ile geçiriyor — secret GitHub'da tanımlı **olduğu sürece** korumalı. Ancak secret silinir, yanlış isimlendirilir veya bir deploy'da boş geçerse tüm bot koruması **sessizce** kaybolur ve hiçbir uyarı çıkmaz. Bu, güvenlik kontrolü için tehlikeli bir "varsayılan açık" tasarımdır.

**İstismar senaryosu:** Env yanlış yapılandırması sonrası form endpoint'i bot/spam'e tam açık hale gelir; SMTP kotası tüketilir, `formGonderimi` koleksiyonu çöple dolar (KVKK kayıt kirliliği).

**Öneri:** Üretimde fail-closed yap: `NODE_ENV === 'production'` iken `secret` yoksa `false` döndür veya en azından `console.error` ile gürültülü uyarı bas. İdeali: prod'da secret zorunlu (yoksa boot'ta hata).

### Y-2. Rate-limit yalnızca replica-başına bellek içi — dağıtık ve kalıcı değil
**Dosya:** `src/app/actions/form-gonderim.ts:18-36`

**Açıklama:** Hız sınırı `Map` ile process belleğinde tutuluyor. `stack.yml:96`'da `replicas: 2` — istekler 2 web instance'a dağıldığından etkin sınır IP başına ~2×5=10/10dk olur; ayrıca her deploy/restart sayaçları sıfırlar. Kod yorumu bunu dürüstçe "best-effort" olarak işaretliyor ve Cloudflare WAF/Turnstile'ı asıl koruma olarak öneriyor — doğru bir not, ama tek başına yetersiz.

**İstismar senaryosu:** IP rotasyonlu bot (Turnstile Y-1 nedeniyle atlanmışsa) form spam'i yapabilir; SMTP kota tüketimi + DB şişmesi.

**Öneri:** Kritik koruma olarak **Cloudflare rate-limiting rule** (form path'i için) veya Turnstile'ı zorunlu tut. İsteğe bağlı: uygulama katmanında paylaşımlı store (Redis) — ama Cloudflare katmanı bu mimaride daha uygun.

---

## ORTA

### O-1. HSTS başlığı `includeSubDomains` ve `preload` içermiyor
**Dosya:** `next.config.ts:36` — `Strict-Transport-Security: max-age=31536000` (canlıda doğrulandı)

**Açıklama:** `includeSubDomains` yok; alt alan adları (örn. `minio.redwall.tr` gibi ileride açılabilecek) HSTS kapsamı dışında kalır. `preload` da yok. Cloudflare "Full" arkasında olduğundan uçtan uca zorlama Cloudflare'e devredilebilir, ama origin başlığının da güçlü olması iyidir.

**Öneri:** Alt alan adlarının hepsi HTTPS ise `max-age=63072000; includeSubDomains; preload` yap (subdomain envanterini doğruladıktan sonra).

### O-2. CSP yalnız `frame-ancestors 'self'` — script/style/object/connect direktifi yok
**Dosya:** `next.config.ts:35` (canlıda doğrulandı: `content-security-policy: frame-ancestors 'self'`)

**Açıklama:** Kod yorumunda Payload `/admin`'in inline script/style'ını bozmamak için tam CSP'nin bilinçli eklenmediği açıklanmış — makul bir gerekçe. Ancak public site (marketing sayfaları, `/admin` dışı) için `default-src`/`script-src`/`object-src 'none'`/`base-uri 'self'` gibi direktifler XSS derinlemesine-savunma sağlardı. Mevcut XSS riski zaten düşük (bkz. B-2), o yüzden Orta.

**İstismar senaryosu:** İleride bir XSS sink'i eklenirse (ör. `dangerouslySetInnerHTML`), CSP olmadığı için istismar kolaylaşır.

**Öneri:** `/admin` yolunu ayrı tutup (matcher ile) public rotalara sıkı bir CSP uygula; nonce tabanlı `script-src` Next 16 ile mümkün. En azından `object-src 'none'; base-uri 'self'` ekle (bunlar Payload'ı bozmaz).

### O-3. `X-Powered-By: Next.js, Payload` başlığı stack bilgisini sızdırıyor
**Kanıt:** Canlı `curl -sI https://redwall.tr/tr` → `x-powered-by: Next.js, Payload`

**Açıklama:** Sürüm belirtmese de teknoloji parmak izi veriyor; hedefli CVE taraması için saldırgana kolaylık.

**Öneri:** `next.config.ts` içine `poweredByHeader: false` ekle. (Payload'ın eklediği kısım için Traefik/response header temizliği gerekebilir.)

### O-4. `npm audit` — 1 yüksek + 15 orta zafiyet (çoğu geçişli/dev)
**Kanıt:** `npm audit --omit=dev`: total 17 (high 1, moderate 15, low 1).

**Açıklama:** Yüksek olan **`picomatch`** (geçişli). Orta olanların büyük kısmı **`esbuild`/`drizzle-kit`/`@esbuild-kit`** zincirinden geliyor ki bunlar **build/migration (tools) zamanı** bağımlılıkları — çalışan `runner` imajına girmezler (standalone build yalnız izlenen prod modüllerini alır, `Dockerfile:54-57`). `next`, `@payloadcms/*`, `next-intl`, `dompurify` uyarıları framework kaynaklı ve üst sürüm beklentisinde. Runtime'a fiilen ulaşan gerçek istismar edilebilir yüzey sınırlı, ama takip edilmeli.

**Öneri:** `npm audit fix` (major olmayan) çalıştır; `next`/`payload` minor güncellemelerini takip et. `picomatch` için üst bağımlılık güncellemesini bekle. Prod runtime'a girmeyen dev/tools zafiyetlerini ayrı önceliklendir.

---

## DÜŞÜK / BİLGİ

### B-1. Payload access control — disiplinli ve canlıda doğrulandı (POZİTİF)
**Dosyalar:** tüm `src/collections/*.ts`, `src/globals/*.ts`

- Public okunması gereken içerik koleksiyonları `read: () => true` (Media, Page, Product, Service, Post, Faq, Job, Project, Referans, Solution, TeamMember, Document, RichPage) — doğru.
- **`FormGonderimi`** (`src/collections/FormGonderimi.ts:17-22`): `read`/`delete` yalnız `!!req.user`, `create: () => false`, `update: () => false`. Yazma sadece server action'da `overrideAccess: true` ile. **KVKK açısından doğru.**
- **Canlı doğrulama:** `GET /api/formGonderimi` ve `GET /api/users` → **403** ("You are not allowed to perform this action"). GraphQL playground → **404** (prod'da kapalı).
- Yazma erişimi belirtilmeyen içerik koleksiyonlarında Payload varsayılanı "authenticated" olduğundan, giriş yapmamış kullanıcı yazamaz. Sorun yok.

### B-2. XSS yüzeyi minimal (POZİTİF)
`grep dangerouslySetInnerHTML` → **0 sonuç**. RichText render'ı `@payloadcms/richtext-lexical/react`'in JSX tabanlı `<RichText>` bileşeni ile yapılıyor (`src/components/ui/RichContent.tsx`), metin düğümleri React tarafından kaçırılıyor. İçerik üreticileri zaten yalnız authenticated admin. SVG yüklemeleri DOMPurify ile temizleniyor (`src/lib/sanitizeSvg.ts`, `FORBID_TAGS: ['script','foreignObject']`) ve hook `beforeOperation` ile create+update yollarını kapsıyor (`src/collections/Media.ts:16-28`).

### B-3. Upload sertleştirmesi makul (POZİTİF, küçük not)
`src/collections/Media.ts:11` — MIME allowlist (`image/*` + `application/pdf`) tanımlı. **Not:** Açık bir dosya **boyut limiti** koleksiyon `upload` config'inde görünmüyor; Next server action `bodySizeLimit: '100kb'` (`next.config.ts:19`) form action'ları sınırlıyor ama admin panel upload'u ayrı yoldan geçebilir. MinIO proxy Payload'ın standart REST handler'ı (`/api/[...slug]`) — özel/elle yazılmış path handling yok, dolayısıyla path traversal/SSRF için ek özel kod yüzeyi yok. **Öneri:** `upload.filesizeLimit` ekleyerek admin tarafı büyük dosya yüklemesini de sınırla.

### B-4. Admin brute-force + seed sertleştirmesi (POZİTİF)
`payload.config.ts:40` — `auth: { maxLoginAttempts: 5, lockTime: 10dk }`. `src/payload/seed.ts:46-53` — üretimde `PAYLOAD_SEED_ADMIN_EMAIL/PASSWORD` zorunlu, yoksa hata fırlatıyor (varsayılan `admin@redwall.tr/redwall-dev-admin` yalnız dev'de). **Not:** Admin parola rotasyonu bilinen açık aksiyon (kullanıcı belirtti). Ek not: `/admin` internetten 200 dönüyor — Cloudflare IP allowlist bunu koruyorsa yeterli; değilse admin panelini WAF/allowlist arkasına almak önerilir.

### B-5. Altyapı & secret yönetimi (POZİTİF)
- `deploy/stack.yml:22-24`: `app-internal` ağı `internal: true` — postgres/minio dışa **publish edilmiyor**, sadece servisler arası. Doğru.
- `Dockerfile:51-59`: non-root `nextjs` (uid 1001) kullanıcı; standalone build sadece izlenen modülleri taşıyor.
- Secret'lar GitHub Secrets'ta (`deploy.yml:93-106`); NEXT_PUBLIC_* yalnız build-arg (parola değil). `.dockerignore` `.env*`'i imaj dışında tutuyor.
- Traefik `docker.sock:ro` mount ediyor (swarm provider için standart) ve dashboard kapalı (`stack.yml:46`). TLS Cloudflare Full + Traefik self-signed — **kullanıcı talebiyle SSL modu değiştirilmesi ÖNERİLMİYOR**.
- **Küçük not:** SMTP e-posta `subject` alanı kullanıcı girdisi `data.ad`'i içeriyor (`src/lib/email.ts:120`) ve newline stripping yapılmıyor; ancak nodemailer başlıkları kendisi encode/fold ettiğinden pratik SMTP header injection riski yok. Yine de `ad` alanında `\r\n` temizliği eklemek defansif olur. HTML gövdesi `escapeHtml` ile kaçırılıyor, `replyTo` `isEmail` ile korunuyor.

---

## Yanlış-Pozitif / Doğrulanamayan

- **`.env.local` git sızıntısı:** `git log --all -S 'lafsrvhefrywjfab'` ve `git log -- .env.local` **boş** döndü → parola git geçmişinde **yok**. K-1 bu yüzden "repo sızıntısı" değil, "yerel canlı kimlik bilgisi + çapraz-proje paylaşımı" riski olarak sınıflandırıldı. Yine de parola gerçek ve geçerli olduğundan iptal edilmeli.
- **Prod env değerleri doğrulanamadı:** `TURNSTILE_SECRET_KEY`, `PAYLOAD_SECRET`, `POSTGRES_PASSWORD`, `MINIO_ROOT_PASSWORD`'ün GitHub Secrets'ta gerçekten **güçlü ve tanımlı** olup olmadığı repo'dan görülemez (yalnız `${{ secrets.* }}` referansları görünür). Y-1'in prod'da tetiklenip tetiklenmediği secret'ın dolu olmasına bağlı — canlı formda Turnstile widget'ı göründüğü doğrulanabilir ama secret'ın backend'de dolu olduğu repo'dan kanıtlanamadı.
- **Cloudflare WAF / IP allowlist konfigürasyonu:** Kullanıcı "IP allowlist mevcut" dedi; bu Cloudflare panelinde, repo dışında. `/admin`'in 200 dönmesi bu allowlist arkasında olabilir — doğrulanamadı, varsayıldı.
- **`npm audit` "high" (picomatch):** Geçişli bağımlılık; runtime imajına girip girmediği (build-only olabilir) tam izlenemedi, konservatif olarak O-4'te listelendi.
- **MinIO proxy path traversal:** Payload'ın generated `REST_GET` handler'ı incelenmedi (framework kodu); özel handler olmadığı için ek risk düşük varsayıldı, framework içi davranış denetlenmedi.
