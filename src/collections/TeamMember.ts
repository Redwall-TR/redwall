import type { CollectionConfig } from 'payload'

export const TeamMember: CollectionConfig = {
  slug: 'teamMember',
  labels: { singular: 'Ekip Üyesi', plural: 'Ekip Üyeleri' },
  admin: { useAsTitle: 'ad' },
  access: { read: () => true },
  fields: [
    {
      name: 'ad',
      type: 'text',
      label: 'Ad Soyad',
      required: true,
    },
    {
      name: 'unvan',
      type: 'text',
      label: 'Unvan',
      localized: true,
    },
    {
      name: 'foto',
      type: 'upload',
      label: 'Fotoğraf',
      relationTo: 'media',
    },
    {
      name: 'bio',
      type: 'textarea',
      label: 'Biyografi',
      localized: true,
    },
    {
      name: 'linkedin',
      type: 'text',
      label: 'LinkedIn URL',
    },
    {
      name: 'sira',
      type: 'number',
      label: 'Sıra',
    },
  ],
}
