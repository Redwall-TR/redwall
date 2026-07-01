import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Space_Grotesk } from 'next/font/google';
import { getLocale } from 'next-intl/server';
import '../globals.css';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { getSiteSettings } from '@/lib/cms/queries';
import { mediaUrl } from '@/lib/cms/image';

const sans = Geist({ variable: '--font-sans', subsets: ['latin'] });
const display = Space_Grotesk({ variable: '--font-display', subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const marka = (settings as unknown as { marka?: Record<string, unknown> } | null)?.marka ?? null;
  const faviconUrl = marka ? mediaUrl(marka.favicon) ?? null : null;
  return {
    title: { default: 'Redwall', template: '%s | Redwall' },
    description: 'Redwall Yangın Danışmanlık, Yazılım ve Mühendislik Hizmetleri',
    icons: { icon: faviconUrl ?? '/favicon.ico' },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable} font-sans antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
