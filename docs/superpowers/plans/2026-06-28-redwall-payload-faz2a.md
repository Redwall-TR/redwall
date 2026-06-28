# Faz 2a — Payload CMS Temeli (Uygulama Planı)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (önerilen) veya superpowers:executing-plans. Adımlar checkbox (`- [ ]`) ile takip edilir. Bu plan **Faz 2a**'dır (Payload'ı ayağa kaldır, canlı site Sanity'den okumaya DEVAM eder). Cutover **Faz 2b**'nin kendi planında.

**Goal:** Payload CMS 3'ü mevcut Next.js uygulamasına entegre edip Postgres + MinIO ile Swarm'a deploy etmek; `redwall.tr/admin` çalışır ve seed'li olur — site davranışı değişmez.

**Architecture:** Payload, Next app'in `/app/(payload)` route grubuna kurulur; veri PostgreSQL'de (db-postgres adapter), medya MinIO'da (storage-s3). Site bileşenleri bu fazda DEĞİŞMEZ; hâlâ `sanityFetch` kullanır. Postgres/MinIO yalnız iç overlay ağında.

**Tech Stack:** Next.js **≥16.2.6** (Payload şartı), React 19, Payload **≥3.73**, `@payloadcms/next`, `@payloadcms/db-postgres`, `@payloadcms/storage-s3`, `@payloadcms/richtext-lexical`, PostgreSQL 16, MinIO, Docker Swarm.

## Global Constraints

- **Next.js sürümü:** Payload 16.1.x'i DESTEKLEMEZ. Next **≥ 16.2.6** olmalı (`16.2.6+` veya `>16.1.1-canary.35`). Payload **≥ 3.73.0**.
- **next.config ESM + withPayload:** `withPayload(withNextIntl(nextConfig))` sırası; mevcut `output: 'standalone'` korunur.
- **payload.config.ts** repo kökünde; `tsconfig` path `@payload-config` → `./payload.config.ts`.
- **i18n:** `localization: { locales: ['tr','en'], defaultLocale: 'tr' }`. Localized alanlar `localized: true`.
- **Sırlar (Docker secret, asla imaja gömülmez):** `PAYLOAD_SECRET`, `DATABASE_URI`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, S3 erişim anahtarları.
- **Production'da `push: false`** — şema yalnız migration dosyalarıyla değişir.
- **Postgres + MinIO dışa publish edilmez** — yalnız `app-internal` overlay ağında. Web her iki ağda.
- Site bileşenleri (Server Component'ler) bu fazda DEĞİŞMEZ.

---

## Dosya Yapısı

| Dosya | Sorumluluk |
|---|---|
| `payload.config.ts` | Payload ana config: db, editor, localization, collections, globals, s3 plugin |
| `src/collections/*.ts` | Koleksiyon tanımları (service, product, page, referans, faq, post, job, Media) |
| `src/globals/*.ts` | Global tanımları (SiteSettings, Navigation) |
| `src/app/(payload)/**` | Payload admin + api route'ları (blank template'ten) |
| `src/payload/seed.ts` | İlk admin + placeholder içerik (idempotent) |
| `next.config.ts` (mod.) | `withPayload(...)` sarmalama |
| `tsconfig.json` (mod.) | `@payload-config` path |
| `package.json` (mod.) | Payload paketleri + Next yükseltme |
| `deploy/stack.yml` (mod.) | postgres + minio servisleri, app-internal ağı, web env/secret |
| `deploy/compose.dev.yml` | Yerel geliştirme için postgres + minio (dev) |
| `.github/workflows/deploy.yml` (mod.) | migrate adımı + migration öncesi pg yedeği |
| `migrations/*` | Payload Postgres migration dosyaları (üretilir) |

---

### Task 1: Next.js 16.2.6+ yükseltmesi (Payload ön koşulu)

**Files:** Modify `package.json`
**Interfaces:** Produces: Next ≥16.2.6 üzerinde çalışan, build'i geçen mevcut site (Payload'ın çalışabileceği taban).

- [ ] **Step 1: Mevcut yeşil taban doğrula**

Run: `npm run build`
Expected: `✓ Compiled successfully`. (Yükseltme öncesi referans.)

- [ ] **Step 2: Next'i yükselt**

Run:
```bash
npm i next@^16.2.6 eslint-config-next@^16.2.6
```
Expected: `package.json`'da `"next": "^16.2.6"`.

