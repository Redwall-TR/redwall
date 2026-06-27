import { defineType, defineField } from 'sanity';

export const homePage = defineType({
  name: 'homePage', title: 'Ana Sayfa', type: 'document',
  fields: [
    defineField({ name: 'heroBaslik', title: 'Hero Başlık', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'heroAltMetin', title: 'Hero Alt Metin', type: 'localeText' }),
    defineField({
      name: 'heroBirincilCta', title: 'Hero Birincil CTA', type: 'object',
      fields: [
        { name: 'etiket', title: 'Etiket', type: 'localeString' },
        { name: 'href', title: 'URL', type: 'string' },
      ],
    }),
    defineField({
      name: 'heroIkincilCta', title: 'Hero İkincil CTA', type: 'object',
      fields: [
        { name: 'etiket', title: 'Etiket', type: 'localeString' },
        { name: 'href', title: 'URL', type: 'string' },
      ],
    }),
    defineField({
      name: 'oneCikanUrun', title: 'Öne Çıkan Ürün', type: 'reference',
      to: [{ type: 'product' }],
    }),
    defineField({ name: 'yaklasim', title: 'Yaklaşım', type: 'localePortableText' }),
  ],
  preview: { select: { title: 'heroBaslik.tr' } },
});
