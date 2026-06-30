import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui';
import { pick, type Locale } from '@/lib/locales';
import { isKoluLabel } from '@/lib/labels';
import { cn } from '@/lib/utils';
import type { ProjectCard } from '@/lib/projects';
import type { ProjeDurumu } from '@/types';

const DURUM_LABELS: Record<ProjeDurumu, Record<Locale, string>> = {
  'devam-eden': { tr: 'Devam Eden', en: 'Ongoing' },
  tamamlandi: { tr: 'Tamamlandı', en: 'Completed' },
};

const DURUM_TONE: Record<ProjeDurumu, 'amber' | 'green'> = {
  'devam-eden': 'amber',
  tamamlandi: 'green',
};

export function ProjectCardLink({
  project,
  locale,
}: {
  project: ProjectCard;
  locale: Locale;
}) {
  const title = pick(project.baslik, locale) ?? project.baslik.tr;
  return (
    <Link
      href={`/projeler/${project.slug}`}
      className={cn(
        'group relative flex flex-col rounded-2xl border border-border bg-surface overflow-hidden',
        'transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40',
      )}
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge tone={DURUM_TONE[project.durum]}>
            {DURUM_LABELS[project.durum][locale]}
          </Badge>
          <Badge tone="navy">{isKoluLabel(project.isKolu, locale)}</Badge>
        </div>
        <h3 className="font-display text-base font-bold text-foreground mb-1 line-clamp-2">
          {title}
        </h3>
        {project.musteri && (
          <p className="text-sm text-muted mt-1">{project.musteri}</p>
        )}
        {(project.yil || project.il) && (
          <p className="mt-auto pt-4 text-xs text-muted">
            {[project.yil, project.il].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </Link>
  );
}
