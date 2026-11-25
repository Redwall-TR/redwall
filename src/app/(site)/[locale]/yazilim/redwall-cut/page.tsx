import type { CSSProperties } from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Barlow_Condensed } from 'next/font/google';
import type { Metadata } from 'next';

import { Link } from '@/i18n/navigation';
import { isLocale, pick, type Locale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { getProduct } from '@/lib/cms/queries';
import { JsonLd } from '@/components/seo/JsonLd';
import { softwareAppJsonLd, breadcrumbJsonLd } from '@/lib/jsonLd';
import { cn } from '@/lib/utils';
import { lexicalToPlainText } from '@/lib/lexicalToPlainText';
import { mediaUrl } from '@/lib/cms/image';
import {
  REDWALL_CUT_ARAYUZ,
  REDWALL_CUT_KART,
  REDWALL_CUT_LANDING,
  REDWALL_CUT_LOGO,
  REDWALL_CUT_SLUG,
  paketHucresi,
  yerellestir,
  type Landing,
  type RedwallCutArayuz,
} from '@/data/redwall-cut';

import './redwall-cut.css';

// Programın başlıklarındaki DIN benzeri dar yazının web karşılığı (Türkçe için latin-ext).
const display = Barlow_Condensed({
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700'],
  variable: '--font-rwc',
});

// Ürün kaydı CMS'ten okunur (yayında değilse 404) → Payload headers() okur, statik üretilemez.
export const dynamic = 'force-dynamic';

const PATH = `/yazilim/${REDWALL_CUT_SLUG}`;
const DEMO = '/yazilim/demo';

type Bolum = NonNullable<Landing<string>['bolumler']>[number];

/** CMS kaydı + tek dile indirilmiş landing. Landing CMS'te boşsa koddaki başlangıç içeriği gösterilir. */
async function urunuOku(locale: Locale) {
  const urun = (await getProduct(REDWALL_CUT_SLUG)) as {
    ad?: string;
    slogan?: Record<Locale, string>;
    aciklama?: Record<Locale, unknown>;
    ekranGorselleri?: unknown[];
    landing?: Landing | null;
  } | null;
  if (!urun) return null;
  const dolu = urun.landing?.baslik || urun.landing?.bolumler?.length;
  return {
    ad: urun.ad ?? REDWALL_CUT_KART.ad,
    slogan: pick(urun.slogan, locale) ?? REDWALL_CUT_KART.slogan[locale],
    aciklama: lexicalToPlainText(pick(urun.aciklama, locale)) || REDWALL_CUT_KART.aciklama[locale],
    ekran: urun.ekranGorselleri?.[0],
    landing: yerellestir(dolu ? urun.landing : REDWALL_CUT_LANDING, locale) as Landing<string>,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc = isLocale(locale) ? locale : 'tr';
  const urun = await urunuOku(loc);
  return buildMetadata({
    baslik: `${urun?.ad ?? REDWALL_CUT_KART.ad}: ${urun?.slogan ?? REDWALL_CUT_KART.slogan[loc]}`,
    aciklama: urun?.aciklama ?? REDWALL_CUT_KART.aciklama[loc],
    locale: loc,
    path: PATH,
  });
}

// ── Yapı taşları ──────────────────────────────────────────────────────────────

function Bolum({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn('border-t border-(--rwc-line) py-20 sm:py-24', className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>
    </section>
  );
}

function Baslik({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn('rwc-display max-w-2xl text-4xl leading-[1.02] sm:text-5xl', className)}>
      {children}
    </h2>
  );
}

function AnaDugme({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-lg bg-(--rwc-red) px-6 py-3.5 text-base font-bold text-(--rwc-on-red) transition-opacity hover:opacity-90"
    >
      {children}
    </Link>
  );
}

// ── Açılış şeması: ham çekim → klip + fotoğraflar ─────────────────────────────
// Sahne genişlikleri temsilidir (şema); gerçek bir çekimin verisi değildir.
const HAM = [6, 3, 8, 4, 5, 9, 3, 6, 4, 7, 3, 5, 8, 4, 6, 3, 7, 5, 4, 6, 3, 8, 4, 5];
const SECILEN = [2, 5, 9, 12, 16, 21];

function SeritSatiri({
  ad,
  not,
  children,
}: {
  ad: string;
  not: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-x-6 gap-y-2 md:grid-cols-[11rem_1fr] md:items-center">
      <div>
        <div className="rwc-display text-lg leading-tight">{ad}</div>
        <div className="text-xs text-(--rwc-muted)">{not}</div>
      </div>
      {children}
    </div>
  );
}

function Serit({ t }: { t: RedwallCutArayuz['serit'] }) {
  return (
    <figure className="mt-16 sm:mt-20">
      <div className="space-y-6 rounded-2xl border border-(--rwc-line) bg-(--rwc-panel) p-5 sm:p-8">
        <SeritSatiri ad={t.ham.ad} not={t.ham.not}>
          <div className="flex h-11 gap-[3px]" aria-hidden>
            {HAM.map((w, i) => {
              const sira = SECILEN.indexOf(i);
              return (
                <span
                  key={i}
                  className={cn('rwc-scene', sira >= 0 && 'rwc-pick')}
                  style={{ flexGrow: w, '--i': sira } as CSSProperties}
                />
              );
            })}
          </div>
        </SeritSatiri>

        <SeritSatiri ad={t.klip.ad} not={t.klip.not}>
          <div className="md:w-[58%]" aria-hidden>
            <div className="flex h-11 gap-[3px]">
              <span className="flex w-12 items-center justify-center rounded-[3px] border border-(--rwc-line) text-[10px] text-(--rwc-muted)">
                {t.intro}
              </span>
              {SECILEN.map((_, i) => (
                <span
                  key={i}
                  className="rwc-drop flex-1 rounded-[3px] bg-(--rwc-red)"
                  style={{ '--i': i } as CSSProperties}
                />
              ))}
              <span className="flex w-14 items-center justify-center rounded-[3px] border border-(--rwc-line) text-[10px] text-(--rwc-muted)">
                {t.kapanis}
              </span>
            </div>
            {/* müziğin vuruşları: her sahne iki vuruş */}
            <div className="mt-2 flex h-3 pl-[calc(3rem+3px)] pr-[calc(3.5rem+3px)]">
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i} className="flex-1 border-l border-(--rwc-muted)" />
              ))}
            </div>
            <div className="mt-1 pl-[calc(3rem+3px)] text-xs text-(--rwc-muted)">
              {t.vurus.ad}: {t.vurus.not}
            </div>
          </div>
        </SeritSatiri>

        <SeritSatiri ad={t.foto.ad} not={t.foto.not}>
          <div className="flex flex-wrap gap-2" aria-hidden>
            {Array.from({ length: 10 }, (_, i) => (
              <span
                key={i}
                className="rwc-drop aspect-video w-12 rounded-[3px] border border-(--rwc-blush) bg-(--rwc-raised) sm:w-14"
                style={{ '--i': i * 0.5 + 6 } as CSSProperties}
              />
            ))}
          </div>
        </SeritSatiri>
      </div>
      <figcaption className="mt-3 text-sm text-(--rwc-muted)">{t.aciklama}</figcaption>
    </figure>
  );
}

