import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { isLocale, pick, type Locale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { getRichPage } from '@/lib/cms/queries';
import { Section } from '@/components/ui';
import { RichContent } from '@/components/ui/RichContent';
import { PageHero } from '@/components/sections/PageHero';
import { ServiceIcon } from '@/components/ui/icons';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocaleString {
  tr: string;
  en: string;
}

interface RichPageData {
  slug: unknown;
  baslik: LocaleString;
  icerik?: Record<string, unknown>;
  kategori?: string;
  sonGuncelleme?: string;
}

// ── Rendering ─────────────────────────────────────────────────────────────────
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

  const data = (await getRichPage(slug)) as RichPageData | null;

  if (!data) {
    const fallbackBaslik =
      loc === 'tr' ? 'Yasal Sayfa | Redwall' : 'Legal Page | Redwall';
    const fallbackAciklama =
      loc === 'tr' ? 'Redwall yasal sayfası.' : 'Redwall legal page.';
    return buildMetadata({
      baslik: fallbackBaslik,
      aciklama: fallbackAciklama,
      locale: loc,
      path: `/yasal/${slug}`,
    });
  }

  const baslik = (pick(data.baslik, loc) ?? data.baslik.tr) + ' | Redwall';
  const aciklama =
    loc === 'tr'
      ? 'Redwall yasal belgesi ve politika sayfası.'
      : 'Redwall legal document and policy page.';

  return buildMetadata({ baslik, aciklama, locale: loc, path: `/yasal/${slug}` });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function YasalDetayPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const data = (await getRichPage(slug)) as RichPageData | null;

  if (!data) notFound();

  const isTr = locale === 'tr';
  const baslik = pick(data.baslik, locale) ?? data.baslik.tr;
  const sonGuncellemeTarih = data.sonGuncelleme
    ? data.sonGuncelleme.slice(0, 10)
    : null;

  // data.icerik is a locale-keyed object: { tr: LexicalState, en: LexicalState }
  const icerikLexical = data.icerik
    ? (pick(
        data.icerik as Record<'tr' | 'en', Record<string, unknown>>,
        locale,
      ) ?? undefined)
    : undefined;

  const isLegal = data.kategori === 'legal';

  return (
    <>
      <PageHero
        eyebrow={isTr ? 'Yasal' : 'Legal'}
        title={baslik ?? ''}
        accent="#e63950"
        chips={sonGuncellemeTarih ? [sonGuncellemeTarih] : undefined}
        glyph={<ServiceIcon name="document" className="h-[26rem] w-[26rem]" />}
      />

      <Section>
        <div className="space-y-6">
          {/* Draft / legal advisory warning banner */}
          {isLegal && (
            <div
              role="note"
              className="rounded-lg border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-200"
            >
              {isTr
                ? '⚠️ Bu metin taslaktır; yürürlüğe koymadan önce KVKK danışmanınıza kontrol ettirin.'
                : '⚠️ This is a draft; have it reviewed by a data-protection advisor before relying on it.'}
            </div>
          )}

          {/* Lexical rich-text content */}
          {icerikLexical && (
            <RichContent value={icerikLexical} className="prose prose-neutral dark:prose-invert max-w-none" />
          )}
        </div>
      </Section>
    </>
  );
}
