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
      // NOT: localized DEĞİL — richText alanının kendisi zaten localized
      // (blok her locale'in Lexical state'inde ayrı durur). Alt-alanı bir daha
      // localized yapmak editörde ters/yanlış-yere yazma hatasına yol açıyordu.
      name: 'baslik',
      type: 'text',
      label: 'Başlık / açıklama (opsiyonel)',
    },
  ],
}
