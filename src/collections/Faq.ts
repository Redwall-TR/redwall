import type { CollectionConfig } from 'payload'

export const Faq: CollectionConfig = {
  slug: 'faq',
  labels: { singular: 'SSS', plural: 'SSS Listesi' },
  admin: { useAsTitle: 'soru' },
  access: { read: () => true },
  fields: [
    {
      name: 'kategori',
      type: 'select',
      label: 'Kategori',
      options: [
        { label: 'Genel', value: 'genel' },
        { label: 'Yazılım', value: 'yazilim' },
        { label: 'Danışmanlık', value: 'danismanlik' },
        { label: 'Mühendislik', value: 'muhendislik' },
      ],
    },
    {
      name: 'soru',
      type: 'text',
      label: 'Soru',
      required: true,
      localized: true,
    },
    {
      name: 'cevap',
      type: 'textarea',
      label: 'Cevap',
      localized: true,
    },
    {
      name: 'sira',
      type: 'number',
      label: 'Sıra',
    },
  ],
}
