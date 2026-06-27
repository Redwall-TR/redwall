import { defineType, defineField } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings', title: 'Site Ayarları', type: 'document',
  fields: [
    defineField({ name: 'sirketAdi', title: 'Şirket Adı', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'iletisim', title: 'İletişim', type: 'object',
      fields: [
        { name: 'tel', title: 'Telefon', type: 'string' },
        { name: 'email', title: 'E-posta', type: 'string' },
        { name: 'adres', title: 'Adres', type: 'localeString' },
      ],
    }),
    defineField({
      name: 'sosyal', title: 'Sosyal Medya', type: 'object',
      fields: [
        { name: 'linkedin', title: 'LinkedIn', type: 'string' },
        { name: 'instagram', title: 'Instagram', type: 'string' },
        { name: 'youtube', title: 'YouTube', type: 'string' },
      ],
    }),
    defineField({ name: 'calismaSaatleri', title: 'Çalışma Saatleri', type: 'localeString' }),
    defineField({
      name: 'istatistikler', title: 'İstatistikler', type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'deger', title: 'Değer', type: 'string' },
          { name: 'etiket', title: 'Etiket', type: 'localeString' },
        ],
      }],
    }),
    defineField({
      name: 'seo', title: 'SEO', type: 'object',
      fields: [
        { name: 'baslik', title: 'Başlık', type: 'localeString' },
        { name: 'aciklama', title: 'Açıklama', type: 'localeText' },
      ],
    }),
  ],
  preview: { select: { title: 'sirketAdi' } },
});
