import { Badge } from './Badge';

export function LogoWall({ logos }: { logos: { ad: string; src?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {logos.map((logo, i) => (
        <div
          key={i}
          className="flex items-center justify-center rounded-lg border border-border bg-surface p-4 min-h-[100px]"
        >
          {logo.src ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL comes from Sanity CDN; remotePatterns config is out of scope
            <img src={logo.src} alt={logo.ad} className="max-h-12 max-w-full object-contain" />
          ) : (
            <Badge tone="primary">{logo.ad}</Badge>
          )}
        </div>
      ))}
    </div>
  );
}
