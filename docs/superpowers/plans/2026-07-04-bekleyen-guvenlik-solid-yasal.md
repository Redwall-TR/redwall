# Bekleyen İşler (Güvenlik + SOLID + Yasal) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Denetim + içerik bekleyen işlerini gidermek: yasal "taslaktır" kartını kaldır, accent rengini merkezileştir, şişmiş dosyalardan veriyi ayır, Turnstile'ı üretimde fail-closed yap, rate-limit'i Postgres tabanlı dağıtık yap.

**Architecture:** İş 1/2/3/5-render saf CSS/TS taşıma (davranış değişmez). İş 4 form action davranışı (fail-closed). İş 5 Postgres tablosu (migration) + form action'ında raw SQL (`payload.db.drizzle`).

**Tech Stack:** Next.js 16 (App Router, server actions), Payload 3.85 (`@payloadcms/db-postgres`, `sql`), Postgres, TypeScript, Vitest.

## Global Constraints

- Lint: `@typescript-eslint/no-explicit-any` ERROR → `unknown` / gerçek tipler.
- Renk değerleri AYNI kalır (accent `#e63950`) → görsel değişmez.
- Refactor "saf taşıma": JSX/render mantığı DEĞİŞMEZ, yalnız veri/sabit başka dosyaya taşınır → çıktı birebir aynı.
- Migration deseni: `import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'`; `db.execute(sql\`...\`)`. Dev migrate `npx payload migrate` >60sn asılırsa BLOCKED.
- Form action'da DB erişimi: `const payload = await getPayloadClient(); payload.db.drizzle.execute(sql\`...\`)` — implementer erişim yolunu (`payload.db.drizzle`) çalışır olduğundan emin olur; alternatif `payload.db.pool.query`.
- Rate-limit DB hatasında **fail-open** (gönderime izin + log); Turnstile secret-yok+prod'da **fail-closed** (reddet + log).
- Her iş `npx tsc --noEmit && npm run lint && npm run build` yeşil olmalı.

---

### Task 1: Yasal "taslaktır" uyarı kartını kaldır

**Files:**
- Modify: `src/app/(site)/[locale]/yasal/[slug]/page.tsx`

**Interfaces:** (yok)

- [ ] **Step 1: Banner bloğunu kaldır** — `yasal/[slug]/page.tsx` içindeki draft/advisory uyarı bloğunu sil:
```tsx
          {/* Draft / legal advisory warning banner */}
          {isLegal && (
            <div
              role="note"
              className="rounded-lg border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-200"
            >
              {isTr
                ? '⚠️ Bu metin taslaktır; yürürlüğe koymadan önce KVKK danışmanınıza kontrol ettirin.'
                : '⚠️ This is a draft; have it reviewed by a data-protection advisor before relying on it.'}
            </div>
          )}
```
  (Tam metin dosyada; `role="note"` amber banner. Tamamını kaldır.)

- [ ] **Step 2: Kullanılmayan `isLegal` temizle** — banner kaldırılınca `const isLegal = data.kategori === 'legal';` başka yerde kullanılmıyorsa o satırı da sil. Kullanılıyorsa bırak. Kontrol: `grep -n "isLegal" src/app/\(site\)/\[locale\]/yasal/\[slug\]/page.tsx`.

- [ ] **Step 3: Doğrula** — `npx tsc --noEmit && npm run lint && npm run build` (0 error). Preview: `/tr/yasal/kvkk-aydinlatma` → banner YOK, içerik + PageHero yerinde, 200.

- [ ] **Step 4: Commit**
```bash
git add "src/app/(site)/[locale]/yasal/[slug]/page.tsx"
git commit -m "content: yasal sayfalardan taslak uyarı banner'ı kaldırıldı (metinler nihai)"
```

---

### Task 2: Accent rengini merkezileştir

**Files:**
- Create: `src/lib/theme.ts`
- Modify: `#e63950` (ve varsa `#c41e3a`/`#9a1830`) geçen tüm `.ts`/`.tsx` dosyaları

**Interfaces:**
- Produces: `export const ACCENT = '#e63950'` (+ `PRIMARY`, `PRIMARY_DARK`).

