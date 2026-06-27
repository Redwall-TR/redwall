import { describe, it, expect } from 'vitest';
import { filterProjects } from './projects';
import type { IsKolu, ProjeDurumu } from '@/types';
const P: Array<{ slug: string; isKolu: IsKolu; durum: ProjeDurumu }> = [
  { slug: 'a', isKolu: 'yazilim', durum: 'tamamlandi' },
  { slug: 'b', isKolu: 'muhendislik', durum: 'devam-eden' },
];
describe('filterProjects', () => {
  it('iş koluna göre filtreler', () => {
    expect(filterProjects(P, { isKolu: 'yazilim' }).map((p) => p.slug)).toEqual(['a']);
  });
  it('duruma göre filtreler', () => {
    expect(filterProjects(P, { durum: 'devam-eden' }).map((p) => p.slug)).toEqual(['b']);
  });
  it('filtre yoksa hepsini döndürür', () => {
    expect(filterProjects(P, {})).toHaveLength(2);
  });
});
