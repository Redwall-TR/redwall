import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import Image from 'next/image';

import { isLocale, pick, type Locale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { getPost } from '@/lib/cms/queries';
import { mediaUrl } from '@/lib/cms/image';
import { Section, Cta } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { RichContent } from '@/components/ui/RichContent';
import { PageHero } from '@/components/sections/PageHero';
import { ServiceIcon } from '@/components/ui/icons';
import { ACCENT } from '@/lib/theme';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocaleString {
  tr: string;
  en: string;
}

interface PostData {
  baslik: LocaleString;
  tarih?: string;
  kapak?: unknown;
  icerik?: Record<string, unknown>;
}

// ── Rendering ───────────────────────────────────────────────────────────────
// CMS-backed sayfa: Payload Local API i18n için headers() okur → statik üretim
// DYNAMIC_SERVER_USAGE verir. Detay tamamen dinamik (on-demand) render edilir.
export const dynamic = 'force-dynamic';

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc: Locale = isLocale(locale) ? locale : 'tr';

  const data = (await getPost(slug)) as PostData | null;

  if (!data) {
    const fallbackBaslik = loc === 'tr' ? 'Blog Yazısı | Redwall' : 'Blog Post | Redwall';
    const fallbackAciklama =
      loc === 'tr' ? 'Redwall blog yazısı.' : 'Redwall blog post.';
    return buildMetadata({ baslik: fallbackBaslik, aciklama: fallbackAciklama, locale: loc, path: `/blog/${slug}` });
  }

  const baslik = (pick(data.baslik, loc) ?? data.baslik.tr) + ' | Redwall';
  const aciklama =
    loc === 'tr'
      ? 'Redwall blog yazısı — sektörden görüşler ve haberler.'
      : 'Redwall blog post — industry insights and news.';

  return buildMetadata({ baslik, aciklama, locale: loc, path: `/blog/${slug}` });
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

  const data = (await getPost(slug)) as PostData | null;

  if (!data) notFound();

  const isTr = locale === 'tr';
  const baslik = pick(data.baslik, locale) ?? data.baslik.tr;
  const tarihStr = data.tarih ? data.tarih.slice(0, 10) : null;
  // data.icerik is a locale-keyed object: { tr: LexicalState, en: LexicalState }
  const icerikLexical = data.icerik
    ? (pick(data.icerik as Record<'tr' | 'en', Record<string, unknown>>, locale) ?? undefined)
    : undefined;

  const imgSrc = data.kapak ? mediaUrl(data.kapak) ?? null : null;

  return (
    <>
      <PageHero
        eyebrow="Blog"
        title={baslik ?? ''}
        accent={ACCENT}
        chips={tarihStr ? [tarihStr] : undefined}
        glyph={<ServiceIcon name="document" className="h-[26rem] w-[26rem]" />}
      />

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
      {icerikLexical && (
        <Section>
          <RichContent value={icerikLexical} className="prose prose-neutral dark:prose-invert max-w-none" />
        </Section>
      )}

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
