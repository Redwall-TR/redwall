import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import Image from 'next/image';

import { isLocale, pick } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { getProject } from '@/lib/cms/queries';
import { mediaUrl } from '@/lib/cms/image';
import { Section, Badge, Cta } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { isKoluLabel } from '@/lib/labels';
import { PageHero } from '@/components/sections/PageHero';
import { ServiceIcon } from '@/components/ui/icons';
import { RichContent } from '@/components/ui/RichContent';
import type { IsKolu, ProjeDurumu } from '@/types';
import { ACCENT } from '@/lib/theme';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocaleString {
  tr: string;
  en: string;
}

interface ProjectData {
  baslik: LocaleString;
  musteri?: string;
  isKolu: IsKolu;
  durum: ProjeDurumu;
  yil?: number;
  il?: string;
  kapsam?: LocaleString;
  ozet?: LocaleString;
  aciklama?: unknown;
  gorseller?: unknown[];
  referans?: { ad: string; slug: string } | null;
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
  const loc = isLocale(locale) ? locale : 'tr';

  const data = (await getProject(slug)) as ProjectData | null;

  if (!data) {
    return buildMetadata({
      baslik: 'Proje | Redwall',
      aciklama: loc === 'tr' ? 'Redwall projesi.' : 'Redwall project.',
      locale: loc,
      path: `/projeler/${slug}`,
    });
  }

  const title = pick(data.baslik, loc) ?? data.baslik.tr;
  const description =
    (data.ozet ? (pick(data.ozet, loc) ?? undefined) : undefined) ??
    (loc === 'tr' ? 'Redwall projesi.' : 'Redwall project.');

  return buildMetadata({ baslik: `${title} | Redwall`, aciklama: description, locale: loc, path: `/projeler/${slug}` });
}

// ── Durum badge ───────────────────────────────────────────────────────────────

