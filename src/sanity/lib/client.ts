import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId } from '../env';

// Server-only read token for the private dataset. Next.js does NOT inline
// non-NEXT_PUBLIC env vars into client bundles, so `token` is undefined in the
// browser (image-URL building still works token-less). Reads happen only in
// server components via sanityFetch.
const token = process.env.SANITY_API_READ_TOKEN;

export const client = createClient({
  projectId: projectId || 'placeholder',
  dataset,
  apiVersion,
  useCdn: !token,
  token,
  perspective: 'published',
});
