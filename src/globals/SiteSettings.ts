import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  label: 'Site Ayarları',
  access: { read: () => true },
  fields: [
    {
      name: 'sirketAdi',
      type: 'text',
      label: 'Şirket Adı',
      required: true,
    },
    {
      name: 'iletisim',
      type: 'group',
      label: 'İletişim',
      fields: [
        { name: 'tel', type: 'text', label: 'Telefon' },
        { name: 'email', type: 'text', label: 'E-posta' },
        { name: 'adres', type: 'text', label: 'Adres', localized: true },
      ],
    },
    {
      name: 'sosyal',
      type: 'group',
      label: 'Sosyal Medya',
      admin: { description: 'Tam URL girin (https://...). Boş bırakılan platform footer\'da gösterilmez.' },
      fields: [
        { name: 'linkedin', type: 'text', label: 'LinkedIn' },
        { name: 'instagram', type: 'text', label: 'Instagram' },
        { name: 'youtube', type: 'text', label: 'YouTube' },
        { name: 'x', type: 'text', label: 'X (Twitter)' },
        { name: 'facebook', type: 'text', label: 'Facebook' },
        { name: 'whatsapp', type: 'text', label: 'WhatsApp', admin: { description: 'Örn: https://wa.me/90XXXXXXXXXX' } },
      ],
    },
    {
      name: 'calismaSaatleri',
      type: 'text',
      label: 'Çalışma Saatleri',
      localized: true,
    },
    {
      name: 'istatistikler',
      type: 'array',
      label: 'İstatistikler',
      fields: [
        { name: 'deger', type: 'text', label: 'Değer' },
        { name: 'etiket', type: 'text', label: 'Etiket', localized: true },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      label: 'SEO',
      fields: [
        { name: 'baslik', type: 'text', label: 'Başlık', localized: true },
        { name: 'aciklama', type: 'textarea', label: 'Açıklama', localized: true },
      ],
    },
    {
      name: 'kunye',
      type: 'group',
      label: 'Künye (Yasal Kimlik)',
      admin: { description: 'Şirketin resmi yasal tanımlayıcı bilgileri. Yerelleştirilmez.' },
      fields: [
        { name: 'mersisNo', type: 'text', label: 'MERSİS No' },
        { name: 'ticaretSicilNo', type: 'text', label: 'Ticaret Sicil No' },
        { name: 'kepAdresi', type: 'text', label: 'KEP Adresi' },
      ],
    },
  ],
}