- [ ] **Step 3: Build + lint + dev doğrula (next-intl 4.13 uyumu dahil)**

Run: `npm run build && npm run lint`
Expected: `✓ Compiled successfully`, lint temiz. Build kırılırsa: next-intl/turbopack uyumu için `npm i next-intl@latest` dene; yine kırılırsa Next'i `16.2.x` içinde en yakın çalışan minora sabitle ve notu commit mesajına yaz.

- [ ] **Step 4: Önizlemede TR/EN smoke**

Run: `npm run dev` → tarayıcı `/tr` ve `/en`.
Expected: İki sayfa da 200, içerik render (regression yok).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: Next.js 16.2.6+ yükseltmesi (Payload entegrasyonu ön koşulu)"
```

---

### Task 2: Yerel geliştirme servisleri (Postgres + MinIO)

**Files:** Create `deploy/compose.dev.yml`, Modify `.env.local` (gitignored)
**Interfaces:** Produces: `localhost:5432` Postgres (`redwall`/`redwall`/`redwall`), `localhost:9000` MinIO (bucket `redwall-media`). Task 3+ bunlara bağlanır.

- [ ] **Step 1: Dev compose dosyası**

Create `deploy/compose.dev.yml`:
```yaml
# Yerel geliştirme — Payload için Postgres + MinIO (production stack ayrı)
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: redwall
      POSTGRES_USER: redwall
      POSTGRES_PASSWORD: redwall
    ports: ["5432:5432"]
    volumes: ["redwall_pg_dev:/var/lib/postgresql/data"]
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports: ["9000:9000", "9001:9001"]
    volumes: ["redwall_minio_dev:/data"]
volumes:
  redwall_pg_dev:
  redwall_minio_dev:
```

- [ ] **Step 2: Başlat + MinIO bucket oluştur**

Run:
```bash
docker compose -f deploy/compose.dev.yml up -d
docker run --rm --network host minio/mc sh -c \
  "mc alias set d http://127.0.0.1:9000 minioadmin minioadmin && mc mb -p d/redwall-media"
