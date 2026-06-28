import type { CollectionConfig } from 'payload'

export const Referans: CollectionConfig = {
  slug: 'referans',
  labels: { singular: 'Referans', plural: 'Referanslar' },
  admin: { useAsTitle: 'ad' },
  access: { read: () => true },
  fields: [
    { name: 'ad', type: 'text', required: true },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    {
      name: 'anasayfada',
      type: 'checkbox',
      label: 'Ana sayfada göster',
      defaultValue: false,
    },
    {
      name: 'gorus',
      type: 'group',
      label: 'Görüş',
      fields: [
        { name: 'metin', type: 'textarea', localized: true },
        { name: 'kisi', type: 'text' },
        { name: 'unvan', type: 'text', localized: true },
      ],
    },
  ],
}
