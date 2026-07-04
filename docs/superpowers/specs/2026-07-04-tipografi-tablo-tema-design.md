# Tipografi (prose) + Tablo Tema Entegrasyonu — Tasarım

**Tarih:** 2026-07-04 · **Durum:** Kullanıcı kararı alındı ("İkisi de"), spec incelemesi bekliyor

## Amaç
İki kozmetik iş: (1) `@tailwindcss/typography` eklentisini kurup site temasına
bağlamak — böylece tüm zengin-içerik gövdeleri (blog, proje, ürün, kurumsal, yasal,
SSS, referans) profesyonel tipografi (başlık ölçekleri, liste, alıntı, bağlantı,
aralıklar) kazanır; (2) zengin editörlerdeki **tabloları** sitenin tasarım diline
(marka renkleri, kenarlık, başlık satırı, dark mode) uydurmak.

Kullanıcı kararı (2026-07-04): **"İkisi de"** — eklentiyi kur + tabloya ince ayar.

## Mevcut durum (doğrulandı)
- **Tailwind v4**, CSS-first (config dosyası YOK — `tailwind.config.*` yok). Eklenti
  `globals.css`'e `@plugin` direktifiyle eklenir; JS config gerekmez.
- **`prose` kullanan 11 dosya** (hepsi şu an no-op — eklenti kurulunca AKTİFLEŞİR):
  `blog/[slug]`, `projeler/[slug]`, `yazilim/[urun]`, `yasal/[slug]`, `referanslar` (+`[slug]`),
  `sss`, `PageContent`, `RichPageView`, `ProductGrid`, `ProductFeatures`.
- **Tema değişkenleri** (`globals.css`): `--foreground`, `--muted`, `--border`, `--surface`,
  `--primary`/`--primary-light`/`--primary-dark`, `--amber`, `--navy`. Light + `.dark` varyantı.
- **Tablo render:** Payload `defaultJSXConverters` → `TableJSXConverter`, inline
  `border/padding` stiliyle basıyor (tema-dışı, sabit gri). Şema değişmez.
- Genişlik işinde eklenen `max-w-none` sınıfları eklenti gelince ANLAM kazanır
  (prose'un 65ch default'unu ezer) — zaten yerinde, ekstra iş yok.

## Onaylanan kararlar
1. **Eklenti:** `@tailwindcss/typography` devDependency olarak kurulur; `globals.css`'e
   `@plugin "@tailwindcss/typography";` eklenir.
2. **Tema bağlama:** prose renkleri site CSS değişkenlerine bağlanır. Tailwind v4'te bu,
   `globals.css`'te bir `@layer` içinde `.prose { --tw-prose-body: var(--foreground); ... }`
   ve dark için `.dark .prose { ... }` (veya `prose-invert` kullanımı) ile yapılır.
   Bağlanacak temel değişkenler: `--tw-prose-body`(foreground), `--tw-prose-headings`(foreground),
   `--tw-prose-links`(primary), `--tw-prose-bold`(foreground), `--tw-prose-bullets`(muted),
   `--tw-prose-quotes`(muted), `--tw-prose-hr`/`--tw-prose-th-borders`/`--tw-prose-td-borders`(border),
   `--tw-prose-quote-borders`(primary). Dark varyantı `.dark`'taki değişkenleri kullanır.
3. **Tablo teması:** prose'un tablo stilini marka ile uyumlu hale getir — başlık satırı
   (`thead`/`th`) hafif dolgulu ve `--surface`/kalın; hücre kenarlıkları `--border`;
   `border-collapse`; yatay taşmada `overflow-x:auto` (mobil). prose tablo değişkenleri
   yetmezse `.prose table/th/td` için globals.css'te ek kural (tema değişkenleriyle).
   Amaç: hem site içeriğindeki tablolar hem editörden gelen tablolar tutarlı görünsün.
4. **Kapsam güvenliği:** eklenti tüm 11 dosyayı etkilediğinden, deploy öncesi preview'da
   ve deploy sonrası prod'da bu sayfaların HEPSİ gözden geçirilir (aşağıda Test).

## Yapılmayacaklar (YAGNI)
- Tablo hücre birleştirme, sıralama, responsive-kart dönüşümü (temel stil yeter).
- prose için özel font ölçeği / özel `prose-lg` varyant sistemi (default ölçek yeter;
  yalnız renk/kenarlık temaya bağlanır).
- Şema/CMS/migration değişikliği (tamamen sunum katmanı; jsonb değişmez).
- Diğer experimental Lexical özellikleri.

## Mimari / dosyalar
- **Değişecek:** `src/app/globals.css` (`@plugin` + prose tema `@layer` + tablo kuralları),
  `package.json` (+`@tailwindcss/typography` devDep), `package-lock.json`.
- **Olası dokunuş:** eklenti aktifleşince bir sayfada prose görünümü istenmeyen bir yeri
  bozarsa, o sayfadaki prose sınıf setine küçük düzeltme (ör. `not-prose` ile belirli bir
  bloğu prose dışına al). Bu, preview gözleminde belirlenir — spec'te zorunlu değil.
- **Render mekaniği:** RichContent/RichText değişmez; tablolar zaten `<table>` basıyor,
  yalnız CSS ile stillenecek. Converter'a dokunmaya GEREK YOK (CSS prose tablosunu hedefler).

## Riskler
- **En büyük risk:** 11 sayfada görsel regresyon. prose global stilleri, halihazırda elle
  stillenmiş bloklarla (ör. ProductGrid/ProductFeatures kart içi metin) çakışabilir →
  istenmeyen büyük başlık/fazla boşluk. Azaltma: her sayfa preview'da denetlenir; sorunlu
  yerde `not-prose` veya prose sınıfının o bloktan kaldırılması. Bu yüzden iş tek fazda
  ama dikkatli doğrulamayla yapılır; gerekiyorsa geri alınabilir (tek commit).
- Dark mode: prose default açık tema varsayar; `.dark` değişken bağlaması yapılmazsa dark'ta
  okunmaz metin olur → dark bağlama zorunlu, testte iki tema da kontrol edilir.

## Test
- **Build:** `npx tsc --noEmit && npm run lint && npm run build` (0 error).
- **Preview (TR+EN, light+dark):** 11 sayfanın temsilcileri — bir blog, bir proje, bir ürün
  (`/yazilim/yanginpro`), bir yasal (`/yasal/kvkk-aydinlatma`), kurumsal (`/kurumsal/hakkimizda`),
  SSS, referans liste+detay → içerik tipografisi düzgün, hiçbir sayfa bozulmamış.
- **Tablo:** tablo içeren bir içerik (editörden test tablosu ya da mevcut) → başlık satırı,
  kenarlık, dolgu marka ile uyumlu; dark mode okunur; mobilde yatay kaydırma çalışır.
- **Deploy sonrası:** aynı sayfalar prod'da 200 + görsel doğrulama.

## Kapsam dışı (sonraki işlere)
- Denetim raporlarından (SOLID + güvenlik) çıkacak aksiyonlar ayrı ele alınır.