- [ ] **Step 1: theme.ts oluştur** — `src/lib/theme.ts`:
```ts
/** Marka renk sabitleri (globals.css'teki --primary* değişkenlerinin JS karşılığı).
 *  Inline style / SVG / bileşen prop'larında literal renk gereken yerler için tek kaynak. */
export const ACCENT = '#e63950' // --primary-light (aksан/vurgu)
export const PRIMARY = '#c41e3a' // --primary
export const PRIMARY_DARK = '#9a1830' // --primary-dark
```

- [ ] **Step 2: Hardcoded renkleri bul** — Run: `grep -rln "#e63950\|#c41e3a\|#9a1830" src --include="*.tsx" --include="*.ts" | grep -v "globals.css\|theme.ts"`
  Beklenen ~21 dosya (referanslar, teklif, iletisim, dokumanlar, kariyer, yazilim*, yasal/kvkk-basvuru, vb.).

- [ ] **Step 3: Her dosyada değiştir** — her dosyada `#e63950` → `ACCENT` (JSX prop `accent="#e63950"` → `accent={ACCENT}`; TS `const ACCENT = '#e63950'` → `import { ACCENT } from '@/lib/theme'` kullan, yerel tanımı kaldır). `#c41e3a`/`#9a1830` varsa `PRIMARY`/`PRIMARY_DARK`. Her dosyaya `import { ACCENT } from '@/lib/theme';` (gerekli sabitler) eklenir. Renk değeri AYNI → görsel değişmez.
  Not: `yazilim/[urun]/page.tsx`'te yerel `const ACCENT = '#e63950';` (satır ~39) var → onu kaldırıp import et (Task 3 aynı dosyaya dokunacak; bu task önce çalışır).

- [ ] **Step 4: Kalıntı yok doğrula** — Run: `grep -rn "#e63950\|#c41e3a\|#9a1830" src --include="*.tsx" --include="*.ts" | grep -v "globals.css\|theme.ts"` → BOŞ (hepsi sabite taşındı).

- [ ] **Step 5: Doğrula** — `npx tsc --noEmit && npm run lint && npm run build` (0 error). Preview: birkaç sayfada (referanslar, iletisim) accent rengi görsel AYNI.

- [ ] **Step 6: Commit**
```bash
git add src/lib/theme.ts src
git commit -m "refactor: accent/marka rengi src/lib/theme.ts sabitine merkezileştirildi"
```

---

### Task 3: Şişmiş dosyalardan FALLBACK verisini ayır

**Files:**
- Create: `src/data/urun-fallback.ts`, `src/data/danismanlik-fallback.ts`
- Modify: `src/app/(site)/[locale]/yazilim/[urun]/page.tsx`, `src/components/sections/ServiceDetail.tsx`

**Interfaces:**
- Produces: `urun-fallback.ts` → `export const FALLBACK`, `export const FEATURE_ICONS`, ilgili tipler (`KnownSlug`, `Feature` vb.). `danismanlik-fallback.ts` → `export const DANISMANLIK_FALLBACK`.

- [ ] **Step 1: urun-fallback.ts oluştur** — `yazilim/[urun]/page.tsx`'ten şu sabitleri KES ve `src/data/urun-fallback.ts`'e taşı: `KNOWN_SLUGS`, `KnownSlug` (type), `Feature`/`LocaleString` gibi bu veriye özgü tipler, `FEATURE_ICONS`, `FALLBACK`. Sayfada halen kullanılan tipleri `export` et. (Render'da kullanılan `ACCENT` Task 2'de import edildi — o kalır.)

- [ ] **Step 2: Sayfada import et** — `yazilim/[urun]/page.tsx` üstüne: `import { FALLBACK, FEATURE_ICONS, KNOWN_SLUGS, type KnownSlug } from '@/data/urun-fallback';` (taşınan her sembol). Yerel tanımları kaldır. Render JSX AYNI kalır.

- [ ] **Step 3: danismanlik-fallback.ts oluştur** — `ServiceDetail.tsx`'ten `DANISMANLIK_FALLBACK` (ve yalnız ona ait tip/sabitler) KES → `src/data/danismanlik-fallback.ts`, `export const DANISMANLIK_FALLBACK = {...}`. Bileşende `import { DANISMANLIK_FALLBACK } from '@/data/danismanlik-fallback';`. Render AYNI.

- [ ] **Step 4: Doğrula** — `npx tsc --noEmit && npm run lint && npm run build` (0 error). `wc -l` ile iki dosyanın küçüldüğünü gör. Preview: `/tr/yazilim/yanginpro` + `/tr/danismanlik` (veya ServiceDetail render eden sayfa) TR+EN görsel/işlevsel AYNI (fallback içerik doğru görünür).

