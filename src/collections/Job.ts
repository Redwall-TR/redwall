import type { CollectionConfig } from 'payload'

export const Job: CollectionConfig = {
  slug: 'job',
  labels: { singular: 'İş İlanı', plural: 'İş İlanları' },
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
      name: 'lokasyon',
      type: 'text',
      label: 'Lokasyon',
    },
    {
      name: 'tip',
      type: 'text',
      label: 'Tip',
    },
    {
      name: 'aciklama',
      type: 'richText',
      label: 'Açıklama',
      localized: true,
    },
    {
      name: 'aktif',
      type: 'checkbox',
      label: 'Aktif',
      defaultValue: true,
    },
  ],
}
