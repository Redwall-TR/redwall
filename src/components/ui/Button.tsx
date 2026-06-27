import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost';
const styles: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark',
  secondary: 'border border-border bg-surface hover:bg-background',
  ghost: 'text-primary hover:underline',
};

export function Button({
  href, variant = 'primary', className, children, ...rest
}: { href?: string; variant?: Variant; className?: string; children: React.ReactNode } &
    React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = cn('inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold transition-colors', styles[variant], className);
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button className={cls} {...rest}>{children}</button>;
}
