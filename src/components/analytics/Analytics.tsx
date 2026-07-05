import Script from 'next/script';
import { umamiScriptSrc } from '@/lib/umami';

/** Umami izleme script'i — env doluysa basar, yoksa null (inert). Çerezsiz (KVKK). */
export function Analytics() {
  const cfg = umamiScriptSrc(process.env.NEXT_PUBLIC_UMAMI_URL, process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID);
  if (!cfg) return null;
  return <Script defer src={cfg.src} data-website-id={cfg.websiteId} strategy="afterInteractive" />;
}
