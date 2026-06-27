import { defineType, defineField } from 'sanity';

export const localeString = defineType({
  name: 'localeString', title: 'Yerelleştirilmiş Metin', type: 'object',
  fields: [
    defineField({ name: 'tr', title: 'Türkçe', type: 'string' }),
    defineField({ name: 'en', title: 'İngilizce', type: 'string' }),
  ],
});