- [ ] **Step 5: Commit**
```bash
git add "src/app/(site)/[locale]/yazilim/[urun]/page.tsx" src/components/sections/ServiceDetail.tsx src/data/
git commit -m "refactor: ürün + danışmanlık fallback verisi src/data'ya taşındı (SRP)"
```

---

### Task 4: Turnstile üretimde fail-closed

**Files:**
- Modify: `src/app/actions/form-gonderim.ts`
- Test: `src/app/actions/turnstile.test.ts` (yeni)

**Interfaces:**
- `verifyTurnstile` export edilir (test için).

- [ ] **Step 1: Failing test yaz** — `src/app/actions/turnstile.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { verifyTurnstile } from './form-gonderim';

afterEach(() => { vi.unstubAllEnvs(); });

describe('verifyTurnstile — secret yok', () => {
  it('üretimde secret yoksa reddeder (fail-closed)', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    vi.stubEnv('NODE_ENV', 'production');
    expect(await verifyTurnstile('herhangi', '1.2.3.4')).toBe(false);
  });
  it('development ortamında secret yoksa atlar (izin verir)', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    vi.stubEnv('NODE_ENV', 'development');
    expect(await verifyTurnstile(undefined, 'unknown')).toBe(true);
  });
});
```

- [ ] **Step 2: Test'in fail ettiğini gör** — Run: `npm test -- turnstile`
  Expected: FAIL (`verifyTurnstile` export değil VEYA prod dalı `true` dönüyor).

- [ ] **Step 3: verifyTurnstile'ı düzelt + export et** — `form-gonderim.ts`: `async function verifyTurnstile` → `export async function verifyTurnstile`; `if (!secret)` dalını değiştir:
```ts
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[turnstile] TURNSTILE_SECRET_KEY tanımsız — üretimde form reddedildi (fail-closed)')
      return false
    }
    return true // dev: özellik yapılandırılmamış → atla
  }
```
  Kalan fetch/doğrulama mantığı AYNI.

- [ ] **Step 4: Test geçer** — Run: `npm test -- turnstile` → PASS (2 test). Ardından `npx tsc --noEmit && npm run lint` (0 error).

- [ ] **Step 5: Commit**
```bash
git add src/app/actions/form-gonderim.ts src/app/actions/turnstile.test.ts
git commit -m "fix: Turnstile üretimde fail-closed (secret yoksa formu reddet + logla)"
```

---

### Task 5: Rate-limit'i Postgres tabanlı dağıtık yap

**Files:**
- Create: `src/migrations/<ts>_form_rate_limit.ts`
- Modify: `src/app/actions/form-gonderim.ts`

**Interfaces:**
- Consumes: `payload.db.drizzle`, `sql` (`@payloadcms/db-postgres`).

- [ ] **Step 1: Migration üret + yaz** — Run: `npx payload migrate:create form_rate_limit`. Üretilen `up`/`down`'ı şununla değiştir:
```ts
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "form_rate_limit" (
      "ip" varchar(64) NOT NULL,
      "hit_at" bigint NOT NULL
    );
  `)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "form_rate_limit_ip_hit_at_idx" ON "form_rate_limit" ("ip", "hit_at");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "form_rate_limit";`)
}
```

- [ ] **Step 2: Migration'ı çalıştır (dev)** — Run: `npx payload migrate`
  Expected: hızlı tamamlanır (asılmaz). `form_rate_limit` tablosu oluşur.