```
Expected: İki konteyner `Up`; `redwall-media` bucket oluşturuldu.

- [ ] **Step 3: .env.local'e Payload değişkenleri ekle**

`.env.local`'e ekle (gitignored):
```
PAYLOAD_SECRET=dev-secret-change-me-0123456789
DATABASE_URI=postgres://redwall:redwall@127.0.0.1:5432/redwall
S3_BUCKET=redwall-media
S3_REGION=us-east-1
S3_ENDPOINT=http://127.0.0.1:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
```

- [ ] **Step 4: Commit** (sadece compose; .env.local gitignored)

```bash
git add deploy/compose.dev.yml
git commit -m "chore(payload): yerel geliştirme için Postgres + MinIO compose"
```

---

### Task 3: Payload kurulumu + /admin boot

**Files:** Create `payload.config.ts`, `src/app/(payload)/**` (blank template), Modify `next.config.ts`, `tsconfig.json`, `package.json`
**Interfaces:** Produces: `@payload-config` ile çözülen `payload.config.ts`; `localhost:3000/admin` paneli; `getPayload({ config })` ile Local API erişimi (Task 7 + Faz 2b kullanır).

- [ ] **Step 1: Paketleri kur**

Run:
```bash
npm i payload@^3.73 @payloadcms/next@^3.73 @payloadcms/db-postgres@^3.73 \
  @payloadcms/storage-s3@^3.73 @payloadcms/richtext-lexical@^3.73 sharp graphql
```
Expected: Paketler `package.json`'da `^3.73`.

- [ ] **Step 2: (payload) route grubunu blank template'ten kopyala**

Blank template `src/app/(payload)` klasörünü kopyala:
https://github.com/payloadcms/payload/tree/3.x/templates/blank/src/app/(payload)
Hedef: `src/app/(payload)/` (admin layout/page + api route'ları + custom importMap).
Mevcut `src/app/[locale]/...` (site) bu grupla yan yana durur — route grupları URL'i değiştirmez.

- [ ] **Step 3: Kök layout çakışmasını çöz**

Mevcut site kökü `src/app/[locale]/layout.tsx`. Payload grubunun kendi layout'u var. Eğer `src/app/layout.tsx` (paylaşılan kök) Payload paneline `<html>`/stil sızdırıyorsa, site dosyalarını `src/app/(site)/[locale]/...` grubuna taşı; böylece site ve Payload ayrı kök layout'lara sahip olur.
Run: `npm run build`
Expected: Build geçer; iki route grubu da derlenir.

- [ ] **Step 3b: payload.config.ts (minimal, postgres) oluştur**

Create `payload.config.ts`:
```typescript
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  admin: { user: 'users' },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'src/payload-types.ts') },
  db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URI || '' } }),
  collections: [
    {
      slug: 'users',
      auth: true,
      admin: { useAsTitle: 'email' },
      fields: [],
    },
  ],
  localization: { locales: ['tr', 'en'], defaultLocale: 'tr', fallback: true },
  sharp,
})
```

- [ ] **Step 4: tsconfig path + next.config withPayload**

`tsconfig.json` `compilerOptions.paths`'e ekle:
```json
"@payload-config": ["./payload.config.ts"]
```
`next.config.ts`'i sarmala (mevcut `withNextIntl` + `output:'standalone'` korunur):
```typescript
import { withPayload } from '@payloadcms/next/withPayload'
// ... mevcut withNextIntl(nextConfig) ...
export default withPayload(withNextIntl(nextConfig))
```

- [ ] **Step 5: İlk migration + admin boot**

Run:
```bash
npx payload migrate:create initial
npm run dev
```
Tarayıcı: `http://localhost:3000/admin`
Expected: İlk kullanıcı oluşturma ekranı; kullanıcı oluşturulunca panel açılır. Site `/tr` hâlâ çalışır.

- [ ] **Step 6: Commit**

```bash
git add payload.config.ts src/app/\(payload\) next.config.ts tsconfig.json package.json package-lock.json migrations src/payload-types.ts
git commit -m "feat(payload): Payload 3 entegrasyonu + /admin (postgres adapter, i18n tr/en)"
```

---

### Task 4: Media koleksiyonu + MinIO (S3) storage

**Files:** Create `src/collections/Media.ts`, Modify `payload.config.ts`
**Interfaces:** Produces: `media` slug'lı upload koleksiyonu; yüklenen dosyalar MinIO bucket'ında. Diğer koleksiyonlar `upload` ilişkisiyle buna bağlanır.

- [ ] **Step 1: Media koleksiyonu**

Create `src/collections/Media.ts`:
```typescript
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: { read: () => true },
  upload: true,
  fields: [
    { name: 'alt', type: 'text', localized: true },
  ],
}
```

- [ ] **Step 2: payload.config.ts'e Media + s3Storage plugin ekle**

`payload.config.ts`:
```typescript
import { s3Storage } from '@payloadcms/storage-s3'
import { Media } from './src/collections/Media'
// collections: [ usersCollection, Media ]
// plugins ekle:
plugins: [
  s3Storage({
    collections: { media: true },
    bucket: process.env.S3_BUCKET || '',
    config: {
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION,
      forcePathStyle: true, // MinIO için şart
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
    },
  }),
],
```

- [ ] **Step 3: Migration + yükleme doğrula**

Run: `npx payload migrate:create media && npm run dev`
`/admin` → Media → bir görsel yükle.
Run (doğrula): `docker run --rm --network host minio/mc sh -c "mc alias set d http://127.0.0.1:9000 minioadmin minioadmin && mc ls d/redwall-media"`
Expected: Yüklenen dosya MinIO bucket'ında listelenir.

- [ ] **Step 4: Commit**

```bash
git add src/collections/Media.ts payload.config.ts migrations
git commit -m "feat(payload): Media koleksiyonu + MinIO (S3) storage"
```

---

### Task 5: Koleksiyonlar — service, product, referans

**Files:** Create `src/collections/Service.ts`, `Product.ts`, `Referans.ts`, Modify `payload.config.ts`
**Interfaces:** Produces: `service`, `product`, `referans` slug'lı koleksiyonlar (alanlar mevcut Sanity şemalarıyla bire bir; localized alanlar `localized:true`). Kaynak şema: `src/sanity/schemaTypes/documents/{service,product,reference}.ts`.

- [ ] **Step 1: Alan eşlemesi — kaynak şemaları oku**

Read: `src/sanity/schemaTypes/documents/service.ts`, `product.ts`, `reference.ts` (alan listesi/türleri buradan; `localeString/localeText`→`localized text/textarea`, `image`→`upload (media)`, `array`→`array`, `slug`→`text` unique).

- [ ] **Step 2: Referans koleksiyonu (en küçük; desen örneği)**

Create `src/collections/Referans.ts` (mevcut `reference.ts` alanları: `ad` (string), `logo` (image), `gorus` (localeText), `anasayfada` (boolean)):
```typescript
import type { CollectionConfig } from 'payload'

export const Referans: CollectionConfig = {
  slug: 'referans',
  labels: { singular: 'Referans', plural: 'Referanslar' },
  admin: { useAsTitle: 'ad' },
  access: { read: () => true },
  fields: [
    { name: 'ad', type: 'text', required: true },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'gorus', type: 'textarea', localized: true },
    { name: 'anasayfada', type: 'checkbox', label: 'Ana sayfada göster', defaultValue: false },
  ],
}
```

- [ ] **Step 3: Service + Product koleksiyonları**

Create `src/collections/Service.ts` ve `Product.ts`: Step 1'de okunan alanları aynı desenle tanımla (localized text/textarea/richText; `altHizmetler`/`surec`/`ozellikler` → `array` alanlar; `icon` → `select` (mevcut `iconOptions.ts` değerleriyle); `slug` → `text` `unique: true`). Tüm görsel alanları `upload (relationTo:'media')`.

- [ ] **Step 4: payload.config.ts'e ekle + migration + doğrula**

`collections: [users, Media, Service, Product, Referans]`.
Run: `npx payload migrate:create collections1 && npm run dev`
`/admin` → her üç koleksiyon görünür; her birinde bir kayıt oluştur (TR+EN alanları).
Expected: Kayıtlar kaydedilir; locale switcher alanlarda çalışır.

- [ ] **Step 5: Commit**

```bash
git add src/collections/Service.ts src/collections/Product.ts src/collections/Referans.ts payload.config.ts migrations src/payload-types.ts
git commit -m "feat(payload): service/product/referans koleksiyonları (i18n)"
```

---

### Task 6: Koleksiyonlar — page, faq, post, job + Globals (siteSettings, navigation)

**Files:** Create `src/collections/Page.ts`, `Faq.ts`, `Post.ts`, `Job.ts`, `src/globals/SiteSettings.ts`, `src/globals/Navigation.ts`, Modify `payload.config.ts`
**Interfaces:** Produces: kalan koleksiyonlar + `siteSettings`/`navigation` globals. Kaynak: `src/sanity/schemaTypes/documents/{page,faq,post,job,siteSettings,navigation}.ts`.

- [ ] **Step 1: Kaynak şemaları oku** (yukarıdaki 6 dosya) — alan listeleri.

- [ ] **Step 2: Koleksiyonlar (page, faq, post, job)**

Her biri için `CollectionConfig`: localized alanlar `localized:true`, zengin metin `richText` (lexical), görsel `upload`, slug `text unique`. `siteSettings` globals'taki `sosyal` alanları (linkedin/instagram/youtube/x/facebook/whatsapp) → `group` içinde `text` alanlar.

- [ ] **Step 3: Globals**

Create `src/globals/SiteSettings.ts`:
```typescript
import type { GlobalConfig } from 'payload'
export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  access: { read: () => true },
  fields: [
    { name: 'sirketAdi', type: 'text', required: true },
    { name: 'iletisim', type: 'group', fields: [
      { name: 'tel', type: 'text' }, { name: 'email', type: 'text' },
      { name: 'adres', type: 'text', localized: true },
    ]},
    { name: 'sosyal', type: 'group', fields: [
      { name: 'linkedin', type: 'text' }, { name: 'instagram', type: 'text' },
      { name: 'youtube', type: 'text' }, { name: 'x', type: 'text' },
      { name: 'facebook', type: 'text' }, { name: 'whatsapp', type: 'text' },
    ]},
  ],
}
```
`Navigation.ts` benzer desen (mevcut `navigation.ts` alanları).

- [ ] **Step 4: payload.config.ts globals + collections + migration + doğrula**

`globals: [SiteSettings, Navigation]`, `collections`'a Page/Faq/Post/Job ekle.
Run: `npx payload migrate:create collections2 && npm run dev`
Expected: `/admin`'de tüm koleksiyon + global'lar görünür ve düzenlenebilir.

- [ ] **Step 5: Commit**

```bash
git add src/collections src/globals payload.config.ts migrations src/payload-types.ts
git commit -m "feat(payload): page/faq/post/job koleksiyonları + siteSettings/navigation globals"
```

---

### Task 7: Seed script (ilk admin + placeholder içerik)

**Files:** Create `src/payload/seed.ts`, Modify `package.json` (script)
**Interfaces:** Consumes: tüm koleksiyon/global tipleri. Produces: `npm run payload:seed` — idempotent; ilk admin + her koleksiyonda örnek kayıt + globals.

- [ ] **Step 1: Seed script**

Create `src/payload/seed.ts` — `getPayload({ config })` ile: admin user (varsa atla), siteSettings/navigation `updateGlobal`, her koleksiyona 1-2 örnek kayıt (`payload.create`, mevcut Sanity seed/kod fallback metinlerini baz al). Idempotent: önce `find` ile var mı bak.

- [ ] **Step 2: package.json script**

`"payload:seed": "tsx src/payload/seed.ts"` ekle (`npm i -D tsx` gerekebilir).

- [ ] **Step 3: Çalıştır + doğrula**

Run: `npm run payload:seed`
Expected: `/admin`'de globals dolu, koleksiyonlarda örnek kayıtlar; tekrar çalıştırınca duplicate olmaz.

- [ ] **Step 4: Commit**

```bash
git add src/payload/seed.ts package.json package-lock.json
git commit -m "feat(payload): idempotent seed (ilk admin + placeholder içerik)"
```

---

### Task 8: Production stack — postgres + minio + web env

**Files:** Modify `deploy/stack.yml`, Create `deploy/.env.example` güncellemesi
**Interfaces:** Produces: Swarm'da `postgres` + `minio` servisleri (yalnız `app-internal` ağında); `web` servisi `DATABASE_URI`/`PAYLOAD_SECRET`/`S3_*` env + `app-internal` ağı.

- [ ] **Step 1: app-internal ağı + postgres + minio servisleri**

`deploy/stack.yml`'e ekle (networks'e `app-internal: { driver: overlay, internal: true }`; volumes'e `pgdata`, `miniodata`):
```yaml
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: redwall
      POSTGRES_USER: redwall
      POSTGRES_PASSWORD_FILE: /run/secrets/pg_password
    secrets: [pg_password]
    volumes: ["pgdata:/var/lib/postgresql/data"]
    networks: [app-internal]
    deploy: { placement: { constraints: ["node.role == manager"] }, restart_policy: { condition: any } }
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER_FILE: /run/secrets/minio_user
      MINIO_ROOT_PASSWORD_FILE: /run/secrets/minio_password
    secrets: [minio_user, minio_password]
    volumes: ["miniodata:/data"]
    networks: [app-internal]
    deploy: { restart_policy: { condition: any } }
```
(Postgres/MinIO `ports` YOK — dışa kapalı.)

- [ ] **Step 2: web servisine env + ağ + secret**

`web` servisine: `networks: [traefik-public, app-internal]`; environment'e `DATABASE_URI`, `PAYLOAD_SECRET_FILE`, `S3_BUCKET`, `S3_ENDPOINT=http://minio:9000`, `S3_REGION`, `S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY` (secret dosyalarından entrypoint ile export veya `*_FILE` deseni). `DATABASE_URI=postgres://redwall:<pg_password>@postgres:5432/redwall`.

- [ ] **Step 3: Docker secret'ları sunucuda oluştur**

Run (sunucuda):
```bash
printf '%s' '<güçlü-pg-pass>' | docker secret create pg_password -
printf '%s' '<32+ rastgele>'   | docker secret create payload_secret -
printf '%s' 'redwall'          | docker secret create minio_user -
printf '%s' '<güçlü-minio>'    | docker secret create minio_password -
```
`stack.yml` top-level `secrets:` bunları `external: true` tanımlar.

- [ ] **Step 4: Doğrula (yerel YAML)**

Run: `WEB_IMAGE=x SITE_HOST=redwall.tr SANITY_API_READ_TOKEN=x docker compose -f deploy/stack.yml config >/dev/null && echo OK`
Expected: `OK` (YAML/interpolasyon geçerli).

- [ ] **Step 5: Commit**

```bash
git add deploy/stack.yml deploy/.env.example
git commit -m "feat(deploy): stack'e postgres + minio (iç ağ) + web payload env/secret"
```

---

### Task 9: CI — migration + migration öncesi pg yedeği

**Files:** Modify `.github/workflows/deploy.yml`, `Dockerfile`
**Interfaces:** Produces: deploy sırasında `payload migrate` (yeni şemayı uygular); migration öncesi `pg_dump` → MinIO.

- [ ] **Step 1: Dockerfile — payload binary + migrate erişimi**

Runner aşamasının standalone çıktısında `payload` CLI'yi çağırabilmek için migration'ları imaja dahil et (`COPY migrations`), ve container başlangıcında migrate çalıştıran küçük bir entrypoint ekle veya CI deploy adımında `docker exec` ile çalıştır.

- [ ] **Step 2: deploy job — yedek + migrate adımı**

`deploy.yml` ssh script'ine (stack deploy SONRASI), migration öncesi yedek:
```bash
docker exec $(docker ps -qf name=redwall_postgres) pg_dump -U redwall redwall | gzip > /tmp/pre-migrate.sql.gz
docker run --rm --network <app-internal> -v /tmp:/b minio/mc ... cp /tmp/pre-migrate.sql.gz d/redwall-backups/
# sonra migrate:
docker exec $(docker ps -qf name=redwall_web) node node_modules/payload/dist/bin/index.js migrate
```
(Tam komutlar implementasyonda Payload CLI yoluna göre netleşir; `npx payload migrate` standalone'da uygun script ile.)

- [ ] **Step 3: Doğrula**

Implementasyon sırasında Task 10 deploy'unda bu adımların loglarda yeşil koştuğu görülür (ayrı birim testi yok — entegrasyon doğrulaması Task 10).

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml Dockerfile
git commit -m "feat(ci): deploy'da payload migrate + migration öncesi pg yedeği (MinIO)"
```

---

### Task 10: Deploy 2a + canlı doğrulama

**Files:** (yok — deploy + doğrulama)
**Interfaces:** Produces: Canlı `redwall.tr/admin` (Payload); site hâlâ Sanity'den okur ve etkilenmemiştir.

- [ ] **Step 1: PR → main merge → push (CI tetiklenir)**

`feat/payload-cms` → `main`. Push CI'ı tetikler: build → Docker Hub → SSH deploy (+ migrate + yedek).

- [ ] **Step 2: CI yeşil doğrula**

Run: `gh run watch <id> --exit-status`
Expected: build + deploy yeşil; deploy logunda `migrate` ve `pg_dump` adımları başarılı.

- [ ] **Step 3: Servisler + /admin canlı**

Run (sunucuda): `docker stack services redwall`
Expected: `redwall_postgres` 1/1, `redwall_minio` 1/1, `redwall_web` 2/2.
Run (origin): `curl -sk -o /dev/null -w '%{http_code}' -H 'Host: redwall.tr' https://127.0.0.1/admin`
Expected: `200` (Payload paneli).

- [ ] **Step 4: Site regresyon yok (hâlâ Sanity)**

Run: `curl -s -o /dev/null -w '%{http_code}' https://redwall.tr/tr` → `200`; hero render.
Expected: Site davranışı Faz 1'le aynı.

- [ ] **Step 5: Seed (canlı)**

Run (sunucuda, web container içinde): `npm run payload:seed` veya seed'i deploy adımına ekle.
Expected: Canlı `/admin`'de placeholder içerik + ilk admin (güçlü parola) hazır.

---

## Self-Review (Faz 2a)

- **Spec coverage:** Entegre (Task 3) ✔, Postgres (3,8) ✔, MinIO (4,8) ✔, i18n (3) ✔, koleksiyon+globals (5,6) ✔, seed (7) ✔, migration+yedek (9) ✔, güvenlik/iç ağ+secret (8) ✔, deploy+canlı doğrulama (10) ✔, site etkilenmez (10/4) ✔. Next≥16.2.6 ön koşulu (Task 1) — spec risk maddesini kapatır. ✔
- **Placeholder:** Task 5/6'da koleksiyon alanları "kaynak Sanity şemasını oku" ile somutlanıyor (repo'daki mevcut otoriter şema; placeholder değil, kaynağa işaret). Task 9 tam CLI yolu implementasyonda netleşecek (Payload standalone migrate yolu sürüme bağlı) — bilinçli, Task 10'da doğrulanır.
- **Tutarlılık:** Env adları (`DATABASE_URI`, `PAYLOAD_SECRET`, `S3_*`) Task 2/3/4/8 boyunca aynı; slug'lar (`media`,`service`,`product`,`referans`,`page`,`faq`,`post`,`job`,`siteSettings`,`navigation`) tutarlı. ✔
