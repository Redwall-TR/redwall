import { defineType, defineField } from 'sanity';

export const reference = defineType({
  name: 'reference', title: 'Referans', type: 'document',
  fields: [
    defineField({ name: 'ad', title: 'Ad', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'logo', title: 'Logo', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'gorus', title: 'Görüş', type: 'object',
      fields: [
        { name: 'metin', title: 'Metin', type: 'localeText' },
        { name: 'kisi', title: 'Kişi', type: 'string' },
        { name: 'unvan', title: 'Unvan', type: 'localeString' },
      ],
    }),
  ],
  preview: { select: { title: 'ad' } },
});
