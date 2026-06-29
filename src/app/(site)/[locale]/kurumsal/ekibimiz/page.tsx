import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';

import { isLocale, pick, type Locale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { getTeam } from '@/lib/cms/queries';
import { mediaUrl } from '@/lib/cms/image';
import { Section } from '@/components/ui';
import { PageHero } from '@/components/sections/PageHero';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocaleString {
  tr: string;
  en: string;
}

interface TeamMember {
  ad: string;
  unvan?: LocaleString;
  foto?: unknown;
  bio?: LocaleString;
  linkedin?: string;
}

// ── Rendering ─────────────────────────────────────────────────────────────────
// CMS-backed sayfa: Payload Local API i18n için headers() okur → statik üretim
// DYNAMIC_SERVER_USAGE verir. Liste tamamen dinamik (on-demand) render edilir.
export const dynamic = 'force-dynamic';

// ── Helpers ─────────────────────────────────────────────────────────────────────

function initials(ad: string): string {
  return ad
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
}

function UsersGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : 'tr';

  const baslik = loc === 'tr' ? 'Ekibimiz — Redwall' : 'Our Team — Redwall';
  const aciklama =
    loc === 'tr'
      ? 'Redwall ekibini ve uzmanlık alanlarını tanıyın.'
      : 'Meet the Redwall team and their areas of expertise.';

  return buildMetadata({ baslik, aciklama, locale: loc, path: '/kurumsal/ekibimiz' });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function EkibimizPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const team = (await getTeam()) as unknown as TeamMember[];

  const isTr = locale === 'tr';
  const heading = isTr ? 'Ekibimiz' : 'Our Team';
  const description = isTr
    ? 'Redwall\'ı oluşturan uzman ekibi ve görev alanlarını yakından tanıyın.'
    : 'Get to know the expert team behind Redwall and their roles.';

  return (
    <>
      <PageHero
        eyebrow={heading}
        title={heading}
        description={description}
        accent="#e63950"
        glyph={<UsersGlyph className="h-[26rem] w-[26rem]" />}
      />

      {team.length === 0 ? (
        <Section>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <UsersGlyph className="h-16 w-16 text-muted mb-6 opacity-40" />
            <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
              {isTr ? 'Henüz ekip üyesi yok' : 'No team members yet'}
            </h2>
            <p className="text-muted max-w-md">
              {isTr ? 'Yakında ekip bilgileri eklenecek.' : 'Team information coming soon.'}
            </p>
          </div>
        </Section>
      ) : (
        <Section>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member, i) => {
              const unvan = member.unvan
                ? (pick(member.unvan, locale) ?? undefined)
                : undefined;
              const bio = member.bio ? (pick(member.bio, locale) ?? undefined) : undefined;
              const imgSrc = member.foto ? (mediaUrl(member.foto) ?? null) : null;

              return (
                <div
                  key={`${member.ad}-${i}`}
                  className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface"
                >
                  {/* Photo or initials placeholder */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={member.ad}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <span className="font-display text-4xl font-bold text-primary/50">
                          {initials(member.ad)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="font-display text-lg font-bold text-foreground leading-snug">
                      {member.ad}
                    </h2>
                    {unvan && (
                      <p className="mt-1 text-sm font-medium text-primary">{unvan}</p>
                    )}
                    {bio && (
                      <p className="mt-3 text-sm text-muted leading-relaxed line-clamp-4 flex-1">
                        {bio}
                      </p>
                    )}
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                        aria-label={`${member.ad} — LinkedIn`}
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
                        </svg>
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </>
  );
}
