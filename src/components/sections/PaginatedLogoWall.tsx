'use client';

import { useState } from 'react';
import { LogoWall } from '@/components/ui';
import { cn } from '@/lib/utils';

interface PaginatedLogoWallProps {
  logos: { ad: string; src?: string; href?: string }[];
  perPage?: number;
  locale: string;
}

export default function PaginatedLogoWall({
  logos,
  perPage = 12,
  locale,
}: PaginatedLogoWallProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(logos.length / perPage));
  const current = Math.min(page, totalPages);
  const slice = logos.slice((current - 1) * perPage, current * perPage);

  const isTr = locale === 'tr';

  return (
    <div>
      <LogoWall logos={slice} />

      {totalPages > 1 && (
        <nav
          className="mt-10 flex items-center justify-center gap-2"
          aria-label={isTr ? 'Sayfalama' : 'Pagination'}
        >
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={current === 1}
            className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
          >
            {isTr ? 'Önceki' : 'Prev'}
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              aria-current={n === current ? 'page' : undefined}
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors',
                n === current
                  ? 'border-primary bg-primary text-white'
                  : 'border-border hover:border-primary/40 hover:text-primary',
              )}
            >
              {n}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={current === totalPages}
            className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
          >
            {isTr ? 'Sonraki' : 'Next'}
          </button>
        </nav>
      )}
    </div>
  );
}
