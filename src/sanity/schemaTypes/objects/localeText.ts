import { defineType, defineField } from 'sanity';

export const localeText = defineType({
  name: 'localeText', title: 'Yerelleştirilmiş Uzun Metin', type: 'object',
  fields: [
    defineField({ name: 'tr', title: 'Türkçe', type: 'text', rows: 4 }),
    defineField({ name: 'en', title: 'İngilizce', type: 'text', rows: 4 }),
  ],
});
