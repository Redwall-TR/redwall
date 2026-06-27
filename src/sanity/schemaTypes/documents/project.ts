import { defineType, defineField } from 'sanity';

export const project = defineType({
  name: 'project', title: 'Proje', type: 'document',
  fields: [
    defineField({
      name: 'slug', title: 'Slug', type: 'slug',
      options: { source: 'baslik.tr', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'baslik', title: 'Başlık', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'musteri', title: 'Müşteri', type: 'string' }),
    defineField({
      name: 'isKolu', title: 'İş Kolu', type: 'string',
      options: { list: [
        { title: 'Yazılım', value: 'yazilim' },
        { title: 'Danışmanlık', value: 'danismanlik' },
        { title: 'Mühendislik', value: 'muhendislik' },
      ] },
    }),
    defineField({
      name: 'durum', title: 'Durum', type: 'string',
      options: { list: [
        { title: 'Devam Eden', value: 'devam-eden' },
        { title: 'Tamamlandı', value: 'tamamlandi' },
      ] },
    }),
    defineField({ name: 'yil', title: 'Yıl', type: 'number' }),
    defineField({ name: 'il', title: 'İl', type: 'string' }),
    defineField({ name: 'kapsam', title: 'Kapsam', type: 'localeString' }),
    defineField({ name: 'ozet', title: 'Özet', type: 'localeText' }),
    defineField({ name: 'aciklama', title: 'Açıklama', type: 'localePortableText' }),
    defineField({
      name: 'gorseller', title: 'Görseller', type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({ name: 'oneCikan', title: 'Öne Çıkan', type: 'boolean' }),
  ],
  preview: { select: { title: 'baslik.tr' } },
});
