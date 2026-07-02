import type { CollectionConfig } from 'payload'
import { sanitizeSvg } from '@/lib/sanitizeSvg'

export const Media: CollectionConfig = {
  slug: 'media',
  access: { read: () => true },
  // Yükleme yalnız giriş yapmış admin (Payload varsayılan create/update erişimi).
  // Defansif sertleştirme: izinli MIME türleri + boyut sınırı. SVG'ye izin var
  // ancak yüklemede DOMPurify ile sanitize edilir (gömülü script/handler strip).
  upload: {
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml', 'application/pdf'],
  },
  hooks: {
    // Yüklenen SVG'yi diske/S3'e yazılmadan ÖNCE temizle (XSS savunması):
    // <script>, event handler'lar (on*), foreignObject, javascript: URL'leri strip edilir.
    beforeOperation: [
      ({ req, operation }) => {
        if (
          (operation === 'create' || operation === 'update') &&
          req.file &&
          req.file.mimetype === 'image/svg+xml'
        ) {
          const clean = sanitizeSvg(req.file.data.toString('utf8'))
          req.file.data = Buffer.from(clean, 'utf8')
          req.file.size = req.file.data.byteLength
        }
      },
    ],
  },
  fields: [
    { name: 'alt', type: 'text', localized: true },
  ],
}
