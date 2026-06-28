import type { CollectionConfig } from 'payload'

export const Post: CollectionConfig = {
  slug: 'post',
  labels: { singular: 'Blog Yazısı', plural: 'Blog Yazıları' },
  admin: { useAsTitle: 'baslik' },
  access: { read: () => true },
  fields: [
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      required: true,
      unique: true,
    },
    {
      name: 'baslik',
      type: 'text',
      label: 'Başlık',
      required: true,
      localized: true,
    },
    {
      name: 'tarih',
      type: 'date',
      label: 'Tarih',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'kapak',
      type: 'upload',
      label: 'Kapak Görseli',
      relationTo: 'media',
    },
    {
      name: 'ozet',
      type: 'textarea',
      label: 'Özet',
      localized: true,
    },
    {
      name: 'icerik',
      type: 'richText',
      label: 'İçerik',
      localized: true,
    },
    {
      name: 'etiketler',
      type: 'array',
      label: 'Etiketler',
      fields: [
        {
          name: 'etiket',
          type: 'text',
          label: 'Etiket',
        },
      ],
    },
  ],
}
