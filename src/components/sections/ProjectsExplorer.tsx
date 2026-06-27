'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui';
import { pick, type Locale } from '@/lib/locales';
import { isKoluLabel } from '@/lib/labels';
import { filterProjects, type ProjectCard } from '@/lib/projects';
import { cn } from '@/lib/utils';
import type { IsKolu, ProjeDurumu } from '@/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const IS_KOLU_LIST: IsKolu[] = ['yazilim', 'danismanlik', 'muhendislik'];

const DURUM_LABELS: Record<ProjeDurumu, Record<Locale, string>> = {
  'devam-eden': { tr: 'Devam Eden', en: 'Ongoing' },
  tamamlandi: { tr: 'Tamamlandı', en: 'Completed' },
};

const DURUM_TONE: Record<ProjeDurumu, 'amber' | 'green'> = {
  'devam-eden': 'amber',
  tamamlandi: 'green',
};

const DURUM_LIST: ProjeDurumu[] = ['devam-eden', 'tamamlandi'];

// ── Props ─────────────────────────────────────────────────────────────────────

interface ProjectsExplorerProps {
  projects: ProjectCard[];
  locale: Locale;
}

// ── Chip ──────────────────────────────────────────────────────────────────────

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors',
        active
          ? 'bg-primary text-white ring-primary'
          : 'bg-surface text-foreground ring-border hover:ring-primary/60 hover:text-primary',
      )}
    >
      {children}
    </button>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProjectsExplorer({ projects, locale }: ProjectsExplorerProps) {
  const [selectedIsKolu, setSelectedIsKolu] = useState<IsKolu | 'all'>('all');
  const [selectedDurum, setSelectedDurum] = useState<ProjeDurumu | 'all'>('all');

  const filtered = filterProjects(projects, {
    isKolu: selectedIsKolu === 'all' ? undefined : selectedIsKolu,
    durum: selectedDurum === 'all' ? undefined : selectedDurum,
  });

  const allLabel = locale === 'tr' ? 'Tümü' : 'All';
  const emptyLabel =
    locale === 'tr'
      ? 'Bu filtreye uygun proje bulunamadı.'
      : 'No projects match this filter.';

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-14 pb-20 sm:pt-16">
      {/* ── Filter Chips ───────────────────────────────────────── */}
      <div className="mb-8 flex flex-wrap gap-2">
        {/* İş Kolu chips */}
        <Chip active={selectedIsKolu === 'all'} onClick={() => setSelectedIsKolu('all')}>
          {allLabel}
        </Chip>
        {IS_KOLU_LIST.map((ik) => (
          <Chip
            key={ik}
            active={selectedIsKolu === ik}
            onClick={() => setSelectedIsKolu(selectedIsKolu === ik ? 'all' : ik)}
          >
            {isKoluLabel(ik, locale)}
          </Chip>
        ))}

        {/* Divider */}
        <span className="self-center text-border mx-1" aria-hidden="true">
          |
        </span>

        {/* Durum chips */}
        {DURUM_LIST.map((d) => (
          <Chip
            key={d}
            active={selectedDurum === d}
            onClick={() => setSelectedDurum(selectedDurum === d ? 'all' : d)}
          >
            {DURUM_LABELS[d][locale]}
          </Chip>
        ))}
      </div>

      {/* ── Project Grid ───────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface py-20 text-center">
          <p className="text-muted text-base">{emptyLabel}</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => {
            const title = pick(project.baslik, locale) ?? project.baslik.tr;

            return (
              <Link
                key={project.slug}
                href={`/projeler/${project.slug}`}
                className={cn(
                  'group relative flex flex-col rounded-2xl border border-border bg-surface overflow-hidden',
                  'transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40',
                )}
              >
                <div className="flex flex-1 flex-col p-5">
                  {/* Durum badge */}
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Badge tone={DURUM_TONE[project.durum]}>
                      {DURUM_LABELS[project.durum][locale]}
                    </Badge>
                    <Badge tone="navy">{isKoluLabel(project.isKolu, locale)}</Badge>
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-base font-bold text-foreground mb-1 line-clamp-2">
                    {title}
                  </h3>

                  {/* Müşteri */}
                  {project.musteri && (
                    <p className="text-sm text-muted mt-1">{project.musteri}</p>
                  )}

                  {/* Yıl & İl */}
                  {(project.yil || project.il) && (
                    <p className="mt-auto pt-4 text-xs text-muted">
                      {[project.yil, project.il].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
