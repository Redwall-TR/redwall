import { defineType, defineField } from 'sanity';

export const page = defineType({
  name: 'page', title: 'Sayfa', type: 'document',
  fields: [
    defineField({
      name: 'slug', title: 'Slug', type: 'slug',
      options: { source: 'baslik.tr', maxLength: 96 },
      description: 'Örn: hakkimizda, vizyon-misyon, kalite-belgeler',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'baslik', title: 'Başlık', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'icerik', title: 'İçerik', type: 'localePortableText' }),
  ],
  preview: { select: { title: 'baslik.tr' } },
});
