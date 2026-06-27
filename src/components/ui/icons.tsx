// Line-icon set (Lucide-style, 1.6 stroke) for service cards and page heroes.
// Data-driven via `name` so fallback content can reference icons by id.

type IconProps = { className?: string };

const base = (children: React.ReactNode, props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className ?? 'h-6 w-6'}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const PATHS: Record<string, React.ReactNode> = {
  // Danışmanlık
  'shield-check': (
    <>
      <path d="M12 3 4 6v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  clipboard: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4V3h6v1" />
      <path d="m9 13 2 2 3-3.5" />
    </>
  ),
  ruler: (
    <>
      <path d="M3 17 17 3l4 4L7 21l-4-4Z" />
      <path d="m7 11 2 2M11 7l2 2M15 11l2 2" />
    </>
  ),
  'hard-hat': (
    <>
      <path d="M4 16a8 8 0 0 1 16 0" />
      <path d="M10 9V6a2 2 0 0 1 4 0v3" />
      <path d="M3 16h18v2H3z" />
    </>
  ),
  building: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" />
      <path d="M10 21v-3h4v3" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 8-8 2 2-2 2 2 2-2 2-2-2-3 3" />
    </>
  ),
  // Mühendislik
  droplet: (
    <>
      <path d="M12 3c3 4 6 7 6 10a6 6 0 0 1-12 0c0-3 3-6 6-10Z" />
      <path d="M9 14a3 3 0 0 0 3 3" />
    </>
  ),
  wall: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="M3 10h18M3 15h18M8 5v5M16 5v5M12 10v5M8 15v4M16 15v4" />
    </>
  ),
  wrench: (
    <>
      <path d="M14.5 5.5a3.5 3.5 0 0 0-4.6 4.3l-6 6 2 2 6-6a3.5 3.5 0 0 0 4.3-4.6L14 9l-1.5-1.5 2-2Z" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 4v4h-4" />
    </>
  ),
  // Yazılım / genel
  code: (
    <>
      <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13 6l-2 12" />
    </>
  ),
  flame: (
    <>
      <path d="M12 3c1 3 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 1-5 2 1 3 0 4-4Z" />
    </>
  ),
  gauge: (
    <>
      <path d="M12 14 9 9" />
      <circle cx="12" cy="13" r="9" />
      <path d="M12 4v2M20 13h-2M4 13H6" />
    </>
  ),
  document: (
    <>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4M10 13h5M10 17h5" />
    </>
  ),
};

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  return base(PATHS[name] ?? PATHS['shield-check'], { className });
}
