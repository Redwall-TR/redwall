# Bekleyen İşler: Güvenlik + SOLID + Yasal Kart — Tasarım

**Tarih:** 2026-07-04 · **Durum:** Kararlar alındı (kullanıcı), uygulanacak

## Amaç
Denetim raporlarından (`docs/audit/2026-07-04-*.md`) çıkan seçili bulguları + bir içerik
işini gidermek. Beş bağımsız iş; hepsi mevcut mimariyi izler, tek pakette uygulanıp
tek deploy ile canlıya alınır.

## Onaylanan kararlar (kullanıcı)
1. **Yasal "taslaktır" kartı:** KALDIR (metinler nihai/onaylı).
2. **Turnstile fail-open:** üretimde **fail-closed** — `TURNSTILE_SECRET_KEY` boşsa
   prod'da formu reddet + hata logla; dev'de atlama korunur.
3. **Rate-limit:** **Postgres tabanlı** dağıtık (replikalar paylaşır, restart'a dayanıklı).
4. **Accent renk:** 21 dosyadaki hardcode `#e63950` merkezi bir sabite çekilir.
5. **Şişmiş dosyalar:** `ServiceDetail.tsx` (511) + `yazilim/[urun]/page.tsx` (559) içindeki
   hardcoded çift-dilli FALLBACK verisi ayrı `src/data/*` modüllerine taşınır (render kalır).

**Kapsam dışı (düşür):** `payload-types` yenileme — zaten güncel (regen fark üretmiyor);
queries.ts'teki `as unknown as` cast'leri adaptör katmanının bilinçli tercihi, dokunulmaz.

## İşler

### 1. Yasal "taslaktır" kartı kaldırma
`src/app/(site)/[locale]/yasal/[slug]/page.tsx:110-120` — `isLegal` koşullu amber uyarı
banner'ı kaldırılır. `isLegal` değişkeni başka yerde kullanılmıyorsa o da temizlenir.
Kalan yapı (PageHero + içerik) aynı. Şema/CMS değişmez.

### 2. Turnstile fail-closed (üretimde)
`src/app/actions/form-gonderim.ts` `verifyTurnstile`: `if (!secret)` dalı —
`process.env.NODE_ENV === 'production'` ise `console.error('[turnstile] SECRET yok — üretimde form reddedildi')`
+ `return false`; değilse (dev) mevcut `return true` (atla) korunur. Böylece bot koruması
üretimde sessizce kapanamaz; yanlış yapılandırma anında görünür (form çalışmaz).

### 3. Rate-limit → Postgres (dağıtık)
- **Şema (migration):** `form_rate_limit` tablosu: `ip varchar(64) NOT NULL`,
  `hit_at bigint NOT NULL` (epoch ms); indeks `(ip, hit_at)`. Payload migration
  (`up`: CREATE TABLE + INDEX IF NOT EXISTS; `down`: DROP TABLE).
- **Mantık:** `form-gonderim.ts` bellek-içi `Map` yerine `payload.db.drizzle` ile:
  (1) opportunistik `DELETE ... WHERE hit_at < windowStart` (global temizlik);
  (2) `SELECT count(*) WHERE ip=? AND hit_at>=windowStart`; sayı ≥ `MAX_PER_WINDOW` → reddet;
  (3) değilse `INSERT (ip, hit_at)`. Aynı pencere sabitleri (10dk / 5).
- **Hata modu:** DB hatası → **fail-open** (gönderime izin ver) + `console.error` (rate-limit
  altyapı arızasında meşru kullanıcı kilitlenmesin; honeypot+Turnstile asıl koruma).
- Sabitler `WINDOW_MS`/`MAX_PER_WINDOW` korunur.

### 4. Accent merkezileştirme
- **Yeni:** `src/lib/theme.ts` → `export const ACCENT = '#e63950'` (site birincil-açık;
  gerekiyorsa `PRIMARY = '#c41e3a'`, `PRIMARY_DARK = '#9a1830'`).
- Hardcoded `#e63950` geçen dosyalarda (`accent="#e63950"` prop'ları + `yazilim/[urun]`
  `const ACCENT`) `ACCENT` import edilip kullanılır. Renk değeri AYNI (görsel değişmez).
- `#c41e3a`/`#9a1830` geçişleri varsa aynı modülden karşılanır.

### 5. Şişmiş dosya refactor (data/render ayrımı)
- **`yazilim/[urun]/page.tsx`:** `FALLBACK` (ürün fallback içeriği) + `FEATURE_ICONS`
  → `src/data/urun-fallback.ts`'e taşınır (tipleriyle); sayfa import eder. `ACCENT` (iş 4).
- **`ServiceDetail.tsx`:** `DANISMANLIK_FALLBACK` → `src/data/danismanlik-fallback.ts`'e
  taşınır; bileşen import eder.
- Render/JSX AYNI kalır → çıktı birebir aynı (görsel/işlev değişmez), yalnız dosyalar küçülür.

## Fazlama (risk artan sıra)
1. Yasal kart (trivial) → 2. Accent (mekanik) → 3. Şişmiş dosya refactor (mekanik taşıma)
→ 4. Turnstile fail-closed (küçük, test edilebilir) → 5. Rate-limit Postgres (migration + form yolu).
Her iş kendi build/lint + gerekli testiyle; tek deploy sonunda.

## Hata yönetimi
- Turnstile: fail-closed yalnız prod + secret-yok; dev etkilenmez.
- Rate-limit DB hatası: fail-open + log (form yolu kırılmaz).
- Refactor/accent: saf taşıma → davranış değişmez; build + preview ile doğrulanır.

## Test
- **Turnstile:** birim test — secret yokken prod'da `false`, dev'de `true`; secret varken
  token'a göre. (`verifyTurnstile` saf-mantık kısmı test edilebilir; fetch mock'lanır.)
- **Rate-limit:** preview — aynı IP'den >5 gönderimde `rate` hatası; `form_rate_limit`
  tablosunda kayıt; migration dev'de hızlı.
- **Accent/refactor/yasal:** `tsc + lint + build` yeşil; preview'da ilgili sayfalar
  (yasal, yazilim/[urun], danışmanlık) görsel/işlevsel AYNI + banner yok.
- Deploy sonrası prod: form gönderimi çalışır, sayfalar 200.

## Kapsam dışı (YAGNI)
- Rate-limit için Redis/harici store (Postgres yeter).
- Turnstile'ı dev'de zorunlu kılma.
- queries.ts cast temizliği / payload-types (gereksiz).
- Diğer denetim düşük-bulguları.