function DurumBadge({ durum, locale }: { durum: ProjeDurumu; locale: string }) {
  if (durum === 'devam-eden') {
    return (
      <Badge tone="amber">
        {locale === 'tr' ? 'Devam Eden' : 'Ongoing'}
      </Badge>
    );
  }
  return (
    <Badge tone="green">
      {locale === 'tr' ? 'Tamamlandı' : 'Completed'}
    </Badge>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ProjeDetayPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const data = (await getProject(slug)) as ProjectData | null;

  if (!data) notFound();

  const isTr = locale === 'tr';
  const baslik = pick(data.baslik, locale) ?? data.baslik.tr;
  const ozet = data.ozet ? (pick(data.ozet, locale) ?? undefined) : undefined;
  const kapsam = data.kapsam ? (pick(data.kapsam, locale) ?? undefined) : undefined;
  // data.aciklama is a locale-keyed object: { tr: LexicalState, en: LexicalState }
  const aciklamaLexical = data.aciklama
    ? (pick(data.aciklama as Record<'tr' | 'en', Record<string, unknown>>, locale) ?? undefined)
    : undefined;

  const gorseller = (data.gorseller ?? []).filter(Boolean);

  const durumChip = data.durum === 'devam-eden'
    ? (isTr ? 'Devam Eden' : 'Ongoing')
    : (isTr ? 'Tamamlandı' : 'Completed');

  const heroChips = [
    data.musteri,
    durumChip,
    data.yil ? String(data.yil) : undefined,
    data.il,
  ].filter((v): v is string => Boolean(v));

  return (
    <>
      <PageHero
        eyebrow={isKoluLabel(data.isKolu, locale)}
        title={baslik}
        description={ozet}
        accent={ACCENT}
        chips={heroChips}
        glyph={<ServiceIcon name="building" className="h-[26rem] w-[26rem]" />}
      />

      {/* Künye (spec sheet) */}
      <Section tone="muted">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Müşteri */}
          {(data.referans || data.musteri) && (
            <div className="rounded-xl border border-border bg-background px-5 py-4">
              <dt className="text-xs uppercase tracking-wider text-muted mb-1">
                {isTr ? 'Müşteri' : 'Client'}
              </dt>
              <dd className="text-sm font-medium text-foreground">
                {data.referans ? (
                  <Link
                    href={`/referanslar/${data.referans.slug}` as Parameters<typeof Link>[0]['href']}
                    className="text-primary hover:underline"
                  >
                    {data.referans.ad || data.musteri}
                  </Link>
                ) : (
                  data.musteri
                )}
              </dd>
            </div>
          )}

          {/* İş Kolu */}
          <div className="rounded-xl border border-border bg-background px-5 py-4">
            <dt className="text-xs uppercase tracking-wider text-muted mb-1">
              {isTr ? 'İş Kolu' : 'Business Line'}
            </dt>
            <dd className="text-sm font-medium text-foreground">
              {isKoluLabel(data.isKolu, locale)}
            </dd>
          </div>

          {/* Durum */}
          <div className="rounded-xl border border-border bg-background px-5 py-4">
            <dt className="text-xs uppercase tracking-wider text-muted mb-1">
              {isTr ? 'Durum' : 'Status'}
            </dt>
            <dd className="mt-1">
              <DurumBadge durum={data.durum} locale={locale} />
            </dd>
          </div>

          {/* Yıl */}
          {data.yil && (
            <div className="rounded-xl border border-border bg-background px-5 py-4">
              <dt className="text-xs uppercase tracking-wider text-muted mb-1">
                {isTr ? 'Yıl' : 'Year'}
              </dt>
              <dd className="text-sm font-medium text-foreground">{data.yil}</dd>
            </div>
          )}

          {/* İl */}
          {data.il && (
            <div className="rounded-xl border border-border bg-background px-5 py-4">
              <dt className="text-xs uppercase tracking-wider text-muted mb-1">
                {isTr ? 'İl' : 'Province'}
              </dt>
              <dd className="text-sm font-medium text-foreground">{data.il}</dd>
            </div>
          )}

          {/* Kapsam */}
          {kapsam && (
            <div className="rounded-xl border border-border bg-background px-5 py-4 sm:col-span-2 lg:col-span-1">
              <dt className="text-xs uppercase tracking-wider text-muted mb-1">
                {isTr ? 'Kapsam' : 'Scope'}
              </dt>
              <dd className="text-sm font-medium text-foreground">{kapsam}</dd>
            </div>
          )}
        </div>
      </Section>

      {/* Açıklama */}
      {aciklamaLexical && (
        <Section>
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl mb-8">
            {isTr ? 'Proje Hakkında' : 'About the Project'}
          </h2>
          <RichContent value={aciklamaLexical} className="prose prose-neutral dark:prose-invert max-w-none" />
        </Section>
      )}

      {/* Görsel Galeri */}
      {gorseller.length > 0 && (
        <Section tone="muted">
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl mb-8">
            {isTr ? 'Görseller' : 'Gallery'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gorseller.map((gorsel, i) => {
              const src = mediaUrl(gorsel);
              if (!src) return null;
              return (
                <div
                  key={i}
                  className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-surface"
                >
                  <Image
                    src={src}
                    alt={`${baslik} — ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Back link */}
      <Section>
        <Link
          href="/projeler"
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
          {isTr ? 'Tüm Projelere Dön' : 'Back to All Projects'}
        </Link>
      </Section>

      {/* CTA */}
      <Cta
        baslik={isTr ? 'Projenizi Birlikte Hayata Geçirelim' : "Let’s Bring Your Project to Life"}
        aciklama={
          isTr
            ? 'Redwall olarak benzer projelerde edindiğimiz deneyimi sizin projenize taşımaya hazırız.'
            : "At Redwall, we're ready to bring the experience we've gained from similar projects to yours."
        }
        buton={{
          etiket: isTr ? 'Teklif Al' : 'Get a Quote',
          href: '/teklif',
        }}
      />
    </>
  );
}
