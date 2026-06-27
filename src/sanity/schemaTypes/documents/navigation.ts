import { defineType, defineField } from 'sanity';

export const navigation = defineType({
  name: 'navigation', title: 'Navigasyon', type: 'document',
  fields: [
    defineField({
      name: 'headerLinks', title: 'Header Linkleri', type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'etiket', title: 'Etiket', type: 'localeString' },
          { name: 'href', title: 'URL', type: 'string' },
          {
            name: 'alt', title: 'Alt Menü', type: 'array',
            of: [{
              type: 'object',
              fields: [
                { name: 'etiket', title: 'Etiket', type: 'localeString' },
                { name: 'href', title: 'URL', type: 'string' },
              ],
            }],
          },
        ],
      }],
    }),
    defineField({
      name: 'footerKolonlari', title: 'Footer Kolonları', type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'baslik', title: 'Başlık', type: 'localeString' },
          {
            name: 'linkler', title: 'Linkler', type: 'array',
            of: [{
              type: 'object',
              fields: [
                { name: 'etiket', title: 'Etiket', type: 'localeString' },
                { name: 'href', title: 'URL', type: 'string' },
              ],
            }],
          },
        ],
      }],
    }),
  ],
  preview: { select: { title: 'name' } },
});
