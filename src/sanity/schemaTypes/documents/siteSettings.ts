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
      description: 'Tam URL girin (https://...). Boş bırakılan platform footer\'da gösterilmez.',
      fields: [
        { name: 'linkedin', title: 'LinkedIn', type: 'url' },
        { name: 'instagram', title: 'Instagram', type: 'url' },
        { name: 'youtube', title: 'YouTube', type: 'url' },
        { name: 'x', title: 'X (Twitter)', type: 'url' },
        { name: 'facebook', title: 'Facebook', type: 'url' },
        { name: 'whatsapp', title: 'WhatsApp', type: 'url', description: 'Örn: https://wa.me/90XXXXXXXXXX' },
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
