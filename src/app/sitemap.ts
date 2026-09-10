import type { MetadataRoute } from 'next';
import { getProjects, getPosts, getReferences, getProducts } from '@/lib/cms/queries';
import { LOCALES } from '@/lib/locales';
import { CITY_SLUGS } from '@/lib/city-content';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://redwall.tr';

// İstek anında üret: CMS içerik URL'leri (proje/blog/referans detayları) DB'den
// gelir. Statik (build-time) üretimde CI build'inde DB erişilemez → safe() boş döner
// ve sitemap yalnız statik rotaları içerir. force-dynamic ile DB istek anında okunur
// (detay rotalarının DYNAMIC_SERVER_USAGE için kullandığı aynı desen).
export const dynamic = 'force-dynamic';

const STATIC_PATHS: string[] = [
  '',
  '/yazilim',
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
  const [projects, posts, references, products] = await Promise.all([
    getProjects(),
    getPosts(),
    getReferences(),
    getProducts(),
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

  // Ürün detayları CMS'ten (yalnız yayinda==true) — hard-code slug yayından
  // kaldırılan ürünü (ör. mekanikpro) sitemap'te 404 olarak bırakıyordu.
  const productEntries: MetadataRoute.Sitemap = products.flatMap((product) =>
    LOCALES.map((locale) => ({
      url: `${SITE_URL}/${locale}/yazilim/${product.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
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

  // Şehir-özel hizmet landing sayfaları — yalnızca TR (tr locale'de üretilir).
  const cityEntries: MetadataRoute.Sitemap = CITY_SLUGS.flatMap((il) =>
    ['yangin-danismanligi', 'yangin-sistemleri'].map((svc) => ({
      url: `${SITE_URL}/tr/${svc}/${il}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  );

  return [
    ...staticEntries,
    ...productEntries,
    ...projectEntries,
    ...postEntries,
    ...referenceEntries,
    ...cityEntries,
  ];
}
