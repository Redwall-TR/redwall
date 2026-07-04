import type { Block } from 'payload'

/**
 * Zengin editöre dış platform (YouTube/Vimeo/SoundCloud/Spotify) video/ses gömme bloğu.
 * Yalnız `url` alanı var: altyazı/başlık alanı bilinçli olarak YOK — Payload lexical
 * blok alt-alanları editörle çatışıyor (input olayları ana editöre sızıyor). Altyazı
 * istenirse gömmenin altına/üstüne normal metin olarak yazılır (prose ile stillenir).
 */
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
  ],
}
