export const PRIMARY = [
  // "Yazılım" alt menüsü çalışma zamanında yayındaki ürünlerden üretilir
  // (Header/MobileNav, layout'tan gelen softwareItems ile). Burada sabit
  // ürün listesi tutulmaz; yayından kaldırılan ürün menüde de görünmez.
  { key: 'yazilim', href: '/yazilim' },
  { key: 'danismanlik', href: '/danismanlik' },
  { key: 'muhendislik', href: '/muhendislik' },
  { key: 'projeler', href: '/projeler' },
  { key: 'cozumler', href: '/cozumler' },
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
