import { defineType, defineField } from 'sanity';

export const faq = defineType({
  name: 'faq', title: 'SSS', type: 'document',
  fields: [
    defineField({
      name: 'kategori', title: 'Kategori', type: 'string',
      options: { list: [
        { title: 'Genel', value: 'genel' },
        { title: 'Yazılım', value: 'yazilim' },
        { title: 'Danışmanlık', value: 'danismanlik' },
        { title: 'Mühendislik', value: 'muhendislik' },
      ] },
    }),
    defineField({ name: 'soru', title: 'Soru', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'cevap', title: 'Cevap', type: 'localeText' }),
    defineField({ name: 'sira', title: 'Sıra', type: 'number' }),
  ],
  preview: { select: { title: 'soru.tr' } },
});
