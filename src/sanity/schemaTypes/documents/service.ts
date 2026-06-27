import { defineType, defineField } from 'sanity';

export const service = defineType({
  name: 'service', title: 'Hizmet (İş Kolu)', type: 'document',
  fields: [
    defineField({ name: 'isKolu', title: 'İş Kolu', type: 'string',
      options: { list: [
        { title: 'Yazılım', value: 'yazilim' },
        { title: 'Danışmanlık', value: 'danismanlik' },
        { title: 'Mühendislik', value: 'muhendislik' }] },
      validation: (r) => r.required() }),
    defineField({ name: 'baslik', title: 'Başlık', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'ozet', title: 'Özet', type: 'localeText' }),
    defineField({ name: 'icerik', title: 'İçerik', type: 'localePortableText' }),
    defineField({ name: 'altHizmetler', title: 'Alt Hizmetler', type: 'array',
      of: [{ type: 'object', fields: [
        { name: 'baslik', type: 'localeString', title: 'Başlık' },
        { name: 'aciklama', type: 'localeText', title: 'Açıklama' }] }] }),
    defineField({ name: 'imzaRengi', title: 'İmza Rengi', type: 'string',
      options: { list: ['primary', 'amber', 'navy'] } }),
    defineField({ name: 'sira', title: 'Sıra', type: 'number' }),
  ],
  preview: { select: { title: 'baslik.tr' } },
});
