import type { CollectionConfig } from 'payload'

const ICON_OPTIONS = [
  { label: 'Kalkan / Onay (shield-check)', value: 'shield-check' },
  { label: 'Pano / Liste (clipboard)', value: 'clipboard' },
  { label: 'Cetvel / Çizim (ruler)', value: 'ruler' },
  { label: 'Baret (hard-hat)', value: 'hard-hat' },
  { label: 'Bina (building)', value: 'building' },
  { label: 'Anahtar (key)', value: 'key' },
  { label: 'Damla / Söndürme (droplet)', value: 'droplet' },
  { label: 'Duvar / Bariyer (wall)', value: 'wall' },
  { label: 'Anahtar/Tesisat (wrench)', value: 'wrench' },
  { label: 'Yenile / Bakım (refresh)', value: 'refresh' },
  { label: 'Kod / Yazılım (code)', value: 'code' },
  { label: 'Alev (flame)', value: 'flame' },
  { label: 'Gösterge / Panel (gauge)', value: 'gauge' },
  { label: 'Belge (document)', value: 'document' },
]

export const Product: CollectionConfig = {
  slug: 'product',
  labels: { singular: 'Ürün', plural: 'Ürünler' },
  admin: { useAsTitle: 'ad' },
  access: { read: () => true },
  fields: [
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      required: true,
      unique: true,
      admin: { description: 'Örn: yanginpro veya mekanikpro' },
    },
    {
      name: 'ad',
      type: 'text',
      label: 'Ad',
      required: true,
    },
    {
      name: 'slogan',
      type: 'text',
      label: 'Slogan',
      localized: true,
    },
    {
      name: 'aciklama',
      type: 'textarea',
      label: 'Açıklama',
      localized: true,
    },
    {
      name: 'ozellikler',
      type: 'array',
      label: 'Özellikler',
      fields: [
        {
          name: 'icon',
          type: 'select',
          label: 'İkon',
          options: ICON_OPTIONS,
        },
        {
          name: 'baslik',
          type: 'text',
          label: 'Başlık',
          localized: true,
        },
        {
          name: 'aciklama',
          type: 'textarea',
          label: 'Açıklama',
          localized: true,
        },
      ],
    },
    {
      name: 'hedefKitle',
      type: 'array',
      label: 'Hedef Kitle',
      fields: [
        {
          name: 'madde',
          type: 'text',
          label: 'Madde',
          localized: true,
        },
      ],
    },
    {
      name: 'ekranGorselleri',
      type: 'array',
      label: 'Ekran Görselleri',
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
      name: 'sira',
      type: 'number',
      label: 'Sıra',
    },
  ],
}
