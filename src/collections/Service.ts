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

export const Service: CollectionConfig = {
  slug: 'service',
  labels: { singular: 'Hizmet', plural: 'Hizmetler' },
  admin: { useAsTitle: 'baslik' },
  access: { read: () => true },
  fields: [
    {
      name: 'isKolu',
      type: 'select',
      label: 'İş Kolu',
      required: true,
      options: [
        { label: 'Yazılım', value: 'yazilim' },
        { label: 'Danışmanlık', value: 'danismanlik' },
        { label: 'Mühendislik', value: 'muhendislik' },
      ],
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
      label: 'Özet (hero açıklaması)',
      localized: true,
    },
    {
      name: 'chips',
      type: 'array',
      label: 'Hero Etiketleri (chips)',
      fields: [
        {
          name: 'etiket',
          type: 'text',
          label: 'Etiket',
          localized: true,
        },
      ],
    },
    {
      name: 'girisLead',
      type: 'textarea',
      label: 'Giriş — Vurgulu Cümle',
      localized: true,
    },
    {
      name: 'girisParagraflar',
      type: 'array',
      label: 'Giriş — Paragraflar',
      fields: [
        {
          name: 'paragraf',
          type: 'textarea',
          label: 'Paragraf',
          localized: true,
        },
      ],
    },
    {
      name: 'altHizmetler',
      type: 'array',
      label: 'Alt Hizmetler',
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
      name: 'surec',
      type: 'array',
      label: 'Süreç Adımları',
      admin: { description: 'Sıra, listedeki diziliş ile belirlenir (01, 02, ...).' },
      fields: [
        {
          name: 'baslik',
          type: 'text',
          label: 'Adım Başlığı',
          localized: true,
        },
        {
          name: 'aciklama',
          type: 'textarea',
          label: 'Adım Açıklaması',
          localized: true,
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
