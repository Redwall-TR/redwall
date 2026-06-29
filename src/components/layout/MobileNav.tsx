'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import ThemeToggle from '@/components/layout/ThemeToggle';
import LocaleSwitcher from '@/components/layout/LocaleSwitcher';
import { PRIMARY } from '@/components/layout/nav-config';

type NavChild = { readonly key: string; readonly href: string; readonly label?: string };
type NavItemBase = { readonly key: string; readonly href: string };
type NavItemWithChildren = NavItemBase & { readonly children: readonly NavChild[] };
type NavItem = NavItemBase | NavItemWithChildren;

function hasChildren(item: NavItem): item is NavItemWithChildren {
  return 'children' in item;
}

function getChildLabel(
  child: NavChild,
  t: ReturnType<typeof useTranslations<'nav'>>,
): string {
  if (child.label) return child.label;
  return t(child.key as Parameters<typeof t>[0]);
}

function MobileNavItem({
  item,
  t,
  onClose,
}: {
  item: NavItem;
  t: ReturnType<typeof useTranslations<'nav'>>;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!hasChildren(item)) {
    return (
      <Link
        href={item.href}
        onClick={onClose}
        className="block px-4 py-3 text-base font-medium text-foreground hover:text-primary hover:bg-surface transition-colors rounded-md"
      >
        {t(item.key as Parameters<typeof t>[0])}
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-base font-medium text-foreground hover:text-primary hover:bg-surface transition-colors rounded-md"
      >
        {t(item.key as Parameters<typeof t>[0])}
        <svg
          className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')}
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {expanded && (
        <div className="ml-4 mt-1 space-y-1 border-l border-border pl-4">
          {item.children.map((child) => (
            <Link
              key={child.key}
              href={child.href}
              onClick={onClose}
              className="block px-3 py-2 text-sm text-foreground hover:text-primary hover:bg-surface transition-colors rounded-md"
            >
              {getChildLabel(child, t)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

type SoftwareItem = { key: string; href: string; label: string };

export default function MobileNav({
  open,
  onClose,
  locale,
  softwareItems = [],
}: {
  open: boolean;
  onClose: () => void;
  locale: string;
  softwareItems?: SoftwareItem[];
}) {
  const t = useTranslations('nav');
  const ta = useTranslations('a11y');

  // "Yazılım" alt menüsü yayındaki ürünlerden üretilir. Ürün yoksa düz link.
  const navItems: NavItem[] = (PRIMARY as readonly NavItem[]).map((item) => {
    if (item.key !== 'yazilim') return item;
    if (softwareItems.length === 0) return { key: item.key, href: item.href };
    return { ...item, children: softwareItems };
  });

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <div
      id="mobile-menu"
      className={cn('lg:hidden', !open && 'hidden')}
      aria-hidden={!open}
    >
      <div className="border-t border-border bg-background px-4 py-4 space-y-1">
        <nav aria-label={ta('mobilMenu')}>
          {navItems.map((item) => (
            <MobileNavItem key={item.key} item={item} t={t} onClose={onClose} />
          ))}
        </nav>

        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LocaleSwitcher locale={locale} />
          </div>
          <Button href="/teklif" variant="primary" className="px-4 py-2 text-sm" onClick={onClose}>
            {t('teklifIste')}
          </Button>
        </div>
      </div>
    </div>
  );
}
