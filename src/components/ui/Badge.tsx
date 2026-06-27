import { cn } from '@/lib/utils';

export function Badge({ children, tone = 'primary' }: { children: React.ReactNode; tone?: 'primary'|'amber'|'navy'|'green' }) {
  const tones = { primary: 'bg-primary/10 text-primary', amber: 'bg-amber/10 text-amber',
    navy: 'bg-navy/10 text-navy', green: 'bg-green-500/10 text-green-600' };
  return <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone])}>{children}</span>;
}
