import type { IsKolu, ProjeDurumu } from '@/types';

export interface ProjectCard {
  slug: string;
  baslik: { tr: string; en: string };
  musteri?: string;
  isKolu: IsKolu;
  durum: ProjeDurumu;
  yil?: number;
  il?: string;
  [k: string]: unknown;
}

export function filterProjects<T extends { isKolu: IsKolu; durum: ProjeDurumu }>(
  projects: T[],
  f: { isKolu?: IsKolu; durum?: ProjeDurumu },
): T[] {
  return projects.filter(
    (p) => (!f.isKolu || p.isKolu === f.isKolu) && (!f.durum || p.durum === f.durum),
  );
}
