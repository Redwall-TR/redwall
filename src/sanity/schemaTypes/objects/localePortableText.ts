import { defineType, defineField } from 'sanity';

const blocks = { type: 'array' as const, of: [{ type: 'block' }, { type: 'image' }] };

export const localePortableText = defineType({
  name: 'localePortableText', title: 'Yerelleştirilmiş Zengin Metin', type: 'object',
  fields: [
    defineField({ name: 'tr', title: 'Türkçe', ...blocks }),
    defineField({ name: 'en', title: 'İngilizce', ...blocks }),
  ],
});
