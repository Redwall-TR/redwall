import { defineType, defineField } from 'sanity';

// NOT: Sanity'de 'reference' ayrılmış bir tip adı olduğundan tip adı 'referans'.
export const reference = defineType({
  name: 'referans', title: 'Referans', type: 'document',
  fields: [
    defineField({ name: 'ad', title: 'Ad', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'logo', title: 'Logo', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'anasayfada', title: 'Ana sayfada göster', type: 'boolean',
      description: 'İşaretlenirse ana sayfadaki "Bize Güvenen Kurumlar" bölümünde gösterilir.',
      initialValue: false }),
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
