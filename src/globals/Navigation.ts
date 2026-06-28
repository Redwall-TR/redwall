import type { GlobalConfig } from 'payload'

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Navigasyon',
  access: { read: () => true },
  fields: [
    {
      name: 'headerLinks',
      type: 'array',
      label: 'Header Linkleri',
      fields: [
        {
          name: 'etiket',
          type: 'text',
          label: 'Etiket',
          localized: true,
        },
        {
          name: 'href',
          type: 'text',
          label: 'URL',
        },
        {
          name: 'alt',
          type: 'array',
          label: 'Alt Menü',
          fields: [
            {
              name: 'etiket',
              type: 'text',
              label: 'Etiket',
              localized: true,
            },
            {
              name: 'href',
              type: 'text',
              label: 'URL',
            },
          ],
        },
      ],
    },
    {
      name: 'footerKolonlari',
      type: 'array',
      label: 'Footer Kolonları',
      fields: [
        {
          name: 'baslik',
          type: 'text',
          label: 'Başlık',
          localized: true,
        },
        {
          name: 'linkler',
          type: 'array',
          label: 'Linkler',
          fields: [
            {
              name: 'etiket',
              type: 'text',
              label: 'Etiket',
              localized: true,
            },
            {
              name: 'href',
              type: 'text',
              label: 'URL',
            },
          ],
        },
      ],
    },
  ],
}