// ── Süre ölçeği: hedef çizgisi ve ölçülen aralık ──────────────────────────────
function SureOlcegi({ hedef, enAz, enCok, a }: { hedef: number; enAz: number; enCok: number; a: RedwallCutArayuz }) {
  const son = Math.ceil((Math.max(hedef, enCok) * 1.08) / 30) * 30; // eksen: 30'un katı
  const yuzde = (sn: number) => `${(sn / son) * 100}%`;
  const isaretler = Array.from({ length: son / 30 + 1 }, (_, i) => i * 30);
  return (
    <div className="pt-8" role="img" aria-label={`${a.hedef(hedef)}; ${a.olculen(enAz, enCok)}`}>
      <div className="relative h-14">
        <div className="absolute inset-x-0 top-1/2 h-px bg-(--rwc-line)" />
        <div
          className="absolute top-1/2 h-5 -translate-y-1/2 rounded-sm bg-(--rwc-paper) opacity-80"
          style={{ left: yuzde(enAz), width: yuzde(enCok - enAz) }}
        />
        <div className="absolute inset-y-0 w-0.5 bg-(--rwc-red)" style={{ left: yuzde(hedef) }} />
        <div
          className="absolute -top-7 -translate-x-full whitespace-nowrap pr-2 text-sm font-semibold text-(--rwc-red)"
          style={{ left: yuzde(hedef) }}
        >
          {a.hedef(hedef)}
        </div>
      </div>
      <div className="relative h-5 text-xs text-(--rwc-muted)">
        {isaretler.map((sn) => (
          <span
            key={sn}
            className={cn('absolute', sn === 0 ? '' : sn === son ? '-translate-x-full' : '-translate-x-1/2')}
            style={{ left: yuzde(sn) }}
          >
            {sn}
          </span>
        ))}
      </div>
      <div className="mt-2 text-right text-sm font-semibold">{a.olculen(enAz, enCok)}</div>
    </div>
  );
}

