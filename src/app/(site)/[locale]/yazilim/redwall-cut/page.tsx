import type { CSSProperties } from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Barlow_Condensed } from 'next/font/google';
import type { Metadata } from 'next';

import { Link } from '@/i18n/navigation';
import { isLocale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { getProduct } from '@/lib/cms/queries';
import { JsonLd } from '@/components/seo/JsonLd';
import { softwareAppJsonLd, breadcrumbJsonLd } from '@/lib/jsonLd';
import { cn } from '@/lib/utils';
import {
  REDWALL_CUT_ICERIK,
  REDWALL_CUT_KART,
  REDWALL_CUT_LOGO,
  REDWALL_CUT_SLUG,
  type RedwallCutIcerik,
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc = isLocale(locale) ? locale : 'tr';
  const { meta } = REDWALL_CUT_ICERIK[loc];
  return buildMetadata({ baslik: meta.baslik, aciklama: meta.aciklama, locale: loc, path: PATH });
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

function Serit({ t }: { t: RedwallCutIcerik['serit'] }) {
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

// ── Süre ölçeği: hedef çizgisi ve ölçülen aralık (0–150 sn) ───────────────────
function SureOlcegi({ t }: { t: RedwallCutIcerik['sure']['eksen'] }) {
  const yuzde = (sn: number) => `${(sn / 150) * 100}%`;
  return (
    <div className="pt-8" role="img" aria-label={`${t.hedef}; ${t.olculen}`}>
      <div className="relative h-14">
        <div className="absolute inset-x-0 top-1/2 h-px bg-(--rwc-line)" />
        <div
          className="absolute top-1/2 h-5 -translate-y-1/2 rounded-sm bg-(--rwc-paper) opacity-80"
          style={{ left: yuzde(113), width: yuzde(137 - 113) }}
        />
        <div className="absolute inset-y-0 w-0.5 bg-(--rwc-red)" style={{ left: yuzde(120) }} />
        <div
          className="absolute -top-7 -translate-x-full whitespace-nowrap pr-2 text-sm font-semibold text-(--rwc-red)"
          style={{ left: yuzde(120) }}
        >
          {t.hedef}
        </div>
      </div>
      <div className="relative h-5 text-xs text-(--rwc-muted)">
        {[0, 30, 60, 90, 120, 150].map((sn) => (
          <span
            key={sn}
            className={cn('absolute', sn === 0 ? '' : sn === 150 ? '-translate-x-full' : '-translate-x-1/2')}
            style={{ left: yuzde(sn) }}
          >
            {sn}
          </span>
        ))}
      </div>
      <div className="mt-2 text-right text-sm font-semibold">{t.olculen}</div>
    </div>
  );
}

function Hucre({ deger, t }: { deger: boolean | string; t: RedwallCutIcerik['paketler'] }) {
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

// ── Sayfa ─────────────────────────────────────────────────────────────────────

export default async function RedwallCutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  // Öteki ürünlerle aynı kural: CMS'te yayında değilse liste, sitemap ve detay birlikte kapanır.
  if (!(await getProduct(REDWALL_CUT_SLUG))) notFound();

  const t = REDWALL_CUT_ICERIK[locale];
  const ad = REDWALL_CUT_KART.ad;

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://redwall.tr';
  const url = `${SITE_URL}/${locale}${PATH}`;
  const appLd = {
    ...softwareAppJsonLd({ name: ad, description: t.meta.aciklama, url, category: 'MultimediaApplication' }),
    operatingSystem: 'Windows, macOS, Linux',
  };
  const bcLd = breadcrumbJsonLd([
    { name: t.kirinti.anaSayfa, url: `${SITE_URL}/${locale}` },
    { name: t.kirinti.yazilim, url: `${SITE_URL}/${locale}/yazilim` },
    { name: ad, url },
  ]);

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
            <p className="text-sm text-(--rwc-muted)">{t.hero.durum}</p>
          </div>

          <h1 className="rwc-display mt-10 max-w-4xl text-5xl leading-[0.98] sm:text-6xl lg:text-7xl">
            {t.hero.baslik}
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed opacity-80">{t.hero.giris}</p>

          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
            <AnaDugme href={DEMO}>{t.hero.cta}</AnaDugme>
            <a href="#nasil-calisir" className="font-semibold underline decoration-(--rwc-red) decoration-2 underline-offset-[6px]">
              {t.hero.ikincil}
            </a>
          </div>

          <Serit t={t.serit} />
        </div>
      </section>

      {/* Nasıl çalışır */}
      <Bolum id="nasil-calisir" className="scroll-mt-16 border-t-0">
        <Baslik>{t.adimlar.baslik}</Baslik>
        <div className="mt-12 grid gap-12 lg:grid-cols-[5fr_7fr]">
          <ol className="space-y-9">
            {t.adimlar.liste.map((adim, i) => (
              <li key={adim.ad} className="grid grid-cols-[2.5rem_1fr] gap-x-3">
                <span className="rwc-display text-4xl leading-none text-(--rwc-red)" aria-hidden>
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-semibold text-(--rwc-muted)">{adim.ad}</div>
                  <h3 className="rwc-display mt-0.5 text-2xl">{adim.baslik}</h3>
                  <p className="mt-2 leading-relaxed text-(--rwc-muted)">{adim.metin}</p>
                </div>
              </li>
            ))}
          </ol>
          <figure className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-xl border border-(--rwc-line) shadow-xl">
              <Image
                src="/images/redwall-cut/arayuz-acik.png"
                alt={t.adimlar.gorselAlt}
                width={1400}
                height={820}
                sizes="(min-width: 1024px) 640px, 100vw"
                className="block h-auto w-full dark:hidden"
              />
              <Image
                src="/images/redwall-cut/arayuz-koyu.png"
                alt={t.adimlar.gorselAlt}
                width={1400}
                height={820}
                sizes="(min-width: 1024px) 640px, 100vw"
                className="hidden h-auto w-full dark:block"
              />
            </div>
            <figcaption className="mt-3 text-sm text-(--rwc-muted)">{t.adimlar.gorselNot}</figcaption>
          </figure>
        </div>
      </Bolum>

      {/* Süre: hedef ve ölçüm */}
      <Bolum className="bg-(--rwc-panel)">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <Baslik>{t.sure.baslik}</Baslik>
            <p className="mt-5 max-w-xl leading-relaxed text-(--rwc-muted)">{t.sure.metin}</p>
          </div>
          <div>
            <SureOlcegi t={t.sure.eksen} />
            <ul className="mt-8 space-y-2 border-t border-(--rwc-line) pt-6 leading-relaxed">
              <li className="font-semibold">{t.sure.olcum}</li>
              <li className="text-(--rwc-muted)">{t.sure.cikti}</li>
              <li className="text-(--rwc-muted)">{t.sure.sinir}</li>
            </ul>
          </div>
        </div>
      </Bolum>

      {/* Teslim klasörü */}
      <Bolum>
        <div className="grid gap-10 lg:grid-cols-[4fr_8fr]">
          <div>
            <Baslik>{t.teslim.baslik}</Baslik>
            <p className="mt-5 leading-relaxed text-(--rwc-muted)">{t.teslim.giris}</p>
          </div>
          <ul className="border-b border-(--rwc-line)">
            {t.teslim.liste.map((d) => (
              <li
                key={d.ad}
                className="grid gap-x-6 gap-y-1 border-t border-(--rwc-line) py-4 sm:grid-cols-[13rem_1fr]"
              >
                <div>
                  <div className="rwc-display text-xl">{d.ad}</div>
                  <div className="rwc-file text-xs text-(--rwc-muted)">{d.dosya}</div>
                </div>
                <p className="leading-relaxed text-(--rwc-muted)">{d.metin}</p>
              </li>
            ))}
          </ul>
        </div>
      </Bolum>

      {/* Öne çıkan özellikler */}
      <Bolum className="bg-(--rwc-panel)">
        <Baslik>{t.ozellikler.baslik}</Baslik>
        <dl className="mt-12 grid gap-x-12 gap-y-9 md:grid-cols-2">
          {t.ozellikler.liste.map((o) => (
            <div key={o.ad} className="border-l-2 border-(--rwc-red) pl-5">
              <dt className="rwc-display text-2xl">{o.ad}</dt>
              <dd className="mt-2 leading-relaxed text-(--rwc-muted)">{o.metin}</dd>
            </div>
          ))}
        </dl>
      </Bolum>

      {/* Paketler */}
      <Bolum>
        <Baslik>{t.paketler.baslik}</Baslik>
        <p className="mt-5 max-w-2xl leading-relaxed text-(--rwc-muted)">{t.paketler.giris}</p>
        <table className="mt-10 w-full border-collapse text-left">
          <thead>
            <tr className="rwc-display text-2xl">
              <th scope="col" className="py-3 pr-3 font-bold">
                <span className="sr-only">{t.paketler.ozellikSutunu}</span>
              </th>
              <th scope="col" className="w-[24%] px-2 py-3 text-center font-bold sm:w-44">Starter</th>
              <th scope="col" className="w-[24%] px-2 py-3 text-center font-bold text-(--rwc-red) sm:w-44">Studio</th>
            </tr>
          </thead>
          <tbody>
            {t.paketler.satirlar.map((s) => (
              <tr key={s.ad} className="border-t border-(--rwc-line)">
                <th scope="row" className="py-3.5 pr-3 font-normal">{s.ad}</th>
                <td className="px-2 py-3.5 text-center"><Hucre deger={s.starter} t={t.paketler} /></td>
                <td className="px-2 py-3.5 text-center"><Hucre deger={s.studio} t={t.paketler} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-10 grid gap-8 border-t border-(--rwc-line) pt-8 md:grid-cols-2">
          {[t.paketler.deneme, t.paketler.fiyat].map((n) => (
            <div key={n.baslik}>
              <h3 className="rwc-display text-2xl">{n.baslik}</h3>
              <p className="mt-2 leading-relaxed text-(--rwc-muted)">{n.metin}</p>
            </div>
          ))}
        </div>
      </Bolum>

      {/* Platformlar */}
      <Bolum className="bg-(--rwc-panel)">
        <Baslik>{t.platformlar.baslik}</Baslik>
        <ul className="mt-12 grid gap-10 md:grid-cols-3">
          {t.platformlar.liste.map((p) => (
            <li key={p.ad}>
              <div className="rwc-display text-4xl">{p.ad}</div>
              <p className="mt-3 leading-relaxed text-(--rwc-muted)">{p.metin}</p>
            </li>
          ))}
        </ul>
        <p className="mt-10 max-w-3xl border-t border-(--rwc-line) pt-6 leading-relaxed text-(--rwc-muted)">
          {t.platformlar.not}
        </p>
      </Bolum>

      {/* KVKK / gizlilik */}
      <Bolum>
        <div className="grid gap-10 lg:grid-cols-[4fr_8fr]">
          <div>
            <Baslik>{t.gizlilik.baslik}</Baslik>
            <p className="mt-5 leading-relaxed text-(--rwc-muted)">{t.gizlilik.giris}</p>
          </div>
          <dl className="grid gap-x-10 gap-y-9 sm:grid-cols-2">
            {t.gizlilik.liste.map((g) => (
              <div key={g.ad}>
                <dt className="rwc-display text-2xl">{g.ad}</dt>
                <dd className="mt-2 leading-relaxed text-(--rwc-muted)">{g.metin}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Bolum>

      {/* Kapanış çağrısı */}
      <section className="rwc-dark relative overflow-hidden">
        <div className="rwc-dots pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <h2 className="rwc-display max-w-3xl text-5xl leading-[0.98] sm:text-6xl">{t.kapanis.baslik}</h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed opacity-80">{t.kapanis.metin}</p>
          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
            <AnaDugme href={DEMO}>{t.kapanis.cta}</AnaDugme>
            <Link href="/iletisim" className="font-semibold underline decoration-(--rwc-red) decoration-2 underline-offset-[6px]">
              {t.kapanis.ikincil}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
