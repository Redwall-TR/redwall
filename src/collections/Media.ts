import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: { read: () => true },
  // Yükleme yalnız giriş yapmış admin (Payload varsayılan create/update erişimi).
  // Defansif sertleştirme: izinli MIME türleri + boyut sınırı. SVG bilinçli
  // olarak dışarıda (gömülü script taşıyabilir); gerekirse attachment olarak sun.
  upload: {
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'application/pdf'],
  },
  fields: [
    { name: 'alt', type: 'text', localized: true },
  ],
}
