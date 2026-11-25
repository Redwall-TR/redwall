import type { CollectionConfig } from 'payload'
import { ICON_OPTIONS } from './iconOptions'

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
      name: 'yayinda',
      type: 'checkbox',
      label: 'Sitede yayınla',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Kapalıysa ürün sitede (liste ve detay) gösterilmez.',
      },
    },
    {
      name: 'slogan',
      type: 'text',
      label: 'Slogan',
      localized: true,
    },
    {
      name: 'aciklama',
      type: 'richText',
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
          type: 'richText',
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
    {
      name: 'landing',
      type: 'group',
      label: 'Tanıtım (landing) sayfası',
      admin: {
        description:
          'Yalnızca özel tanıtım sayfası olan ürünlerde kullanılır (şu an: Redwall Cut). Boş bırakılan alan sayfada gösterilmez.',
      },
      fields: [
        { name: 'durum', type: 'text', label: 'Durum satırı', localized: true, admin: { description: 'Logonun yanındaki kısa not. Örn: Ön sürüm. Pilot aşamasına hazırlanıyor.' } },
        { name: 'baslik', type: 'text', label: 'Açılış başlığı', localized: true },
        { name: 'giris', type: 'textarea', label: 'Açılış metni', localized: true },
        { name: 'cta', type: 'text', label: 'Çağrı düğmesi yazısı', localized: true, admin: { description: 'Açılışta ve sayfa sonunda kullanılır; demo formuna gider.' } },
        {
          type: 'row',
          fields: [
            { name: 'sureHedef', type: 'number', label: 'Süre hedefi (sn)' },
            { name: 'sureEnAz', type: 'number', label: 'Ölçülen en kısa süre (sn)' },
            { name: 'sureEnCok', type: 'number', label: 'Ölçülen en uzun süre (sn)' },
          ],
        },
        {
          name: 'bolumler',
          type: 'array',
          label: 'Bölümler',
          labels: { singular: 'Bölüm', plural: 'Bölümler' },
          admin: { description: 'Sayfada bu sırayla gösterilir. Sürükleyerek sıralayın.' },
          fields: [
            {
              name: 'tur',
              type: 'select',
              label: 'Bölüm türü (görünümü belirler)',
              required: true,
              options: [
                { label: 'Adımlar (numaralı liste + ekran görüntüsü)', value: 'adimlar' },
                { label: 'Süre (hedef ve ölçüm grafiği)', value: 'sure' },
                { label: 'Teslim klasörü (satır satır liste)', value: 'teslim' },
                { label: 'Özellikler (iki sütun)', value: 'ozellikler' },
                { label: 'Paketler (Starter / Studio tablosu)', value: 'paketler' },
                { label: 'Platformlar (üç sütun)', value: 'platformlar' },
                { label: 'Gizlilik / KVKK', value: 'gizlilik' },
                { label: 'Kapanış çağrısı', value: 'kapanis' },
              ],
            },
            { name: 'baslik', type: 'text', label: 'Başlık', localized: true },
            { name: 'giris', type: 'textarea', label: 'Giriş metni', localized: true },
            { name: 'not', type: 'textarea', label: 'Alt not', localized: true, admin: { description: 'Adımlar bölümünde ekran görüntüsünün alt yazısıdır.' } },
            {
              name: 'maddeler',
              type: 'array',
              label: 'Maddeler',
              labels: { singular: 'Madde', plural: 'Maddeler' },
              fields: [
                { name: 'ad', type: 'text', label: 'Ad / başlık', localized: true },
                { name: 'etiket', type: 'text', label: 'Küçük etiket', localized: true, admin: { description: 'Adımlarda ekran adı (Giriş, Onay…), teslim klasöründe dosya adı. Diğer türlerde boş bırakın.' } },
                { name: 'metin', type: 'textarea', label: 'Metin', localized: true },
              ],
            },
          ],
        },
        {
          name: 'paketSatirlari',
          type: 'array',
          label: 'Paket tablosu satırları',
          labels: { singular: 'Satır', plural: 'Satırlar' },
          admin: { description: 'Starter ve Studio sütunlarına "var", "yok" ya da kısa bir metin yazın (örn: İlk beş tema).' },
          fields: [
            { name: 'ozellik', type: 'text', label: 'Özellik', localized: true },
            { name: 'starter', type: 'text', label: 'Starter', localized: true },
            { name: 'studio', type: 'text', label: 'Studio', localized: true },
          ],
        },
      ],
    },
  ],
}
