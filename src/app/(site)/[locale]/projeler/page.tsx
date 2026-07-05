import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { getProjects } from '@/lib/cms/queries';
import { isLocale, type Locale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { PageHero } from '@/components/sections/PageHero';
import { ServiceIcon } from '@/components/ui/icons';
import ProjectsExplorer from '@/components/sections/ProjectsExplorer';
import type { ProjectCard } from '@/lib/projects';
import { ACCENT } from '@/lib/theme';

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : 'tr';

  const baslik = loc === 'tr' ? 'Projeler — Redwall' : 'Projects — Redwall';
  const aciklama =
    loc === 'tr'
      ? 'Redwall\'ın tamamlanan ve devam eden projelerini iş koluna göre filtreleyin.'
      : 'Browse Redwall\'s completed and ongoing projects, filtered by business line.';

  return buildMetadata({ baslik, aciklama, locale: loc, path: '/projeler' });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ProjelerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const projects = (await getProjects()) as unknown as ProjectCard[];

  const isTr = locale === 'tr';
  const heading = isTr ? 'Projeler' : 'Projects';
  const description = isTr
    ? 'Devam eden ve tamamlanan projelerimizi iş koluna göre filtreleyin.'
    : 'Filter our ongoing and completed projects by business line.';

  const chips = isTr
    ? ['Devam Eden', 'Tamamlandı', 'Danışmanlık', 'Mühendislik', 'Yazılım']
    : ['Ongoing', 'Completed', 'Consulting', 'Engineering', 'Software'];

  return (
    <>
      <PageHero
        eyebrow={isTr ? 'Projeler' : 'Projects'}
        title={heading}
        description={description}
        accent={ACCENT}
        chips={chips}
        glyph={<ServiceIcon name="building" className="h-[26rem] w-[26rem]" />}
      />
      <ProjectsExplorer projects={projects} locale={locale} />
    </>
  );
}
