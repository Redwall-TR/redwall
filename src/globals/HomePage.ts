import type { GlobalConfig } from 'payload'

export const HomePage: GlobalConfig = {
  slug: 'homePage',
  label: 'Ana Sayfa',
  access: { read: () => true },
  fields: [
    {
      name: 'heroBaslik',
      type: 'text',
      label: 'Hero Başlık',
      required: true,
      localized: true,
    },
    {
      name: 'heroAltMetin',
      type: 'textarea',
      label: 'Hero Alt Metin',
      localized: true,
    },
    {
      name: 'heroBirincilCta',
      type: 'group',
      label: 'Hero Birincil CTA',
      fields: [
        { name: 'etiket', type: 'text', label: 'Etiket', localized: true },
        { name: 'href', type: 'text', label: 'URL' },
      ],
    },
    {
      name: 'heroIkincilCta',
      type: 'group',
      label: 'Hero İkincil CTA',
      fields: [
        { name: 'etiket', type: 'text', label: 'Etiket', localized: true },
        { name: 'href', type: 'text', label: 'URL' },
      ],
    },
    {
      name: 'oneCikanUrun',
      type: 'relationship',
      label: 'Öne Çıkan Ürün',
      relationTo: 'product',
    },
    {
      name: 'yaklasim',
      type: 'richText',
      label: 'Yaklaşım',
      localized: true,
    },
  ],
}
