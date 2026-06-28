import type { CollectionConfig } from 'payload'
import { ICON_OPTIONS } from './iconOptions'

export const Page: CollectionConfig = {
  slug: 'page',
  labels: { singular: 'Kurumsal Sayfa', plural: 'Kurumsal Sayfalar' },
  admin: { useAsTitle: 'baslik' },
  access: { read: () => true },
  fields: [
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      required: true,
      unique: true,
      admin: { description: 'hakkimizda, vizyon-misyon veya kalite-belgeler' },
    },
    {
      name: 'baslik',
      type: 'text',
      label: 'Başlık',
      required: true,
      localized: true,
    },
    {
      name: 'altBaslik',
      type: 'textarea',
      label: 'Alt Başlık (hero açıklaması)',
      localized: true,
    },
    {
      name: 'chips',
      type: 'array',
      label: 'Hero Etiketleri',
      fields: [
        {
          name: 'etiket',
          type: 'text',
          label: 'Etiket',
          localized: true,
        },
      ],
    },
    // Giriş
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
    // Vizyon & Misyon
    {
      name: 'vizyonBaslik',
      type: 'text',
      label: 'Vizyon Başlığı',
      localized: true,
    },
    {
      name: 'vizyonMetin',
      type: 'textarea',
      label: 'Vizyon Metni',
      localized: true,
    },
    {
      name: 'misyonBaslik',
      type: 'text',
      label: 'Misyon Başlığı',
      localized: true,
    },
    {
      name: 'misyonMetin',
      type: 'textarea',
      label: 'Misyon Metni',
      localized: true,
    },
    // Kart gridi
    {
      name: 'kartlarEyebrow',
      type: 'text',
      label: 'Kart Bölümü — Üst Etiket',
      localized: true,
    },
    {
      name: 'kartlarBaslik',
      type: 'text',
      label: 'Kart Bölümü — Başlık',
      localized: true,
    },
    {
      name: 'kartlarAciklama',
      type: 'textarea',
      label: 'Kart Bölümü — Açıklama',
      localized: true,
    },
    {
      name: 'kartlar',
      type: 'array',
      label: 'Kartlar',
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
  ],
}
