import type { CollectionConfig } from 'payload'
import { ICON_OPTIONS } from './iconOptions'

export const Service: CollectionConfig = {
  slug: 'service',
  labels: { singular: 'Hizmet', plural: 'Hizmetler' },
  admin: { useAsTitle: 'baslik' },
  access: { read: () => true },
  fields: [
    {
      name: 'isKolu',
      type: 'select',
      label: 'İş Kolu',
      required: true,
      unique: true,
      options: [
        { label: 'Yazılım', value: 'yazilim' },
        { label: 'Danışmanlık', value: 'danismanlik' },
        { label: 'Mühendislik', value: 'muhendislik' },
      ],
    },
    {
      name: 'baslik',
      type: 'text',
      label: 'Başlık',
      required: true,
      localized: true,
    },
    {
      name: 'ozet',
      type: 'textarea',
      label: 'Özet (hero açıklaması)',
      localized: true,
    },
    {
      name: 'chips',
      type: 'array',
      label: 'Hero Etiketleri (chips)',
      fields: [
        {
          name: 'etiket',
          type: 'text',
          label: 'Etiket',
          localized: true,
        },
      ],
    },
    {
      name: 'girisLead',
      type: 'textarea',
      label: 'Giriş — Vurgulu Cümle',
      localized: true,
    },
    {
      name: 'girisParagraflar',
      type: 'array',
      label: 'Giriş — Paragraflar',
      fields: [
        {
          name: 'paragraf',
          type: 'textarea',
          label: 'Paragraf',
          localized: true,
        },
      ],
    },
    {
      name: 'altHizmetler',
      type: 'array',
      label: 'Alt Hizmetler',
      fields: [
        {
          name: 'icon',
          type: 'select',
          label: 'İkon',
          options: ICON_OPTIONS,
        },
        {
          name: 'baslik',
          type: 'text',
          label: 'Başlık',
          localized: true,
        },
        {
          name: 'aciklama',
          type: 'textarea',
          label: 'Açıklama',
          localized: true,
        },
      ],
    },
    {
      name: 'surec',
      type: 'array',
      label: 'Süreç Adımları',
      admin: { description: 'Sıra, listedeki diziliş ile belirlenir (01, 02, ...).' },
      fields: [
        {
          name: 'baslik',
          type: 'text',
          label: 'Adım Başlığı',
          localized: true,
        },
        {
          name: 'aciklama',
          type: 'textarea',
          label: 'Adım Açıklaması',
          localized: true,
        },
      ],
    },
    {
      name: 'sira',
      type: 'number',
      label: 'Sıra',
    },
  ],
}
