import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { isLocale, pick, type Locale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { getReference, getProjectsByReference } from '@/lib/cms/queries';
import { mediaUrl } from '@/lib/cms/image';
import { Section, Cta } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { PageHero } from '@/components/sections/PageHero';
import { ServiceIcon } from '@/components/ui/icons';
import { ProjectCardLink } from '@/components/sections/ProjectCardLink';
import type { ProjectCard } from '@/lib/projects';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

interface ReferenceData {
  id: string;
  ad: string;
  slug?: string;
  logo?: unknown;
  gorus?: {
    metin?: { tr: string; en: string };
    kisi?: string;
    unvan?: { tr: string; en: string };
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc: Locale = isLocale(locale) ? locale : 'tr';
  const data = (await getReference(slug)) as ReferenceData | null;
  if (!data) {
    return buildMetadata({
      baslik: loc === 'tr' ? 'Referans | Redwall' : 'Reference | Redwall',
      aciklama: loc === 'tr' ? 'Redwall referansı.' : 'Redwall reference.',
      locale: loc,
      path: `/referanslar/${slug}`,
    });
  }
  const baslik = `${data.ad} | ${loc === 'tr' ? 'Referanslar' : 'References'} | Redwall`;
  const aciklama =
    loc === 'tr'
      ? `${data.ad} ile Redwall olarak gerçekleştirdiğimiz projeler.`
      : `Projects we delivered with ${data.ad} at Redwall.`;
  return buildMetadata({ baslik, aciklama, locale: loc, path: `/referanslar/${slug}` });
}

export default async function ReferansDetayPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const data = (await getReference(slug)) as ReferenceData | null;
  if (!data) notFound();

  const isTr = locale === 'tr';
  const logoSrc = data.logo ? mediaUrl(data.logo) ?? null : null;
  const projects = (await getProjectsByReference(data.id)) as unknown as ProjectCard[];

  const gorusMetin = data.gorus?.metin ? pick(data.gorus.metin, locale) ?? '' : '';
  const gorusUnvan = data.gorus?.unvan ? pick(data.gorus.unvan, locale) ?? '' : '';

  return (
    <>
      <PageHero
        eyebrow={isTr ? 'Referans' : 'Reference'}
        title={data.ad}
        accent="#e63950"
        glyph={
          logoSrc ? (
            <div className="relative h-[20rem] w-[20rem]">
              <Image src={logoSrc} alt={data.ad} fill className="object-contain opacity-90" sizes="320px" />
            </div>
          ) : (
            <ServiceIcon name="building" className="h-[26rem] w-[26rem]" />
          )
        }
      />

      {/* Back link */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8">
        <Link
          href="/referanslar"
          className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {isTr ? 'Referanslara Dön' : 'Back to References'}
        </Link>
      </div>

      {/* Görüş */}
      {gorusMetin && (
        <Section>
          <figure className="relative mx-auto max-w-3xl rounded-xl border border-border bg-surface p-6 pl-8 overflow-hidden">
            <span className="absolute left-0 top-0 h-full w-1 rounded-l-xl" style={{ backgroundColor: '#e63950' }} aria-hidden />
            <blockquote className="relative text-base leading-relaxed text-foreground/80">
              &ldquo;{gorusMetin}&rdquo;
            </blockquote>
            {(data.gorus?.kisi || gorusUnvan) && (
              <figcaption className="mt-4 border-t border-border pt-4">
                {data.gorus?.kisi && <p className="font-semibold">{data.gorus.kisi}</p>}
                {gorusUnvan && <p className="mt-0.5 text-sm text-muted">{gorusUnvan} — {data.ad}</p>}
              </figcaption>
            )}
          </figure>
        </Section>
      )}

      {/* Projeler */}
      <Section tone="muted">
        <h2 className="mb-10 font-display text-2xl font-bold sm:text-3xl">
          {isTr ? 'Bu referansla yapılan projeler' : 'Projects delivered with this reference'}
        </h2>
        {projects.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCardLink key={project.slug} project={project} locale={locale} />
            ))}
          </div>
        ) : (
          <p className="text-muted">
            {isTr ? 'Bu referans için henüz proje eklenmedi.' : 'No projects added for this reference yet.'}
          </p>
        )}
      </Section>

      <Cta
        baslik={isTr ? 'Projenizi Birlikte Hayata Geçirelim' : "Let’s Bring Your Project to Life"}
        aciklama={
          isTr
            ? 'Redwall olarak deneyimimizi sizin projenize taşımaya hazırız.'
            : "At Redwall, we're ready to bring our experience to your project."
        }
        buton={{ etiket: isTr ? 'Teklif Al' : 'Get a Quote', href: '/teklif' }}
      />
    </>
  );
}
