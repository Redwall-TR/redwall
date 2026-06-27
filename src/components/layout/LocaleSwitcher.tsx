'use client';
import { usePathname, useRouter } from '@/i18n/navigation';
import { LOCALES, type Locale } from '@/lib/locales';
import { cn } from '@/lib/utils';

export default function LocaleSwitcher({ locale }: { locale: string }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <div className="inline-flex rounded-md border border-border text-xs font-medium">
      {LOCALES.map((l: Locale) => (
        <button
          key={l}
          onClick={() => router.replace(pathname, { locale: l })}
          className={cn('px-2 py-1 uppercase', l === locale ? 'bg-primary text-white' : 'hover:bg-surface')}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
