import type { CollectionConfig } from 'payload'
import { ICON_OPTIONS } from './iconOptions'

export const Solution: CollectionConfig = {
  slug: 'solution',
  labels: { singular: 'Çözüm', plural: 'Çözümler' },
  admin: { useAsTitle: 'slug' },
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
      name: 'ikon',
      type: 'select',
      label: 'İkon',
      options: ICON_OPTIONS,
    },
    {
      name: 'hedefKitle',
      type: 'textarea',
      label: 'Hedef Kitle',
      localized: true,
    },
    {
      name: 'sira',
      type: 'number',
      label: 'Sıra',
    },
  ],
}
