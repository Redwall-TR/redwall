import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import type { PortableTextBlock } from '@portabletext/react';
import type { SanityImageSource } from '@sanity/image-url';
import Image from 'next/image';

import { isLocale, pick, LOCALES, type Locale } from '@/lib/locales';
import { sanityFetch } from '@/sanity/lib/fetch';
import { POST_QUERY, POSTS_QUERY } from '@/sanity/lib/queries';
import { Section, Cta, PortableTextRenderer } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { urlFor } from '@/sanity/lib/image';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocaleString {
  tr: string;
  en: string;
}

interface LocalePortableText {
  tr: PortableTextBlock[];
  en: PortableTextBlock[];
}

interface PostData {
  baslik: LocaleString;
  tarih?: string;
  kapak?: SanityImageSource;
  icerik?: LocalePortableText;
}

interface PostSlug {
  slug: string;
}

// ── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const posts = await sanityFetch<PostSlug[]>(POSTS_QUERY, {}, []);

  if (!posts.length) return [];

  return posts
    .filter((p) => p.slug)
    .flatMap((p) => LOCALES.map((locale) => ({ locale, slug: p.slug })));
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc: Locale = isLocale(locale) ? locale : 'tr';

  const data = await sanityFetch<PostData | null>(POST_QUERY, { slug }, null);

  if (!data) {
    return {
      title: loc === 'tr' ? 'Blog Yazısı | Redwall' : 'Blog Post | Redwall',
    };
  }

  const baslik = pick(data.baslik, loc) ?? data.baslik.tr;

  return {
    title: `${baslik} | Redwall`,
    description:
      loc === 'tr'
        ? 'Redwall blog yazısı — sektörden görüşler ve haberler.'
        : 'Redwall blog post — industry insights and news.',
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BlogDetayPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const data = await sanityFetch<PostData | null>(POST_QUERY, { slug }, null);

  if (!data) notFound();

  const isTr = locale === 'tr';
  const baslik = pick(data.baslik, locale) ?? data.baslik.tr;
  const tarihStr = data.tarih ? data.tarih.slice(0, 10) : null;
  const icerikBlocks = data.icerik
    ? (pick(data.icerik as Record<'tr' | 'en', PortableTextBlock[]>, locale) ?? undefined)
    : undefined;

  const imgSrc = data.kapak
    ? urlFor(data.kapak).width(1200).height(630).fit('crop').url()
    : null;

  return (
    <>
      {/* Back link */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {isTr ? 'Blog\'a Dön' : 'Back to Blog'}
        </Link>
      </div>

      {/* Title + date */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-8 pb-4">
        {tarihStr && (
          <time
            dateTime={tarihStr}
            className="block text-xs font-medium uppercase tracking-wider text-muted mb-4"
          >
            {tarihStr}
          </time>
        )}
        <h1 className="font-display text-4xl font-bold text-foreground sm:text-5xl leading-tight">
          {baslik}
        </h1>
      </div>

      {/* Cover image */}
      {imgSrc && (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 mb-8">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-surface">
            <Image
              src={imgSrc}
              alt={baslik ?? ''}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 896px"
              priority
            />
          </div>
        </div>
      )}

      {/* Article content */}
      <Section>
        <div className="max-w-3xl">
          <PortableTextRenderer value={icerikBlocks} />
        </div>
      </Section>

      {/* CTA */}
      <Cta
        baslik={isTr ? 'Bizimle İletişime Geçin' : 'Get in Touch'}
        aciklama={
          isTr
            ? 'Projeleriniz veya sorularınız için Redwall ekibiyle iletişime geçin.'
            : 'Contact the Redwall team for your projects or questions.'
        }
        buton={{
          etiket: isTr ? 'İletişim' : 'Contact Us',
          href: '/iletisim',
        }}
      />
    </>
  );
}
