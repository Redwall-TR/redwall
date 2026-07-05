import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';

import { isLocale, pick, type Locale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { getPosts } from '@/lib/cms/queries';
import { mediaUrl } from '@/lib/cms/image';
import { Section } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { PageHero } from '@/components/sections/PageHero';
import { ServiceIcon } from '@/components/ui/icons';
import { ACCENT } from '@/lib/theme';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocaleString {
  tr: string;
  en: string;
}

interface PostCard {
  slug: string;
  baslik: LocaleString;
  tarih?: string;
  kapak?: unknown;
  ozet?: LocaleString;
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : 'tr';

  const baslik = loc === 'tr' ? 'Blog & Haberler | Redwall' : 'Blog & News | Redwall';
  const aciklama =
    loc === 'tr'
      ? 'Redwall\'ın sektör görüşleri, proje haberleri ve teknik makaleleri.'
      : 'Industry insights, project news, and technical articles from Redwall.';

  return buildMetadata({ baslik, aciklama, locale: loc, path: '/blog' });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const posts = (await getPosts()) as unknown as PostCard[];

  const isTr = locale === 'tr';

  const heading = isTr ? 'Blog & Haberler' : 'Blog & News';
  const description = isTr
    ? 'Sektörden görüşler, proje haberleri ve teknik makaleler.'
    : 'Industry insights, project news, and technical articles.';

  return (
    <>
      <PageHero
        eyebrow="Blog"
        title={heading}
        description={description}
        accent={ACCENT}
        glyph={<ServiceIcon name="document" className="h-[26rem] w-[26rem]" />}
      />

      {posts.length === 0 ? (
        <Section>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg
              className="h-16 w-16 text-muted mb-6 opacity-40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10l6 6v8a2 2 0 0 1-2 2z" />
              <polyline points="17 2 17 8 11 8" />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="9" y1="16" x2="13" y2="16" />
            </svg>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
              {isTr ? 'Henüz içerik yok' : 'No content yet'}
            </h2>
            <p className="text-muted max-w-md">
              {isTr
                ? 'Yakında içerik eklenecek.'
                : 'Content coming soon.'}
            </p>
          </div>
        </Section>
      ) : (
        <Section>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const baslik = pick(post.baslik, locale) ?? post.baslik.tr;
              const ozet = post.ozet ? (pick(post.ozet, locale) ?? undefined) : undefined;
              const tarihStr = post.tarih ? post.tarih.slice(0, 10) : null;

              const imgSrc = post.kapak ? mediaUrl(post.kapak) ?? null : null;

              return (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}` as Parameters<typeof Link>[0]['href']}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface hover:border-primary transition-colors"
                >
                  {/* Cover image or placeholder */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-surface-muted">
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={baslik ?? ''}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <svg
                          className="h-10 w-10 text-primary/40"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          aria-hidden="true"
                        >
                          <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10l6 6v8a2 2 0 0 1-2 2z" />
                          <polyline points="17 2 17 8 11 8" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="flex flex-1 flex-col p-5">
                    {tarihStr && (
                      <time
                        dateTime={tarihStr}
                        className="text-xs font-medium uppercase tracking-wider text-muted mb-2"
                      >
                        {tarihStr}
                      </time>
                    )}
                    <h2 className="font-display text-lg font-bold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors">
                      {baslik}
                    </h2>
                    {ozet && (
                      <p className="text-sm text-muted leading-relaxed line-clamp-3 flex-1">
                        {ozet}
                      </p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      {isTr ? 'Devamını oku' : 'Read more'}
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Section>
      )}
    </>
  );
}
