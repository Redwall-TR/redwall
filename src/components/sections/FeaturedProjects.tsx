import { pick, type Locale } from '@/lib/locales';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

interface LocaleString {
  tr: string;
  en: string;
}

export interface FeaturedProject {
  slug: string;
  baslik: LocaleString;
  musteri?: string;
  isKolu?: string;
  durum?: string;
  gorsel?: { asset?: unknown };
}

interface FeaturedProjectsProps {
  projects: FeaturedProject[];
  locale: Locale;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DURUM_MAP: Record<string, { tr: string; en: string; tone: 'primary' | 'amber' | 'green' }> = {
  'devam-eden': { tr: 'Devam Eden', en: 'Ongoing', tone: 'amber' },
  'tamamlandi': { tr: 'Tamamlandı', en: 'Completed', tone: 'green' },
};

const IS_KOLU_COLORS: Record<string, string> = {
  yazilim: 'bg-primary/20',
  danismanlik: 'bg-amber/20',
  muhendislik: 'bg-navy/20',
};

// ── Component ────────────────────────────────────────────────────────────────

export default function FeaturedProjects({ projects, locale }: FeaturedProjectsProps) {
  if (projects.length === 0) return null;

  const displayed = projects.slice(0, 3);

  const sectionLabel = locale === 'tr' ? 'Öne Çıkan Projeler' : 'Featured Projects';
  const sectionHeading =
    locale === 'tr' ? 'Referans projelerimizden seçkiler' : 'A selection of our reference projects';
  const allLabel = locale === 'tr' ? 'Tüm projeler →' : 'All projects →';

  return (
    <section className="py-20 bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Heading */}
        <div className="mb-12 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20">
              {sectionLabel}
            </span>
            <h2 className="font-display mt-4 text-3xl font-bold text-foreground sm:text-4xl">
              {sectionHeading}
            </h2>
          </div>
          <Link
            href="/projeler"
            className="shrink-0 text-sm font-semibold text-primary hover:underline"
          >
            {allLabel}
          </Link>
        </div>

        {/* Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((project) => {
            const title = pick(project.baslik, locale) ?? project.baslik.tr;
            const durumInfo = project.durum ? DURUM_MAP[project.durum] : undefined;
            const durumLabel = durumInfo
              ? locale === 'tr'
                ? durumInfo.tr
                : durumInfo.en
              : project.durum;
            const placeholderColor =
              (project.isKolu && IS_KOLU_COLORS[project.isKolu]) ?? 'bg-surface';

            return (
              <Link
                key={project.slug}
                href={`/projeler/${project.slug}`}
                className={cn(
                  'group relative flex flex-col rounded-2xl border border-border bg-surface overflow-hidden',
                  'transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40',
                )}
              >
                {/* Image placeholder */}
                <div
                  className={cn(
                    'h-40 w-full flex items-center justify-center',
                    placeholderColor,
                  )}
                  aria-hidden="true"
                >
                  <svg
                    className="h-12 w-12 text-foreground/20"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  {/* Badges */}
                  <div className="mb-3 flex flex-wrap gap-2">
                    {durumLabel && (
                      <Badge tone={durumInfo?.tone ?? 'primary'}>{durumLabel}</Badge>
                    )}
                    {project.isKolu && (
                      <Badge tone="navy">{project.isKolu}</Badge>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-base font-bold text-foreground mb-1 line-clamp-2">
                    {title}
                  </h3>

                  {/* Client */}
                  {project.musteri && (
                    <p className="text-xs text-muted mt-auto pt-3">
                      {project.musteri}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom link for mobile */}
        <div className="mt-8 text-center sm:hidden">
          <Link href="/projeler" className="text-sm font-semibold text-primary hover:underline">
            {allLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
