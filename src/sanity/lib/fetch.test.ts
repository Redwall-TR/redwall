import { describe, it, expect, vi } from 'vitest';
vi.mock('../env', () => ({ isSanityConfigured: false, projectId: '', dataset: 'x', apiVersion: 'x' }));
vi.mock('./client', () => ({ client: { fetch: vi.fn() } }));
import { sanityFetch } from './fetch';

describe('sanityFetch', () => {
  it('Sanity yapılandırılmamışsa fallback döndürür', async () => {
    const res = await sanityFetch('*[_type=="x"]', {}, []);
    expect(res).toEqual([]);
  });
});
