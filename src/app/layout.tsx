import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Space_Grotesk } from 'next/font/google';
import { getLocale } from 'next-intl/server';
import './globals.css';
import { ThemeProvider } from '@/components/layout/ThemeProvider';

const sans = Geist({ variable: '--font-sans', subsets: ['latin'] });
const display = Space_Grotesk({ variable: '--font-display', subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'Redwall', template: '%s | Redwall' },
  description: 'Redwall Yangın Danışmanlık, Yazılım ve Mühendislik Hizmetleri',
};

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
