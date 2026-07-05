# Analytics (Umami, self-hosted) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** redwall.tr'ye env-gated self-hosted Umami analytics eklemek + ops sunucu için hazır docker-compose vermek.

**Architecture:** Saf `umamiScriptSrc` yardımcısı (env → script src | null, TDD) → `<Analytics />` server component (`next/script`, env yoksa null) → kök site layout'a bağlama + Dockerfile/deploy.yml env plumbing (build-arg). Ops sunucu teslimatı: `deploy/umami/` docker-compose + README. Web tarafı env boşken TAMAMEN inert (site etkilenmez).

**Tech Stack:** Next.js 16 (`next/script`), TypeScript, Vitest, Umami (Docker), Postgres.

## Global Constraints

- Lint: `@typescript-eslint/no-explicit-any` ERROR → `unknown`/gerçek tipler.
- Env değişkenleri: `NEXT_PUBLIC_UMAMI_URL` (Umami base, ör. `https://analytics.redwall.tr`), `NEXT_PUBLIC_UMAMI_WEBSITE_ID`. İkisi de doluysa script basılır; biri boşsa Analytics `null` (inert). `NEXT_PUBLIC_*` build-time inline (Dockerfile ARG/ENV + deploy build-arg şart).
- CSP değişmez (script-src yok → dış script serbest). Umami çerezsiz → consent/banner yok.
- **SRI (integrity) KULLANILMAZ (bilinçli):** Umami script.js kendi ops sunucundan (public CDN değil) sürüm-bazlı servis edilir; SRI hash'i her Umami güncellemesinde kırılır ve kaynak kendi altyapın olduğundan CDN-compromise riski yok. `defer` + `data-website-id` yeterli.
- Layout: public site `src/app/(site)/[locale]/layout.tsx` (/admin izlenmez).
- Her task `npx tsc --noEmit && npm run lint && npm run build` yeşil. Migration YOK.

---

### Task 1: `umamiScriptSrc` saf yardımcı (TDD)

**Files:**
- Create: `src/lib/umami.ts`
- Test: `src/lib/umami.test.ts`

**Interfaces:**
- Produces: `umamiScriptSrc(base: string | undefined, websiteId: string | undefined): { src: string; websiteId: string } | null`

- [ ] **Step 1: Failing test** — `src/lib/umami.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { umamiScriptSrc } from './umami';

describe('umamiScriptSrc', () => {
  it('ikisi de doluysa src + websiteId döner', () => {
    expect(umamiScriptSrc('https://analytics.redwall.tr', 'abc-123')).toEqual({
      src: 'https://analytics.redwall.tr/script.js', websiteId: 'abc-123',
    });
  });
  it('trailing slash normalize edilir', () => {
    expect(umamiScriptSrc('https://analytics.redwall.tr/', 'x')?.src).toBe('https://analytics.redwall.tr/script.js');
  });
  it('base yoksa null', () => {
    expect(umamiScriptSrc(undefined, 'x')).toBeNull();
    expect(umamiScriptSrc('', 'x')).toBeNull();
  });
  it('websiteId yoksa null', () => {
    expect(umamiScriptSrc('https://analytics.redwall.tr', undefined)).toBeNull();
    expect(umamiScriptSrc('https://analytics.redwall.tr', '')).toBeNull();
  });
});
```

- [ ] **Step 2: Fail** — Run: `npm test -- umami` → FAIL (modül yok).

- [ ] **Step 3: Implement** — `src/lib/umami.ts`:

```ts
/** Umami izleme script bilgisi — base + websiteId doluysa {src, websiteId}, yoksa null.
 *  Env-gating tek noktada; Analytics bileşeni bunu process.env ile çağırır. */
export function umamiScriptSrc(
  base: string | undefined,
  websiteId: string | undefined,
): { src: string; websiteId: string } | null {
  if (!base || !websiteId) return null;
  return { src: `${base.replace(/\/$/, '')}/script.js`, websiteId };
}
```

- [ ] **Step 4: Pass** — Run: `npm test -- umami` → PASS (4 test). Sonra `npx tsc --noEmit && npm run lint` (0 error).

- [ ] **Step 5: Commit**
```bash
git add src/lib/umami.ts src/lib/umami.test.ts
git commit -m "feat: umamiScriptSrc — env-gated Umami script bilgisi (saf, testli)"
```

---

### Task 2: `Analytics` bileşeni + layout + env plumbing

