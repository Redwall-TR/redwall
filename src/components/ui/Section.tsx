import { cn } from '@/lib/utils';

export function Section({ children, className, container = true, tone = 'default', id }:
  { children: React.ReactNode; className?: string; container?: boolean; tone?: 'default'|'dark'|'muted'; id?: string }) {
  const tones = { default: 'bg-background', dark: 'bg-[#141416] text-white', muted: 'bg-surface' };
  return (
    <section id={id} className={cn('py-20', tones[tone], className)}>
      {container ? <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div> : children}
    </section>
  );
}
