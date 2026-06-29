export const PRIMARY = [
  {
    key: 'yazilim',
    href: '/yazilim',
    children: [
      { key: 'yanginpro', href: '/yazilim/yanginpro', label: 'YangınPro' },
      { key: 'mekanikpro', href: '/yazilim/mekanikpro', label: 'MekanikPro' },
    ],
  },
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