**Files:**
- Create: `src/components/analytics/Analytics.tsx`
- Modify: `src/app/(site)/[locale]/layout.tsx`, `Dockerfile`, `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `umamiScriptSrc` (Task 1).

- [ ] **Step 1: Analytics bileşeni** — `src/components/analytics/Analytics.tsx`:

```tsx
import Script from 'next/script';
import { umamiScriptSrc } from '@/lib/umami';

/** Umami izleme script'i — env doluysa basar, yoksa null (inert). Çerezsiz (KVKK). */
export function Analytics() {
  const cfg = umamiScriptSrc(process.env.NEXT_PUBLIC_UMAMI_URL, process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID);
  if (!cfg) return null;
  return <Script defer src={cfg.src} data-website-id={cfg.websiteId} strategy="afterInteractive" />;
}
```

- [ ] **Step 2: Layout'a bağla** — `src/app/(site)/[locale]/layout.tsx`: import
  `import { Analytics } from '@/components/analytics/Analytics';`; return içindeki
  `<div className="flex min-h-screen flex-col">` başına (JsonLd'lerin yanına) `<Analytics />` ekle:
```tsx
      <div className="flex min-h-screen flex-col">
        <Analytics />
        <JsonLd data={orgLd} />
```

- [ ] **Step 3: Dockerfile env** — `Dockerfile` NEXT_PUBLIC ARG/ENV bloğuna ekle:
  ARG satırlarına: `ARG NEXT_PUBLIC_UMAMI_URL` ve `ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID`;
  ENV bloğuna (mevcut `\` devam eden listeye): `    NEXT_PUBLIC_UMAMI_URL=$NEXT_PUBLIC_UMAMI_URL \` ve
  `    NEXT_PUBLIC_UMAMI_WEBSITE_ID=$NEXT_PUBLIC_UMAMI_WEBSITE_ID` (son satır `\`'siz, sonuncu olmalı — mevcut son satırın `\`'ini koru, yeni sonuncu `\`'siz).

- [ ] **Step 4: deploy.yml build-args** — `.github/workflows/deploy.yml` HER İKİ `build-args:` bloğuna
  (web ~satır 48 + tools ~satır 64) şu iki satırı ekle:
```yaml
            NEXT_PUBLIC_UMAMI_URL=${{ vars.NEXT_PUBLIC_UMAMI_URL }}
            NEXT_PUBLIC_UMAMI_WEBSITE_ID=${{ vars.NEXT_PUBLIC_UMAMI_WEBSITE_ID }}
```
  (var'lar GitHub'da tanımlı değilse boş string geçer → build çalışır, Analytics inert.)

- [ ] **Step 5: Doğrula** — `npx tsc --noEmit && npm run lint && npm run build` (0 error). Env YOKKEN preview:
  dev başlat, herhangi bir sayfada view-source → Umami `<script>` YOK (Analytics null). Env İLE test:
  `NEXT_PUBLIC_UMAMI_URL=https://analytics.example NEXT_PUBLIC_UMAMI_WEBSITE_ID=test npm run dev` (veya `.env.local`'e
  geçici ekle) → sayfada `<script defer src="https://analytics.example/script.js" data-website-id="test">` belirir.
  Test sonrası geçici env'i kaldır. Dev sunucuyu durdur.

- [ ] **Step 6: Commit**
```bash
git add src/components/analytics/Analytics.tsx "src/app/(site)/[locale]/layout.tsx" Dockerfile .github/workflows/deploy.yml
git commit -m "feat: env-gated Umami Analytics bileşeni + layout + build env plumbing"
```

---

### Task 3: Ops sunucu — Umami docker-compose + README

**Files:**
- Create: `deploy/umami/docker-compose.yml`, `deploy/umami/README.md`, `deploy/umami/.env.example`

**Interfaces:** (yok — ops teslimatı)

- [ ] **Step 1: docker-compose** — `deploy/umami/docker-compose.yml`:

```yaml
services:
  umami:
    image: ghcr.io/umami-software/umami:postgresql-latest
    environment:
      DATABASE_URL: postgresql://umami:${UMAMI_DB_PASSWORD}@umami-db:5432/umami
      DATABASE_TYPE: postgresql
      APP_SECRET: ${UMAMI_APP_SECRET}
    depends_on:
      umami-db:
        condition: service_healthy
    ports:
      - "3001:3000"
    restart: unless-stopped
  umami-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: umami
      POSTGRES_USER: umami
      POSTGRES_PASSWORD: ${UMAMI_DB_PASSWORD}
    volumes:
      - umami-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U umami -d umami"]
      interval: 5s
      timeout: 5s
      retries: 10
    restart: unless-stopped
volumes:
  umami-db-data:
```

