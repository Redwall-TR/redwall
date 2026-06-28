import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      {/* Big branded 404 */}
      <span className="font-display text-[8rem] font-bold leading-none text-primary/20 select-none">
        404
      </span>

      {/* Bilingual message */}
      <h1 className="mt-4 font-display text-2xl font-bold text-foreground sm:text-3xl">
        Sayfa Bulunamadı
      </h1>
      <p className="mt-1 text-base text-muted">Page Not Found</p>

      <p className="mt-4 max-w-sm text-sm text-muted">
        Aradığınız sayfa mevcut değil ya da taşınmış olabilir.
        <br />
        The page you are looking for does not exist or may have moved.
      </p>

      {/* Back home link */}
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
      >
        Ana Sayfaya Dön / Back to Home
      </Link>
    </div>
  );
}
