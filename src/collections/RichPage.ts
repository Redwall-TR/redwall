import type { CollectionConfig } from 'payload'

export const RichPage: CollectionConfig = {
  slug: 'richPage',
  labels: { singular: 'İçerik Sayfası', plural: 'İçerik Sayfaları' },
  admin: { useAsTitle: 'slug' },
  access: { read: () => true },
  fields: [
    { name: 'slug', type: 'text', required: true, unique: true },
    {
      name: 'kategori',
      type: 'select',
      options: ['legal', 'kurumsal', 'redwall'],
      defaultValue: 'kurumsal',
    },
    { name: 'baslik', type: 'text', localized: true, required: true },
    { name: 'icerik', type: 'richText', localized: true },
    { name: 'sonGuncelleme', type: 'date' },
  ],
}