function Hucre({ deger, t }: { deger: boolean | string; t: RedwallCutArayuz }) {
  if (typeof deger === 'string') return <span className="text-sm">{deger}</span>;
  return deger ? (
    <>
      <svg
        className="mx-auto h-5 w-5 text-(--rwc-good)"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span className="sr-only">{t.var}</span>
    </>
  ) : (
    <>
      <span className="text-(--rwc-muted)" aria-hidden>
        –
      </span>
      <span className="sr-only">{t.yok}</span>
    </>
  );
}

// ── Bölümler: CMS'teki `tur` görünümü seçer ───────────────────────────────────

function EkranGorseli({ ekran, alt, not }: { ekran: unknown; alt: string; not?: string | null }) {
  const cmsUrl = mediaUrl(ekran);
  const boyut = (ekran ?? {}) as { width?: number; height?: number };
  const ortak = { width: boyut.width ?? 1400, height: boyut.height ?? 820, sizes: '(min-width: 1024px) 640px, 100vw' };
  return (
    <figure className="lg:sticky lg:top-24 lg:self-start">
      <div className="overflow-hidden rounded-xl border border-(--rwc-line) shadow-xl">
        {cmsUrl ? (
          <Image {...ortak} alt={alt} src={cmsUrl} className="block h-auto w-full" />
        ) : (
          <>
            <Image {...ortak} alt={alt} src="/images/redwall-cut/arayuz-acik.png" className="block h-auto w-full dark:hidden" />
            <Image {...ortak} alt={alt} src="/images/redwall-cut/arayuz-koyu.png" className="hidden h-auto w-full dark:block" />
          </>
        )}
      </div>
      {not && <figcaption className="mt-3 text-sm text-(--rwc-muted)">{not}</figcaption>}
    </figure>
  );
}

