import { defineType, defineField } from 'sanity';

export const post = defineType({
  name: 'post', title: 'Blog Yazısı', type: 'document',
  fields: [
    defineField({
      name: 'slug', title: 'Slug', type: 'slug',
      options: { source: 'baslik.tr', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'baslik', title: 'Başlık', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'tarih', title: 'Tarih', type: 'datetime' }),
    defineField({ name: 'kapak', title: 'Kapak Görseli', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'ozet', title: 'Özet', type: 'localeText' }),
    defineField({ name: 'icerik', title: 'İçerik', type: 'localePortableText' }),
    defineField({
      name: 'etiketler', title: 'Etiketler', type: 'array',
      of: [{ type: 'string' }],
    }),
  ],
  preview: { select: { title: 'baslik.tr' } },
});
