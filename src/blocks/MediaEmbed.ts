import type { Block } from 'payload'

export const MediaEmbed: Block = {
  slug: 'mediaEmbed',
  interfaceName: 'MediaEmbedBlock',
  labels: { singular: 'Medya Gömme', plural: 'Medya Gömmeler' },
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
      label: 'Bağlantı (YouTube / Vimeo / SoundCloud / Spotify)',
    },
    {
      name: 'baslik',
      type: 'text',
      localized: true,
      label: 'Başlık / açıklama (opsiyonel)',
    },
  ],
}
