# Zengin Editöre Video/Ses Gömme (Dış Platform Embed) — Tasarım

**Tarih:** 2026-07-04 · **Durum:** Kullanıcı tasarımı onayladı; kozmetik işle TEK PAKET

## Amaç
Tüm zengin metin (Lexical) editörlerine, YouTube/Vimeo (video) ve SoundCloud/Spotify
(ses) içeriğini URL yapıştırarak gömme özelliği eklemek. Dosyalar Redwall sunucusunda
TUTULMAZ — oynatıcı ilgili platformdan gelir (disk/bant genişliği yükü yok; VDS 48GB
kısıtı gözetildi).

## Onaylanan kararlar
- **Kaynak modeli:** yalnız **dış platform gömme** (kendi dosya yükleme YOK).
- **Platformlar:** YouTube, Vimeo, SoundCloud, Spotify (dördü de).
- **Mekanizma:** Payload **BlocksFeature** ile tek "Medya Gömme" bloğu, config seviyesinde
  (tablo feature'ının yanına) → tüm richText alanlarında çıkar. Şema değişmez → **migration YOK**
  (blok, mevcut jsonb'a düğüm olarak serileşir).

## Mevcut durum (doğrulandı)
- **CSP mevcut** ([next.config.ts:35](next.config.ts:35)): `Content-Security-Policy: frame-ancestors 'self'`
  + `X-Frame-Options: SAMEORIGIN`. Bunlar sitenin BAŞKALARINCA çerçevelenmesini kısıtlar;
  dış iframe GÖMMEMİZİ engellemez (frame-src/default-src yok). Yine de en iyi pratik: gömme
  domainleri için açık `frame-src` allowlist eklenir.
- **Media koleksiyonu** yalnız resim + PDF mime kabul ediyor; bu iş kendi dosya yüklemediği
  için Media'ya DOKUNULMAZ.
- Editör config seviyesinde tek kaynak (`payload.config.ts`); tüm alanlar miras alır
  (tablo feature ile aynı desen). Site render: `RichContent` → `RichText`
  (`@payloadcms/richtext-lexical/react`).

## Mimari / birimler
Her biri tek sorumlu, iyi sınırlı:

1. **`src/blocks/MediaEmbed.ts`** — Payload blok tanımı. `slug: 'mediaEmbed'`, alanlar:
   - `url` (text, **required**) — platform bağlantısı.
   - `baslik` (text, opsiyonel, localized) — erişilebilirlik/caption.
   Blok admin'de "Medya Gömme" etiketiyle görünür.

2. **`src/lib/embed/parseEmbedUrl.ts`** — SAF fonksiyon (dış çağrı yok):
   `parseEmbedUrl(url: string): { platform: 'youtube'|'vimeo'|'soundcloud'|'spotify'; embedSrc: string; tur: 'video'|'ses'; oran: '16/9'|null } | null`
   - YouTube: `youtube.com/watch?v=ID`, `youtu.be/ID`, `youtube.com/embed/ID` → `https://www.youtube-nocookie.com/embed/ID` (tur video, oran 16/9).
   - Vimeo: `vimeo.com/ID` (+ `/video/ID`) → `https://player.vimeo.com/video/ID` (video, 16/9).
   - SoundCloud: `soundcloud.com/...` → `https://w.soundcloud.com/player/?url=<encode>` (ses, oran null → sabit yükseklik).
   - Spotify: `open.spotify.com/{track|episode|album|playlist}/ID` → `https://open.spotify.com/embed/{tip}/ID` (ses, sabit yükseklik).
   - Tanınmayan/geçersiz URL → `null`. **Tek saf-mantık parçası → TDD ile birim testli.**

3. **`src/lib/embed/parseEmbedUrl.test.ts`** — her platformun URL varyantları → doğru
   `embedSrc`; geçersiz/tanınmayan → `null`; XSS denemesi (`javascript:` vb.) → `null`.

4. **`src/components/ui/MediaEmbed.tsx`** — render:
   - `parseEmbedUrl(url)` çağırır. `null` ise → **düz bağlantı fallback** (`<a href>` — asla
     ham iframe basma). Sonuç varsa → responsive iframe.
   - Video: 16/9 responsive sarmalayıcı (`aspect-video` / padding-top hilesi).
   - Ses: sabit yükseklik (SoundCloud ~166px, Spotify ~152/352px).
   - iframe öznitelikleri: `loading="lazy"`, `referrerpolicy="strict-origin-when-cross-origin"`,
     platforma uygun minimal `allow` (autoplay; encrypted-media; picture-in-picture; clipboard-write —
     ama over-sandbox YOK, yoksa oynatıcı bozulur), `title={baslik ?? platform}`.
   - `baslik` verilmişse `<figcaption>` olarak altına.

5. **`src/components/ui/RichContent.tsx`** — `RichText`'in `converters` prop'una
   `blocks: { mediaEmbed: ({ node }) => <MediaEmbed url={node.fields.url} baslik={node.fields.baslik} /> }`
   eklenir; Payload varsayılan converter'larıyla birleştirilir (tablo render'ı bozulmaz).
   RichContent dış API'si değişmez.

6. **`payload.config.ts`** — features dizisine `BlocksFeature({ blocks: [MediaEmbed] })` eklenir
   (mevcut `EXPERIMENTAL_TableFeature()` ile birlikte). Import: `BlocksFeature` from `@payloadcms/richtext-lexical`.

7. **`next.config.ts`** — CSP'ye `frame-src` allowlist eklenir: `'self'` + `https://www.youtube-nocookie.com`
   `https://www.youtube.com` `https://player.vimeo.com` `https://w.soundcloud.com` `https://open.spotify.com`.
   Mevcut `frame-ancestors 'self'` + `X-Frame-Options` KORUNUR.

## Güvenlik
- iframe yalnız tanınan platform için basılır; kullanıcı URL'si doğrudan `src`'ye gitmez —
  parse edilip bilinen embed kalıbına oturtulur (arbitrary-iframe/XSS engeli).
- `frame-src` allowlist yalnız 4 domain (allowlist dışı gömme yüklenmez).
- YouTube `youtube-nocookie.com` (KVKK/izleme azaltımı).
- parseEmbedUrl `http(s)` dışı şemaları (`javascript:`, `data:`) reddeder.

## Kritik uygulama tuzağı (tablo feature dersinden)
BlocksFeature admin için **client bileşeni** kaydeder → `npx payload generate:importmap`
çalıştırılıp `src/app/(payload)/admin/importMap.js` commit'lenmeli. Yoksa blok admin
editöründe SESSİZCE çıkmaz (build hata vermez). Bu adım plana açıkça yazılır.

## Hata yönetimi
- Geçersiz/boş URL → MediaEmbed düz bağlantı ya da hiçbir şey (null-güvenli).
- Bilinmeyen blok tipi → RichText varsayılanı (kırılmaz).
- Editörde URL doğrulaması opsiyonel (blok field validate) — MVP'de render-taraflı fallback yeterli.

## Test
- **Birim (TDD):** `parseEmbedUrl` — 4 platform × URL varyantları + geçersiz + kötü-şema.
- **Build:** `npx tsc --noEmit && npm run lint && npm run build` (0 error) + `generate:importmap` sonrası importMap commit'li.
- **Preview:** `/admin`'de bir richText alanına 4 platformdan birer gömme (URL yapıştır) →
  editörde blok görünür; sitede responsive + dark render; tarayıcı konsolunda CSP frame-src
  hatası yok; geçersiz URL fallback bağlantı verir.

## Kapsam dışı (YAGNI)
- Kendi dosya (mp4/mp3) yükleme + native player (ayrı iş; disk riski).
- oEmbed API çağrısı / otomatik başlık çekme (statik parse yeter).
- Playlist/zaman-damgası/otomatik oynat parametreleri (temel gömme yeter).
- Diğer platformlar (TikTok, Twitch vb.) — istenirse sonra eklenir (parser + CSP genişletilir).

## Paketleme
Bu iş, `2026-07-04-tipografi-tablo-tema-design.md` (kozmetik: typography + tablo tema) ile
**TEK PAKET** olarak tek plan + tek deploy'da ilerler (kullanıcı kararı). İki iş bağımsız
dosyalara dokunur (kozmetik: globals.css; gömme: config/RichContent/next.config/blocks/lib),
tek çakışma noktası RichContent (tablo converter + blok converter aynı yerde birleşir).
