import { defineType, defineField } from 'sanity';
import { ICON_OPTIONS } from '../iconOptions';

export const product = defineType({
  name: 'product', title: 'Ürün', type: 'document',
  fields: [
    defineField({
      name: 'slug', title: 'Slug', type: 'slug',
      options: { source: 'ad', maxLength: 96 },
      description: 'Örn: yanginpro veya mekanikpro',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'ad', title: 'Ad', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slogan', title: 'Slogan', type: 'localeString' }),
    defineField({ name: 'aciklama', title: 'Açıklama', type: 'localeText' }),
    defineField({
      name: 'ozellikler', title: 'Özellikler', type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'icon', title: 'İkon', type: 'string', options: { list: ICON_OPTIONS } },
          { name: 'baslik', title: 'Başlık', type: 'localeString' },
          { name: 'aciklama', title: 'Açıklama', type: 'localeText' },
        ],
        preview: { select: { title: 'baslik.tr' } },
      }],
    }),
    defineField({
      name: 'hedefKitle', title: 'Hedef Kitle', type: 'array',
      of: [{ type: 'localeString' }],
    }),
    defineField({
      name: 'ekranGorselleri', title: 'Ekran Görselleri', type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({ name: 'sira', title: 'Sıra', type: 'number' }),
  ],
  preview: { select: { title: 'ad' } },
});