function BolumIcerigi({
  b,
  landing,
  ekran,
  a,
}: {
  b: Bolum;
  landing: Landing<string>;
  ekran: unknown;
  a: RedwallCutArayuz;
}) {
  const maddeler = b.maddeler ?? [];
  const giris = b.giris && <p className="mt-5 max-w-2xl leading-relaxed text-(--rwc-muted)">{b.giris}</p>;

  switch (b.tur) {
    case 'adimlar':
      return (
        <>
          <Baslik>{b.baslik}</Baslik>
          {giris}
          <div className="mt-12 grid gap-12 lg:grid-cols-[5fr_7fr]">
            <ol className="space-y-9">
              {maddeler.map((m, i) => (
                <li key={i} className="grid grid-cols-[2.5rem_1fr] gap-x-3">
                  <span className="rwc-display text-4xl leading-none text-(--rwc-red)" aria-hidden>
                    {i + 1}
                  </span>
                  <div>
                    {m.etiket && <div className="text-sm font-semibold text-(--rwc-muted)">{m.etiket}</div>}
                    <h3 className="rwc-display mt-0.5 text-2xl">{m.ad}</h3>
                    <p className="mt-2 leading-relaxed text-(--rwc-muted)">{m.metin}</p>
                  </div>
                </li>
              ))}
            </ol>
            <EkranGorseli ekran={ekran} alt={a.gorselAlt} not={b.not} />
          </div>
        </>
      );

    case 'sure': {
      const { sureHedef: hedef, sureEnAz: enAz, sureEnCok: enCok } = landing;
      const olcekVar = !!hedef && !!enAz && !!enCok && enCok >= enAz;
      return (
        <div className={cn('grid gap-12', olcekVar && 'lg:grid-cols-2 lg:items-center')}>
          <div>
            <Baslik>{b.baslik}</Baslik>
            {giris}
          </div>
          <div>
            {olcekVar && <SureOlcegi hedef={hedef} enAz={enAz} enCok={enCok} a={a} />}
            <ul className="mt-8 space-y-2 border-t border-(--rwc-line) pt-6 leading-relaxed">
              {maddeler.map((m, i) => (
                <li key={i} className={i === 0 ? 'font-semibold' : 'text-(--rwc-muted)'}>
                  {m.metin}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    case 'teslim':
      return (
        <div className="grid gap-10 lg:grid-cols-[4fr_8fr]">
          <div>
            <Baslik>{b.baslik}</Baslik>
            {giris}
          </div>
          <ul className="border-b border-(--rwc-line)">
            {maddeler.map((m, i) => (
              <li key={i} className="grid gap-x-6 gap-y-1 border-t border-(--rwc-line) py-4 sm:grid-cols-[13rem_1fr]">
                <div>
                  <div className="rwc-display text-xl">{m.ad}</div>
                  {m.etiket && <div className="rwc-file text-xs text-(--rwc-muted)">{m.etiket}</div>}
                </div>
                <p className="leading-relaxed text-(--rwc-muted)">{m.metin}</p>
              </li>
            ))}
          </ul>
        </div>
      );

    case 'ozellikler':
      return (
        <>
          <Baslik>{b.baslik}</Baslik>
          {giris}
          <dl className="mt-12 grid gap-x-12 gap-y-9 md:grid-cols-2">
            {maddeler.map((m, i) => (
              <div key={i} className="border-l-2 border-(--rwc-red) pl-5">
                <dt className="rwc-display text-2xl">{m.ad}</dt>
                <dd className="mt-2 leading-relaxed text-(--rwc-muted)">{m.metin}</dd>
              </div>
            ))}
          </dl>
        </>
      );

    case 'paketler': {
      const satirlar = landing.paketSatirlari ?? [];
      return (
        <>
          <Baslik>{b.baslik}</Baslik>
          {giris}
          {satirlar.length > 0 && (
            <table className="mt-10 w-full border-collapse text-left">
              <thead>
                <tr className="rwc-display text-2xl">
                  <th scope="col" className="py-3 pr-3 font-bold">
                    <span className="sr-only">{a.ozellik}</span>
                  </th>
                  <th scope="col" className="w-[24%] px-2 py-3 text-center font-bold sm:w-44">Starter</th>
                  <th scope="col" className="w-[24%] px-2 py-3 text-center font-bold text-(--rwc-red) sm:w-44">Studio</th>
                </tr>
              </thead>
              <tbody>
                {satirlar.map((s, i) => (
                  <tr key={i} className="border-t border-(--rwc-line)">
                    <th scope="row" className="py-3.5 pr-3 font-normal">{s.ozellik}</th>
                    <td className="px-2 py-3.5 text-center"><Hucre deger={paketHucresi(s.starter)} t={a} /></td>
                    <td className="px-2 py-3.5 text-center"><Hucre deger={paketHucresi(s.studio)} t={a} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {maddeler.length > 0 && (
            <div className="mt-10 grid gap-8 border-t border-(--rwc-line) pt-8 md:grid-cols-2">
              {maddeler.map((m, i) => (
                <div key={i}>
                  <h3 className="rwc-display text-2xl">{m.ad}</h3>
                  <p className="mt-2 leading-relaxed text-(--rwc-muted)">{m.metin}</p>
                </div>
              ))}
            </div>
          )}
        </>
      );
    }

    case 'platformlar':
      return (
        <>
          <Baslik>{b.baslik}</Baslik>
          {giris}
          <ul className="mt-12 grid gap-10 md:grid-cols-3">
            {maddeler.map((m, i) => (
              <li key={i}>
                <div className="rwc-display text-4xl">{m.ad}</div>
                <p className="mt-3 leading-relaxed text-(--rwc-muted)">{m.metin}</p>
              </li>
            ))}
          </ul>
          {b.not && (
            <p className="mt-10 max-w-3xl border-t border-(--rwc-line) pt-6 leading-relaxed text-(--rwc-muted)">{b.not}</p>
          )}
        </>
      );

    case 'gizlilik':
      return (
        <div className="grid gap-10 lg:grid-cols-[4fr_8fr]">
          <div>
            <Baslik>{b.baslik}</Baslik>
            {giris}
          </div>
          <dl className="grid gap-x-10 gap-y-9 sm:grid-cols-2">
            {maddeler.map((m, i) => (
              <div key={i}>
                <dt className="rwc-display text-2xl">{m.ad}</dt>
                <dd className="mt-2 leading-relaxed text-(--rwc-muted)">{m.metin}</dd>
              </div>
            ))}
          </dl>
        </div>
      );

    default:
      return null;
  }
}

// ── Sayfa ─────────────────────────────────────────────────────────────────────

export default async function RedwallCutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  // Öteki ürünlerle aynı kural: CMS'te yayında değilse liste, sitemap ve detay birlikte kapanır.
  const urun = await urunuOku(locale);
  if (!urun) notFound();

  const { ad, landing } = urun;
  const a = REDWALL_CUT_ARAYUZ[locale];
  const bolumler = landing.bolumler ?? [];
  const cta = landing.cta || a.iletisim;

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://redwall.tr';
  const url = `${SITE_URL}/${locale}${PATH}`;
  const appLd = {
    ...softwareAppJsonLd({ name: ad, description: urun.aciklama, url, category: 'MultimediaApplication' }),
    operatingSystem: 'Windows, macOS, Linux',
  };
  const bcLd = breadcrumbJsonLd([
    { name: a.anaSayfa, url: `${SITE_URL}/${locale}` },
    { name: a.yazilim, url: `${SITE_URL}/${locale}/yazilim` },
    { name: ad, url },
  ]);
  const ilkBolum = bolumler.find((b) => b.tur !== 'kapanis');

  return (
    <div className={cn('rwc', display.variable)}>
      <JsonLd data={appLd} />
      <JsonLd data={bcLd} />

      {/* Açılış */}
      <section className="rwc-dark relative overflow-hidden">
        <div className="rwc-dots pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex items-center gap-3">
              <Image src={REDWALL_CUT_LOGO} alt="" width={52} height={52} unoptimized priority />
              <span className="rwc-display text-2xl">{ad}</span>
            </div>
            {landing.durum && <p className="text-sm text-(--rwc-muted)">{landing.durum}</p>}
          </div>

          <h1 className="rwc-display mt-10 max-w-4xl text-5xl leading-[0.98] sm:text-6xl lg:text-7xl">
            {landing.baslik || urun.slogan}
          </h1>
          {landing.giris && <p className="mt-7 max-w-2xl text-lg leading-relaxed opacity-80">{landing.giris}</p>}

          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
            <AnaDugme href={DEMO}>{cta}</AnaDugme>
            {ilkBolum && (
              <a href="#bolum-1" className="font-semibold underline decoration-(--rwc-red) decoration-2 underline-offset-[6px]">
                {a.nasilCalisir}
              </a>
            )}
          </div>

          <Serit t={a.serit} />
        </div>
      </section>

      {bolumler.map((b, i) =>
        b.tur === 'kapanis' ? (
          <section key={i} className="rwc-dark relative overflow-hidden">
            <div className="rwc-dots pointer-events-none absolute inset-0" aria-hidden />
            <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
              <h2 className="rwc-display max-w-3xl text-5xl leading-[0.98] sm:text-6xl">{b.baslik}</h2>
              {b.giris && <p className="mt-6 max-w-xl text-lg leading-relaxed opacity-80">{b.giris}</p>}
              <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
                <AnaDugme href={DEMO}>{cta}</AnaDugme>
                <Link href="/iletisim" className="font-semibold underline decoration-(--rwc-red) decoration-2 underline-offset-[6px]">
                  {a.iletisim}
                </Link>
              </div>
            </div>
          </section>
        ) : (
          // Zeminler sırayla değişir: kâğıt, panel, kâğıt…
          <Bolum
            key={i}
            id={`bolum-${i + 1}`}
            className={cn('scroll-mt-16', i === 0 && 'border-t-0', i % 2 === 1 && 'bg-(--rwc-panel)')}
          >
            <BolumIcerigi b={b} landing={landing} ekran={urun.ekran} a={a} />
          </Bolum>
        ),
      )}
    </div>
  );
}
