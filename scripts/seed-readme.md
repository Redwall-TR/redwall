# Redwall Sanity Seed — Import Rehberi

Bu dosya, `sanity/seed/redwall-seed.ndjson` içindeki taslak içeriğin Sanity veri setine nasıl yükleneceğini açıklar.

---

## Gereksinimler

- Node.js 18+
- `npm` veya `pnpm` (proje paket yöneticisi)
- Redwall Sanity projesine yetkili erişim

---

## 1. Sanity CLI Kurulumu

Sanity CLI henüz kurulu değilse global olarak kurun:

```bash
npm install -g sanity
```

veya `npx` ile direkt kullanın (kurulum gerekmez):

```bash
npx sanity --version
```

---

## 2. Sanity Hesabına Giriş

```bash
npx sanity login
```

Tarayıcıda Sanity hesabınızla (Google veya e-posta) oturum açın.

---

## 3. Veri Setine İçeriği Yükle

Proje kökünden çalıştırın:

```bash
npx sanity dataset import sanity/seed/redwall-seed.ndjson production --replace
```

`--replace` bayrağı, aynı `_id`'ye sahip mevcut dökümanları günceller; yoksa yeni oluşturur.

> **Farklı bir veri seti için** (örn. geliştirme ortamı):
> ```bash
> npx sanity dataset import sanity/seed/redwall-seed.ndjson staging --replace
> ```

---

## 4. İçeriği Studio'da Doğrula

Sanity Studio'yu başlatın:

```bash
npm run dev
# veya
npx sanity dev
```

`http://localhost:3333` adresinde Studio'yu açın ve içeriklerin yüklendiğini doğrulayın.

---

## Görsel Alanlar Hakkında Not

Seed dosyası **görsel (image) alanları içermez**. Aşağıdaki görsel alanları Studio üzerinden manuel olarak doldurmanız gerekir:

| Doküman Tipi  | Alan               | Açıklama                             |
|---------------|--------------------|--------------------------------------|
| `siteSettings`| —                  | Logo yok (varsa ekleyin)             |
| `reference`   | `logo`             | Her referans şirket için logo        |
| `product`     | `ekranGorselleri`  | YangınPro ve MekanikPro ekran görüntüleri |
| `project`     | `gorseller`        | Her proje için saha/render fotoğrafları |
| `post`        | `kapak`            | Her blog yazısı için kapak görseli   |

---

## Seed İçerik Özeti

| Tip           | Adet | Notlar                                                  |
|---------------|------|---------------------------------------------------------|
| `siteSettings`| 1    | Singleton — `_id: "siteSettings"`                      |
| `navigation`  | 1    | Singleton — `_id: "navigation"`                        |
| `homePage`    | 1    | Singleton — `_id: "homePage"`                          |
| `service`     | 3    | yazilim, danismanlik, muhendislik                      |
| `product`     | 2    | yanginpro, mekanikpro                                   |
| `project`     | 4    | 2 tamamlandi, 1 devam-eden, 1 tamamlandi; 3 oneCikan   |
| `reference`   | 3    | 2 tanesi görüş (gorus) içeriyor                        |
| `faq`         | 6    | genel×2, yazilim×2, danismanlik×1, muhendislik×1       |
| `post`        | 2    | Blog yazıları                                           |
| `page`        | 3    | hakkimizda, vizyon-misyon, kalite-belgeler             |
| `jobPosting`  | 2    | yangin-muhendisi, yazilim-gelistirici-mid-senior       |
| **Toplam**    | **28**|                                                        |

---

## Sorun Giderme

- **"Not authorized"** hatası: `npx sanity login` ile yeniden giriş yapın ve proje erişiminizin olduğundan emin olun.
- **"Dataset not found"** hatası: `npx sanity dataset list` ile mevcut veri setlerini listeleyin.
- **Doküman çakışmaları**: `--replace` bayrağı bu durumu çözer. Yoksa `--missing` ile yalnızca eksik dökümanları ekleyin.
