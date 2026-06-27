import { defineType, defineField } from 'sanity';
import { ICON_OPTIONS } from '../iconOptions';

// Kurumsal sayfalar (hakkimizda / vizyon-misyon / kalite-belgeler).
// Yapısal alanlar: her sayfa yalnızca ilgili bölümleri doldurur, bileşen dolu
// olan bölümleri sırasıyla render eder (giriş → vizyon/misyon → kart gridi).

export const page = defineType({
  name: 'page', title: 'Kurumsal Sayfa', type: 'document',
  groups: [
    { name: 'hero', title: 'Hero' },
    { name: 'giris', title: 'Giriş' },
    { name: 'vizyonMisyon', title: 'Vizyon & Misyon' },
    { name: 'kartlar', title: 'Kart Gridi' },
  ],
  fields: [
    defineField({
      name: 'slug', title: 'Slug', type: 'slug',
      options: { source: 'baslik.tr', maxLength: 96 },
      description: 'hakkimizda, vizyon-misyon veya kalite-belgeler',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'baslik', title: 'Başlık', type: 'localeString', group: 'hero', validation: (r) => r.required() }),
    defineField({ name: 'altBaslik', title: 'Alt Başlık (hero açıklaması)', type: 'localeText', group: 'hero' }),
    defineField({ name: 'chips', title: 'Hero Etiketleri', type: 'array', of: [{ type: 'localeString' }], group: 'hero' }),

    // Giriş (hakkımızda hikâyesi / kalite yaklaşımı)
    defineField({ name: 'girisLead', title: 'Giriş — Vurgulu Cümle', type: 'localeText', group: 'giris' }),
    defineField({ name: 'girisParagraflar', title: 'Giriş — Paragraflar', type: 'array', of: [{ type: 'localeText' }], group: 'giris' }),

    // Vizyon & Misyon
    defineField({ name: 'vizyonBaslik', title: 'Vizyon Başlığı', type: 'localeString', group: 'vizyonMisyon' }),
    defineField({ name: 'vizyonMetin', title: 'Vizyon Metni', type: 'localeText', group: 'vizyonMisyon' }),
    defineField({ name: 'misyonBaslik', title: 'Misyon Başlığı', type: 'localeString', group: 'vizyonMisyon' }),
    defineField({ name: 'misyonMetin', title: 'Misyon Metni', type: 'localeText', group: 'vizyonMisyon' }),

    // Kart gridi (değerler / neden redwall / belgeler)
    defineField({ name: 'kartlarEyebrow', title: 'Kart Bölümü — Üst Etiket', type: 'localeString', group: 'kartlar' }),
    defineField({ name: 'kartlarBaslik', title: 'Kart Bölümü — Başlık', type: 'localeString', group: 'kartlar' }),
    defineField({ name: 'kartlarAciklama', title: 'Kart Bölümü — Açıklama', type: 'localeText', group: 'kartlar' }),
    defineField({ name: 'kartlar', title: 'Kartlar', type: 'array', group: 'kartlar',
      of: [{ type: 'object', fields: [
        { name: 'icon', title: 'İkon', type: 'string', options: { list: ICON_OPTIONS } },
        { name: 'baslik', title: 'Başlık', type: 'localeString' },
        { name: 'aciklama', title: 'Açıklama', type: 'localeText' }],
        preview: { select: { title: 'baslik.tr' } } }] }),
  ],
  preview: { select: { title: 'baslik.tr' } },
});
