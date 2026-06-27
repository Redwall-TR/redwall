import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'nav' });
  const tf = await getTranslations({ locale, namespace: 'footer' });

  return (
    <footer className="border-t border-border bg-surface">
      {/* Main columns */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand column */}
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
            >
              <Image
                src="/redwall-logo-footer-light.svg"
                alt="Redwall"
                width={130}
                height={42}
                className="h-28 w-auto block dark:hidden"
              />
              <Image
                src="/redwall-logo-footer-dark.svg"
                alt="Redwall"
                width={130}
                height={42}
                className="h-28 w-auto hidden dark:block"
              />
            </Link>
            <p className="text-sm text-muted leading-relaxed">
              {tf('tagline')}
            </p>
          </div>

          {/* İş Kollarımız */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              {tf('isKollarimiz')}
            </h3>
            <ul className="flex flex-col gap-2">
              <li>
                <Link
                  href="/yazilim"
                  className="text-sm text-muted hover:text-primary transition-colors"
                >
                  {t('yazilim')}
                </Link>
              </li>
              <li>
                <Link
                  href="/danismanlik"
                  className="text-sm text-muted hover:text-primary transition-colors"
                >
                  {t('danismanlik')}
                </Link>
              </li>
              <li>
                <Link
                  href="/muhendislik"
                  className="text-sm text-muted hover:text-primary transition-colors"
                >
                  {t('muhendislik')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Kurumsal */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              {t('kurumsal')}
            </h3>
            <ul className="flex flex-col gap-2">
              <li>
                <Link
                  href="/kurumsal/hakkimizda"
                  className="text-sm text-muted hover:text-primary transition-colors"
                >
                  {t('hakkimizda')}
                </Link>
              </li>
              <li>
                <Link
                  href="/kurumsal/vizyon-misyon"
                  className="text-sm text-muted hover:text-primary transition-colors"
                >
                  {t('vizyonMisyon')}
                </Link>
              </li>
              <li>
                <Link
                  href="/kurumsal/kalite-belgeler"
                  className="text-sm text-muted hover:text-primary transition-colors"
                >
                  {t('kaliteBelgeler')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Daha Fazla + İletişim */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                {t('dahaFazla')}
              </h3>
              <ul className="flex flex-col gap-2">
                <li>
                  <Link
                    href="/referanslar"
                    className="text-sm text-muted hover:text-primary transition-colors"
                  >
                    {t('referanslar')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/sss"
                    className="text-sm text-muted hover:text-primary transition-colors"
                  >
                    {t('sss')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="text-sm text-muted hover:text-primary transition-colors"
                  >
                    {t('blog')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/kariyer"
                    className="text-sm text-muted hover:text-primary transition-colors"
                  >
                    {t('kariyer')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/iletisim"
                    className="text-sm text-muted hover:text-primary transition-colors"
                  >
                    {t('iletisim')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact info */}
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                {t('iletisim')}
              </h3>
              <a
                href="mailto:info@redwall.com.tr"
                className="text-sm text-muted hover:text-primary transition-colors"
              >
                info@redwall.com.tr
              </a>
              <a
                href="tel:+900000000000"
                className="text-sm text-muted hover:text-primary transition-colors"
              >
                +90 (XXX) XXX XX XX
              </a>
              <span className="text-sm text-muted">İstanbul, Türkiye</span>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-xs text-muted">
            © 2026 Redwall Yangın Danışmanlık Yazılım ve Mühendislik Hizmetleri LTD. Şti. {tf('haklar')}
          </p>
        </div>
      </div>
    </footer>
  );
}
