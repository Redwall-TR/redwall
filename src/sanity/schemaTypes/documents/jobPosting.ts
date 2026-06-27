import { defineType, defineField } from 'sanity';

export const jobPosting = defineType({
  name: 'jobPosting', title: 'İş İlanı', type: 'document',
  fields: [
    defineField({
      name: 'slug', title: 'Slug', type: 'slug',
      options: { source: 'baslik.tr', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'baslik', title: 'Başlık', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'lokasyon', title: 'Lokasyon', type: 'string' }),
    defineField({ name: 'tip', title: 'Tip', type: 'string' }),
    defineField({ name: 'aciklama', title: 'Açıklama', type: 'localePortableText' }),
    defineField({ name: 'aktif', title: 'Aktif', type: 'boolean' }),
  ],
  preview: { select: { title: 'baslik.tr' } },
});
