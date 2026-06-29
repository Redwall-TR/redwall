'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import ThemeToggle from '@/components/layout/ThemeToggle';
import LocaleSwitcher from '@/components/layout/LocaleSwitcher';
import { PRIMARY } from '@/components/layout/nav-config';
import MobileNav from '@/components/layout/MobileNav';

// Typed representations of the nav config
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
  // Children with a hardcoded label (e.g. YangınPro, MekanikPro) use it directly
  if (child.label) return child.label;
  // Otherwise use the translation key directly (all keys exist in messages/*.json)
  return t(child.key as Parameters<typeof t>[0]);
}

// Individual dropdown item component
function DropdownItem({
  item,
  t,
}: {
  item: NavItem;
  t: ReturnType<typeof useTranslations<'nav'>>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close when focus leaves the entire group
  useEffect(() => {
    function handleFocusOut(e: FocusEvent) {
      if (ref.current && !ref.current.contains(e.relatedTarget as Node)) {
        setOpen(false);
      }
    }
    const el = ref.current;
    el?.addEventListener('focusout', handleFocusOut);
    return () => el?.removeEventListener('focusout', handleFocusOut);
  }, []);

  if (!hasChildren(item)) {
    return (
      <Link
        href={item.href}
        className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
      >
        {t(item.key as Parameters<typeof t>[0])}
      </Link>
    );
  }

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className={cn(
          'inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md',
        )}
      >
        {t(item.key as Parameters<typeof t>[0])}
        <svg
          className={cn('h-3 w-3 transition-transform', open && 'rotate-180')}
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        // Outer wrapper sits flush against the button (top-full, no margin) so
        // the hover area stays continuous; pt-2 gives a visual gap that is still
        // hoverable — fixes the dropdown closing before a child can be clicked.
        <div className="absolute left-0 top-full z-50 pt-2">
          <div
            role="menu"
            className="min-w-[180px] rounded-lg border border-border bg-surface p-1 shadow-lg"
          >
            {item.children.map((child) => (
              <Link
                key={child.key}
                href={child.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-sm text-foreground hover:text-primary hover:bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {getChildLabel(child, t)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type SoftwareItem = { key: string; href: string; label: string };

export default function Header({
  locale,
  softwareItems = [],
}: {
  locale: string;
  softwareItems?: SoftwareItem[];
}) {
  const t = useTranslations('nav');
  const ta = useTranslations('a11y');
  // TODO (Task 3.2): lift this state to control the mobile panel
  const [mobileOpen, setMobileOpen] = useState(false);

  // "Yazılım" alt menüsü yayındaki ürünlerden üretilir. Ürün yoksa düz link.
  const navItems: NavItem[] = (PRIMARY as readonly NavItem[]).map((item) => {
    if (item.key !== 'yazilim') return item;
    if (softwareItems.length === 0) return { key: item.key, href: item.href };
    return { ...item, children: softwareItems };
  });

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0 flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md">
          <Image
            src="/redwall-logo-light.svg"
            alt="Redwall"
            width={111}
            height={36}
            priority
            className="h-9 w-auto block dark:hidden"
          />
          <Image
            src="/redwall-logo-dark.svg"
            alt="Redwall"
            width={111}
            height={36}
            priority
            className="h-9 w-auto hidden dark:block"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1" aria-label={ta('anaMenu')}>
          {navItems.map((item) => (
            <DropdownItem key={item.key} item={item} t={t} />
          ))}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            <LocaleSwitcher locale={locale} />
            <span className="h-6 w-px bg-border" aria-hidden="true" />
            <Button href="/teklif" variant="primary" className="px-5 py-2 text-sm shadow-sm shadow-primary/20">
              {t('teklifIste')}
            </Button>
          </div>

          {/* Mobile hamburger — panel implemented in Task 3.2 */}
          <button
            type="button"
            aria-label={mobileOpen ? ta('menuKapat') : ta('menuAc')}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              {mobileOpen ? (
                <path
                  d="M6 18L18 6M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} locale={locale} softwareItems={softwareItems} />
    </header>
  );
}
