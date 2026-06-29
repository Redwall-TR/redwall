import type { CollectionConfig } from 'payload'

export const Document: CollectionConfig = {
  slug: 'document',
  labels: { singular: 'Belge', plural: 'Belgeler' },
  admin: { useAsTitle: 'baslik' },
  access: { read: () => true },
  fields: [
    {
      name: 'baslik',
      type: 'text',
      label: 'Başlık',
      required: true,
      localized: true,
    },
    {
      name: 'aciklama',
      type: 'textarea',
      label: 'Açıklama',
      localized: true,
    },
    {
      name: 'dosya',
      type: 'upload',
      label: 'Dosya',
      relationTo: 'media',
    },
    {
      name: 'kategori',
      type: 'text',
      label: 'Kategori',
      localized: true,
    },
    {
      name: 'sira',
      type: 'number',
      label: 'Sıra',
    },
  ],
}
