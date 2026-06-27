import { defineType, defineField } from 'sanity';
import { ICON_OPTIONS } from '../iconOptions';

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
    defineField({ name: 'ozet', title: 'Özet (hero açıklaması)', type: 'localeText' }),
    defineField({ name: 'chips', title: 'Hero Etiketleri (chips)', type: 'array',
      of: [{ type: 'localeString' }],
      description: 'Hero bandında görünen kısa kapsam etiketleri (örn. İtfaiye Onayı, Mevzuat).' }),
    defineField({ name: 'girisLead', title: 'Giriş — Vurgulu Cümle', type: 'localeText' }),
    defineField({ name: 'girisParagraflar', title: 'Giriş — Paragraflar', type: 'array',
      of: [{ type: 'localeText' }] }),
    defineField({ name: 'altHizmetler', title: 'Alt Hizmetler', type: 'array',
      of: [{ type: 'object', fields: [
        { name: 'icon', title: 'İkon', type: 'string', options: { list: ICON_OPTIONS } },
        { name: 'baslik', type: 'localeString', title: 'Başlık' },
        { name: 'aciklama', type: 'localeText', title: 'Açıklama' }],
        preview: { select: { title: 'baslik.tr' } } }] }),
    defineField({ name: 'surec', title: 'Süreç Adımları', type: 'array',
      of: [{ type: 'object', fields: [
        { name: 'baslik', type: 'localeString', title: 'Adım Başlığı' },
        { name: 'aciklama', type: 'localeText', title: 'Adım Açıklaması' }],
        preview: { select: { title: 'baslik.tr' } } }],
      description: 'Sıra, listedeki diziliş ile belirlenir (01, 02, ...).' }),
    defineField({ name: 'sira', title: 'Sıra', type: 'number' }),
  ],
  preview: { select: { title: 'baslik.tr' } },
});