- [ ] **Step 3: rateLimited'ı Postgres'e çevir** — `form-gonderim.ts`: bellek-içi `hits` Map + `rateLimited` yerine `sql` import et (`import { sql } from '@payloadcms/db-postgres'`) ve:
```ts
const WINDOW_MS = 10 * 60 * 1000 // 10 dk
const MAX_PER_WINDOW = 5

// Postgres tabanlı dağıtık hız sınırı (tüm replikalar paylaşır, restart'a dayanıklı).
// DB hatası → fail-open (log) — rate-limit arızası meşru gönderimi kilitlemesin.
async function rateLimited(ip: string): Promise<boolean> {
  if (!ip || ip === 'unknown') return false
  const now = Date.now()
  const windowStart = now - WINDOW_MS
  try {
    const payload = await getPayloadClient()
    const db = payload.db.drizzle
    await db.execute(sql`DELETE FROM "form_rate_limit" WHERE "hit_at" < ${windowStart}`)
    const res = await db.execute(
      sql`SELECT count(*)::int AS c FROM "form_rate_limit" WHERE "ip" = ${ip} AND "hit_at" >= ${windowStart}`,
    )
    const rows = (res as unknown as { rows?: Array<{ c: number }> }).rows ?? (res as unknown as Array<{ c: number }>)
    const count = Number(rows?.[0]?.c ?? 0)
    if (count >= MAX_PER_WINDOW) return true
    await db.execute(sql`INSERT INTO "form_rate_limit" ("ip", "hit_at") VALUES (${ip}, ${now})`)
    return false
  } catch (err) {
    console.error('[rate-limit] Postgres hatası — fail-open:', err)
    return false
  }
}
```
  NOT: `db.execute` dönüş şekli sürüme göre `{ rows: [...] }` veya doğrudan dizi olabilir; implementer dev'de gerçek dönüşü loglayıp `count` çıkarımını ona göre kesinleştirir (yukarıdaki iki-durumlu okuma çoğu durumu kapsar). `getPayloadClient` zaten import'lu.

- [ ] **Step 4: Çağrı yerini await'e çevir** — `submitForm` içinde `if (rateLimited(ip))` → `if (await rateLimited(ip))` (fonksiyon artık async).

- [ ] **Step 5: Doğrula** — `npx tsc --noEmit && npm run lint && npm run build` (0 error); `npm test` (mevcut testler + turnstile yeşil). Preview: iletişim formunu aynı IP'den 6 kez gönder → 6.'da `rate` hatası; `form_rate_limit` tablosunda satırlar (`SELECT count(*) FROM form_rate_limit;`). Sunucu restart'ında sayaç KORUNUR (tabloda). Test verisini gerekirse temizle (`DELETE FROM form_rate_limit;`).

- [ ] **Step 6: Commit**
```bash
git add src/app/actions/form-gonderim.ts src/migrations/
git commit -m "feat: rate-limit Postgres tabanlı dağıtık (replikalar paylaşır, restart'a dayanıklı)"
```

---

### Task 6: Doğrulama + deploy

**Files:** (yok)

- [ ] **Step 1: Tam suite** — `npm test && npm run lint && npm run build` → PASS, 0 error.
- [ ] **Step 2: Preview uçtan uca** — yasal banner yok; accent sayfaları AYNI; yazilim/[urun]+danışmanlık fallback AYNI; form: dev'de gönderim çalışır + rate-limit 6.'da tetikler.
- [ ] **Step 3: Deploy** — `git checkout main && git merge --no-ff <branch> -m "Merge: bekleyen güvenlik + SOLID + yasal işleri"`; `git push origin main`. CI: build + `payload migrate` (form_rate_limit tablosu). `gh run watch`.
- [ ] **Step 4: Prod doğrulama** — `form_rate_limit` tablosu prod'da var; iletişim formu gönderimi çalışır (Turnstile secret dolu → geçer); yasal sayfada banner yok; accent sayfaları + yazilim/danışmanlık 200 ve görsel AYNI; diğer sayfalar 200.

---

## Self-Review Notları
- **Spec kapsamı:** yasal kart (T1) ✓; accent (T2) ✓; şişmiş dosya refactor (T3) ✓; Turnstile fail-closed + test (T4) ✓; rate-limit Postgres + migration (T5) ✓; deploy (T6) ✓. payload-types/queries cast bilinçli kapsam dışı.
- **Davranış korunumu:** T1/T2/T3 saf taşıma/kaldırma → görsel/işlev değişmez; renk değerleri aynı.
- **Güvenlik yönü:** T4 fail-closed yalnız prod+secret-yok (dev bozulmaz); T5 fail-open yalnız DB hatası (meşru kullanıcı kilitlenmez).
- **Migration güvenliği:** T5 additive (CREATE TABLE IF NOT EXISTS), veri taşımaz, geri alınabilir (DROP).
- **Tip tutarlılığı:** ACCENT/PRIMARY (T2) theme.ts'te; FALLBACK/FEATURE_ICONS/KnownSlug (T3) urun-fallback.ts'te; verifyTurnstile export (T4) testte tüketilir; rateLimited async (T5) → çağrı await.
- **Risk:** T5 form yolunu değiştiriyor → fail-open + preview 6-gönderim testi + prod form doğrulaması ile korunur.
