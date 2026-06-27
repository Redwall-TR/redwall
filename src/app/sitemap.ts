import type { MetadataRoute } from 'next';
import { sanityFetch } from '@/sanity/lib/fetch';
import { PROJECTS_QUERY, POSTS_QUERY } from '@/sanity/lib/queries';
import { LOCALES } from '@/lib/locales';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://redwall.com.tr';

const STATIC_PATHS: string[] = [
  '',
  '/yazilim',
  '/yazilim/yanginpro',
  '/yazilim/mekanikpro',
  '/danismanlik',
  '/muhendislik',
  '/projeler',
  '/referanslar',
  '/kurumsal/hakkimizda',
  '/kurumsal/vizyon-misyon',
  '/kurumsal/kalite-belgeler',
  '/sss',
  '/blog',
  '/kariyer',
  '/teklif',
  '/iletisim',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts] = await Promise.all([
    sanityFetch<{ slug: string }[]>(PROJECTS_QUERY, {}, []),
    sanityFetch<{ slug: string }[]>(POSTS_QUERY, {}, []),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      changeFrequency: (path === '' ? 'weekly' : 'monthly') as
        | 'weekly'
        | 'monthly',
      priority: path === '' ? 1.0 : 0.7,
    })),
  );

  const projectEntries: MetadataRoute.Sitemap = projects.flatMap((project) =>
    LOCALES.map((locale) => ({
      url: `${SITE_URL}/${locale}/projeler/${project.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  );

  const postEntries: MetadataRoute.Sitemap = posts.flatMap((post) =>
    LOCALES.map((locale) => ({
      url: `${SITE_URL}/${locale}/blog/${post.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  );

  return [...staticEntries, ...projectEntries, ...postEntries];
}
