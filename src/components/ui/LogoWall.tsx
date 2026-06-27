// Kurum kartı: üstte logo (gri→hover renkli) veya baş harf monogramı, altta ad.

function initials(ad: string): string {
  return ad
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toLocaleUpperCase('tr-TR');
}

export function LogoWall({ logos }: { logos: { ad: string; src?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {logos.map((logo, i) => (
        <div
          key={i}
          className="group flex h-36 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-background p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
        >
          <div className="flex h-12 items-center justify-center">
            {logo.src ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL Sanity CDN'den gelir; remotePatterns kapsam dışı
              <img
                src={logo.src}
                alt={logo.ad}
                className="max-h-12 w-auto max-w-full object-contain opacity-70 grayscale transition duration-200 group-hover:opacity-100 group-hover:grayscale-0"
              />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 font-display text-base font-bold text-primary">
                {initials(logo.ad)}
              </span>
            )}
          </div>
          <span className="line-clamp-2 text-center text-sm font-medium leading-tight text-foreground/80">
            {logo.ad}
          </span>
        </div>
      ))}
    </div>
  );
}
