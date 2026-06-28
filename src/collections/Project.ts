import type { CollectionConfig } from 'payload'

export const Project: CollectionConfig = {
  slug: 'project',
  labels: { singular: 'Proje', plural: 'Projeler' },
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
      name: 'musteri',
      type: 'text',
      label: 'Müşteri',
    },
    {
      name: 'isKolu',
      type: 'select',
      label: 'İş Kolu',
      options: [
        { label: 'Yazılım', value: 'yazilim' },
        { label: 'Danışmanlık', value: 'danismanlik' },
        { label: 'Mühendislik', value: 'muhendislik' },
      ],
    },
    {
      name: 'durum',
      type: 'select',
      label: 'Durum',
      options: [
        { label: 'Devam Eden', value: 'devam-eden' },
        { label: 'Tamamlandı', value: 'tamamlandi' },
      ],
    },
    {
      name: 'yil',
      type: 'number',
      label: 'Yıl',
    },
    {
      name: 'il',
      type: 'text',
      label: 'İl',
    },
    {
      name: 'kapsam',
      type: 'text',
      label: 'Kapsam',
      localized: true,
    },
    {
      name: 'ozet',
      type: 'textarea',
      label: 'Özet',
      localized: true,
    },
    {
      name: 'aciklama',
      type: 'richText',
      label: 'Açıklama',
      localized: true,
    },
    {
      name: 'gorseller',
      type: 'array',
      label: 'Görseller',
      fields: [
        {
          name: 'gorsel',
          type: 'upload',
          label: 'Görsel',
          relationTo: 'media',
        },
      ],
    },
    {
      name: 'oneCikan',
      type: 'checkbox',
      label: 'Öne Çıkan',
      defaultValue: false,
    },
  ],
}
