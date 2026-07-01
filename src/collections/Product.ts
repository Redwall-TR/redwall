import type { CollectionConfig } from 'payload'
import { ICON_OPTIONS } from './iconOptions'
import { fullEditor, liteEditor } from '@/payload/lexical'

export const Product: CollectionConfig = {
  slug: 'product',
  labels: { singular: 'Ürün', plural: 'Ürünler' },
  admin: { useAsTitle: 'ad' },
  access: { read: () => true },
  fields: [
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      required: true,
      unique: true,
      admin: { description: 'Örn: yanginpro veya mekanikpro' },
    },
    {
      name: 'ad',
      type: 'text',
      label: 'Ad',
      required: true,
    },
    {
      name: 'yayinda',
      type: 'checkbox',
      label: 'Sitede yayınla',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Kapalıysa ürün sitede (liste ve detay) gösterilmez.',
      },
    },
    {
      name: 'slogan',
      type: 'text',
      label: 'Slogan',
      localized: true,
    },
    {
      name: 'aciklama',
      type: 'richText',
      editor: fullEditor,
      label: 'Açıklama',
      localized: true,
    },
    {
      name: 'ozellikler',
      type: 'array',
      label: 'Özellikler',
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
          type: 'richText',
          editor: liteEditor,
          label: 'Açıklama',
          localized: true,
        },
      ],
    },
    {
      name: 'hedefKitle',
      type: 'array',
      label: 'Hedef Kitle',
      fields: [
        {
          name: 'madde',
          type: 'text',
          label: 'Madde',
          localized: true,
        },
      ],
    },
    {
      name: 'ekranGorselleri',
      type: 'array',
      label: 'Ekran Görselleri',
      fields: [
        {
          name: 'gorsel',
          type: 'upload',
          label: 'Görsel',
          relationTo: 'media',
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
