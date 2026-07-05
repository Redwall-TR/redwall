import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { isLocale, pick, type Locale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { getDocuments } from '@/lib/cms/queries';
import { mediaUrl } from '@/lib/cms/image';
import { Section } from '@/components/ui';
import { PageHero } from '@/components/sections/PageHero';
import { ServiceIcon } from '@/components/ui/icons';
import { ACCENT } from '@/lib/theme';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocaleString {
  tr: string;
  en: string;
}

interface DocumentItem {
  baslik: LocaleString;
  aciklama?: LocaleString;
  dosya?: unknown;
  kategori?: LocaleString;
}

// ── Rendering ─────────────────────────────────────────────────────────────────
// CMS-backed sayfa: Payload Local API i18n için headers() okur → statik üretim
// DYNAMIC_SERVER_USAGE verir. Liste tamamen dinamik (on-demand) render edilir.
export const dynamic = 'force-dynamic';

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : 'tr';

  const baslik = loc === 'tr' ? 'Dokümanlar — Redwall' : 'Documents — Redwall';
  const aciklama =
    loc === 'tr'
      ? 'Redwall katalog, sertifika ve teknik dokümanlarını indirin.'
      : 'Download Redwall catalogs, certificates and technical documents.';

  return buildMetadata({ baslik, aciklama, locale: loc, path: '/dokumanlar' });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DokumanlarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const documents = (await getDocuments()) as unknown as DocumentItem[];

  const isTr = locale === 'tr';
  const heading = isTr ? 'Dokümanlar' : 'Documents';
  const description = isTr
    ? 'Katalog, sertifika ve teknik dokümanlarımızı indirin.'
    : 'Download our catalogs, certificates and technical documents.';

  // Lokale göre seçilmiş kategori başlığına göre grupla (sıra korunur).
  const fallbackCategory = isTr ? 'Diğer' : 'Other';
  const groups: { kategori: string; items: DocumentItem[] }[] = [];

  for (const doc of documents) {
    const kategori = doc.kategori
      ? (pick(doc.kategori, locale) ?? doc.kategori.tr ?? fallbackCategory)
      : fallbackCategory;
    let group = groups.find((g) => g.kategori === kategori);
    if (!group) {
      group = { kategori, items: [] };
      groups.push(group);
    }
    group.items.push(doc);
  }

  return (
    <>
      <PageHero
        eyebrow={heading}
        title={heading}
        description={description}
        accent={ACCENT}
        glyph={<ServiceIcon name="document" className="h-[26rem] w-[26rem]" />}
      />

      {documents.length === 0 ? (
        <Section>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ServiceIcon
              name="document"
              className="h-16 w-16 text-muted mb-6 opacity-40"
            />
            <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
              {isTr ? 'Henüz doküman yok' : 'No documents yet'}
            </h2>
            <p className="text-muted max-w-md">
              {isTr ? 'Yakında dokümanlar eklenecek.' : 'Documents coming soon.'}
            </p>
          </div>
        </Section>
      ) : (
        <Section>
          <div className="flex flex-col gap-14">
            {groups.map((group) => (
              <div key={group.kategori}>
                <h2 className="font-display text-xl font-bold text-foreground mb-6 pb-3 border-b border-border">
                  {group.kategori}
                </h2>
                <ul className="flex flex-col gap-4">
                  {group.items.map((doc, i) => {
                    const baslik = pick(doc.baslik, locale) ?? doc.baslik.tr;
                    const aciklama = doc.aciklama
                      ? (pick(doc.aciklama, locale) ?? undefined)
                      : undefined;
                    const href = mediaUrl(doc.dosya);

                    return (
                      <li
                        key={`${group.kategori}-${i}-${baslik}`}
                        className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-5"
                      >
                        <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-primary">
                          <ServiceIcon name="document" className="h-6 w-6" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display text-base font-bold text-foreground leading-snug">
                            {baslik}
                          </h3>
                          {aciklama && (
                            <p className="mt-1 text-sm text-muted leading-relaxed">
                              {aciklama}
                            </p>
                          )}
                        </div>
                        {href ? (
                          <a
                            href={href}
                            download
                            className="mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                          >
                            {isTr ? 'İndir' : 'Download'}
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
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </a>
                        ) : (
                          <span className="mt-0.5 inline-flex shrink-0 items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted opacity-60">
                            {isTr ? 'Yakında' : 'Coming soon'}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