- [ ] **Step 2: .env.example** — `deploy/umami/.env.example`:
```
# Umami ops kurulumu — kopyalayıp .env yapın, değerleri doldurun
UMAMI_DB_PASSWORD=guclu-bir-parola-uret
UMAMI_APP_SECRET=uzun-rastgele-bir-secret-uret
```

- [ ] **Step 3: README** — `deploy/umami/README.md`:
```markdown
# Umami Analytics — Ops Sunucu Kurulumu

Redwall için self-hosted, çerezsiz (KVKK dostu) analytics. Bu, **ops/monitör sunucusunda**
(Uptime Kuma / GlitchTip ile birlikte) çalışır — redwall web VDS'inde DEĞİL.

## Kurulum
1. `cp .env.example .env` → `UMAMI_DB_PASSWORD` ve `UMAMI_APP_SECRET`'i güçlü değerlerle doldur
   (ör. `openssl rand -hex 32`).
2. `docker compose up -d`
3. Panele git: `http://<ops-sunucu>:3001` (ya da Traefik/ingress ile `https://analytics.redwall.tr`).
   İlk giriş: kullanıcı `admin`, parola `umami` → **hemen parolayı değiştir**.
4. Settings → Websites → **Add website**: Name=Redwall, Domain=`redwall.tr` → kaydet.
   Üretilen **Website ID**'yi kopyala.

## redwall sitesine bağlama
GitHub repo → Settings → Variables'a ekle:
- `NEXT_PUBLIC_UMAMI_URL` = `https://analytics.redwall.tr` (ya da ops URL'in)
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID` = panelden aldığın Website ID
Sonra redwall'ı yeniden deploy et (main'e push / workflow_dispatch). İzleme başlar.
Bu var'lar boşken site sorunsuz çalışır (Analytics inert).

## TLS / ingress
Ops sunucun Traefik/nginx kullanıyorsa `analytics.redwall.tr`'yi umami:3000'e yönlendir.
Doğrudan port ile de çalışır (3001) ama TLS önerilir.
```

- [ ] **Step 4: Doğrula** — Run: `docker compose -f deploy/umami/docker-compose.yml config` (yml geçerli mi;
  Docker yoksa `python3 -c "import yaml,sys; yaml.safe_load(open('deploy/umami/docker-compose.yml'))"` ile YAML syntax).
  Uygulama build'ini etkilemez (repo dışı runtime); `npx tsc --noEmit` yine 0.

- [ ] **Step 5: Commit**
```bash
git add deploy/umami/
git commit -m "feat: Umami ops sunucu docker-compose + README (self-hosted analytics)"
```

---

### Task 4: Doğrulama + deploy

**Files:** (yok)

- [ ] **Step 1: Tam suite** — `npm test && npm run lint && npm run build` → PASS, 0 error.
- [ ] **Step 2: Preview** — env yokken Umami script YOK (inert); env geçici verilince script belirir (Task 2 Step 5).
- [ ] **Step 3: Deploy** — `git checkout main && git merge --no-ff <branch> -m "Merge: Umami analytics (env-gated) + ops compose"`;
  `git push origin main`. CI: build (UMAMI var'ları BOŞ → inert). `gh run watch`.
- [ ] **Step 4: Prod doğrulama** — sayfalar 200; view-source'ta Umami script YOK (var'lar henüz boş — beklenen, inert);
  site sağlıklı. (Umami sunucu + var'lar kullanıcı tarafından kurulunca script otomatik gelir.)

---

## Self-Review Notları
- **Spec kapsamı:** umamiScriptSrc (T1) ✓; Analytics bileşeni + layout + env plumbing (T2) ✓; ops docker-compose + README (T3) ✓; deploy (T4) ✓. Faz-2 dönüşüm event'i kapsam dışı (spec).
- **Env-gated güvenlik:** env boşken Analytics null → site inert; prod'da var'lar boş deploy edilir, script gelmez (kullanıcı sunucu+var kurunca aktifleşir).
- **CSP:** değişmez (script-src yok). Migration yok. Şema değişmez.
- **Tip tutarlılığı:** `umamiScriptSrc(base?, websiteId?)` T1'de tanımlı, T2 Analytics onu `process.env` ile çağırır.
- **Build-time env:** NEXT_PUBLIC_* Dockerfile ARG/ENV + deploy build-arg (her iki hedef) — inline şart, T2 Step 3-4.
