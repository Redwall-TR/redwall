export const PRIMARY = [
  // "Yazılım" düz link → /yazilim sayfası (ürünler orada aktifliğe göre listelenir).
  { key: 'yazilim', href: '/yazilim' },
  { key: 'danismanlik', href: '/danismanlik' },
  { key: 'muhendislik', href: '/muhendislik' },
  { key: 'projeler', href: '/projeler' },
  {
    key: 'kurumsal',
    href: '/kurumsal/hakkimizda',
    children: [
      { key: 'hakkimizda', href: '/kurumsal/hakkimizda' },
      { key: 'vizyonMisyon', href: '/kurumsal/vizyon-misyon' },
      { key: 'kaliteBelgeler', href: '/kurumsal/kalite-belgeler' },
    ],
  },
  {
    key: 'dahaFazla',
    href: '/referanslar',
    children: [
      { key: 'referanslar', href: '/referanslar' },
      { key: 'sss', href: '/sss' },
      { key: 'blog', href: '/blog' },
      { key: 'kariyer', href: '/kariyer' },
      { key: 'dokumanlar', href: '/dokumanlar' },
    ],
  },
] as const;
