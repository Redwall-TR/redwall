import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { sanityFetch } from '@/sanity/lib/fetch';
import { PROJECTS_QUERY } from '@/sanity/lib/queries';
import { isLocale, type Locale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { PageHeader } from '@/components/ui';
import ProjectsExplorer from '@/components/sections/ProjectsExplorer';
import type { ProjectCard } from '@/lib/projects';

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

  const projects = await sanityFetch<ProjectCard[]>(PROJECTS_QUERY, {}, []);

  const heading = locale === 'tr' ? 'Projeler' : 'Projects';
  const description =
    locale === 'tr'
      ? 'Devam eden ve tamamlanan projelerimizi iş koluna göre filtreleyin.'
      : 'Filter our ongoing and completed projects by business line.';

  return (
    <>
      <PageHeader baslik={heading} aciklama={description} />
      <ProjectsExplorer projects={projects} locale={locale} />
    </>
  );
}
