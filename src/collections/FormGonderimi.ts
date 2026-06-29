import type { CollectionConfig } from 'payload'

/**
 * Form gönderimleri (iletişim / teklif / demo) — site formlarından gelen
 * kayıtlar burada saklanır ve /admin'de görüntülenir. Yazma yalnızca sunucu
 * tarafı action üzerinden (overrideAccess) yapılır; herkese açık REST create
 * kapalıdır. Okuma yalnızca giriş yapmış admin kullanıcılarına açıktır.
 */
export const FormGonderimi: CollectionConfig = {
  slug: 'formGonderimi',
  labels: { singular: 'Form Gönderimi', plural: 'Form Gönderimleri' },
  admin: {
    useAsTitle: 'ad',
    defaultColumns: ['tur', 'ad', 'email', 'createdAt'],
    group: 'Gönderimler',
  },
  access: {
    read: ({ req }) => !!req.user,
    create: () => false,
    update: () => false,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'tur',
      type: 'select',
      label: 'Tür',
      required: true,
      options: [
        { label: 'İletişim', value: 'iletisim' },
        { label: 'Teklif', value: 'teklif' },
        { label: 'Demo', value: 'demo' },
      ],
    },
    { name: 'ad', type: 'text', label: 'Ad Soyad', required: true },
    { name: 'email', type: 'text', label: 'E-posta', required: true },
    { name: 'telefon', type: 'text', label: 'Telefon' },
    { name: 'kurum', type: 'text', label: 'Kurum' },
    { name: 'isKolu', type: 'text', label: 'İlgili Hizmet (teklif)' },
    { name: 'il', type: 'text', label: 'İl (teklif)' },
    { name: 'metrekare', type: 'text', label: 'Bina m² (teklif)' },
    { name: 'urun', type: 'text', label: 'Ürün (demo)' },
    { name: 'mesaj', type: 'textarea', label: 'Mesaj' },
  ],
}
