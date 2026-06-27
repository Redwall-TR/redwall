// Kurum logosu kart gridi. Logo varsa gri→renkli hover ("trusted by" stili),
// yoksa baş harf monogramı + kurum adı ile zarif fallback.

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
          className="group flex h-28 items-center justify-center rounded-2xl border border-border bg-background p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
        >
          {logo.src ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL Sanity CDN'den gelir; remotePatterns kapsam dışı
            <img
              src={logo.src}
              alt={logo.ad}
              className="max-h-12 w-auto max-w-full object-contain opacity-70 grayscale transition duration-200 group-hover:opacity-100 group-hover:grayscale-0"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 font-display text-base font-bold text-primary">
                {initials(logo.ad)}
              </span>
              <span className="line-clamp-2 text-xs font-medium leading-tight text-foreground/70">
                {logo.ad}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
