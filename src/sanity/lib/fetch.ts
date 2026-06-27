import { client } from './client';
import { isSanityConfigured } from '../env';

export async function sanityFetch<T>(
  query: string, params: Record<string, unknown> = {}, fallback: T,
): Promise<T> {
  if (!isSanityConfigured) return fallback;
  try {
    const data = await client.fetch<T>(query, params, { next: { revalidate: 60 } });
    return (data ?? fallback) as T;
  } catch {
    return fallback;
  }
}
