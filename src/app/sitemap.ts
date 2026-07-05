import type { MetadataRoute } from 'next';
import { getProjects, getPosts, getReferences } from '@/lib/cms/queries';
import { LOCALES } from '@/lib/locales';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://redwall.tr';

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
  const [projects, posts, references] = await Promise.all([
    getProjects(),
    getPosts(),
    getReferences(),
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

  const referenceEntries: MetadataRoute.Sitemap = references
    .filter((ref) => ref.slug)
    .flatMap((ref) =>
      LOCALES.map((locale) => ({
        url: `${SITE_URL}/${locale}/referanslar/${ref.slug}`,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })),
    );

  return [...staticEntries, ...projectEntries, ...postEntries, ...referenceEntries];
}
