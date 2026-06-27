import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export function Breadcrumb({ items }: { items: { etiket: string; href?: string }[] }) {
  return (
    <nav className="flex items-center gap-2 text-sm">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          {i > 0 && <span className="text-muted">/</span>}
          {item.href ? (
            <Link href={item.href} className="text-primary hover:underline">
              {item.etiket}
            </Link>
          ) : (
            <span className="text-muted">{item.etiket}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
