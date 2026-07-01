import type { CollectionConfig } from 'payload'
import { slugify } from '@/lib/slug'
import { liteEditor } from '@/payload/lexical'

export const Referans: CollectionConfig = {
  slug: 'referans',
  labels: { singular: 'Referans', plural: 'Referanslar' },
  admin: { useAsTitle: 'ad' },
  access: { read: () => true },
  fields: [
    { name: 'ad', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'URL eki. Boş bırakılırsa addan otomatik üretilir.',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            const v = (value as string | undefined)?.trim()
            if (v) return slugify(v)
            const ad = (data?.ad as string | undefined) ?? ''
            return slugify(ad)
          },
        ],
      },
    },
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
        { name: 'metin', type: 'richText', editor: liteEditor, localized: true },
        { name: 'kisi', type: 'text' },
        { name: 'unvan', type: 'text', localized: true },
      ],
    },
  ],
}
