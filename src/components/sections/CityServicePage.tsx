import { Link } from '@/i18n/navigation';
import { Section, Button } from '@/components/ui';
import { PageHero } from '@/components/sections/PageHero';
import { JsonLd } from '@/components/seo/JsonLd';
import { localBusinessJsonLd, breadcrumbJsonLd, faqPageJsonLd } from '@/lib/jsonLd';
import { ACCENT } from '@/lib/theme';
import type { CityBase, CityService } from '@/lib/city-content';
import { SERVICES } from '@/lib/city-content';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://redwall.tr';

const SERVICE_PATH: Record<CityService, string> = {
  danismanlik: 'yangin-danismanligi',
  sistemleri: 'yangin-sistemleri',
};

/**
 * Şehir-özel hizmet landing sayfası (ör. "Sakarya Yangın Danışmanlığı").
 * Yerel bağlam + risk profili + hizmet kapsamı + ilçe listesi ile özgün içerik;
 * şehir-özel LocalBusiness + breadcrumb JSON-LD.
 */
export default function CityServicePage({
  city,
  service,
}: {
  city: CityBase;
  service: CityService;
}) {
  const svc = SERVICES[service];
  const otherService: CityService = service === 'danismanlik' ? 'sistemleri' : 'danismanlik';
  const otherSvc = SERVICES[otherService];

  const h1 = `${city.il} ${svc.adKisa}`;
  const pagePath = `/${SERVICE_PATH[service]}/${city.slug}`;
  const pageUrl = `${SITE_URL}/tr${pagePath}`;

  // Şehir-özel yapısal veri — bu şehir + ilçeleri areaServed olarak.
  const localLd = localBusinessJsonLd({
    name: `Redwall — ${city.il} ${svc.adKisa}`,
    url: pageUrl,
    description: `${city.il} ve çevresinde ${svc.hizmetEtiketi} hizmetleri: ${svc.kapsam
      .map((k) => k.baslik.toLocaleLowerCase('tr'))
      .join(', ')}.`,
    addressLocality: city.merkez,
    addressRegion: city.il,
    latitude: city.geo.lat,
    longitude: city.geo.lng,
    areaServed: [city.il, ...city.ilceler],
    serviceTypes: [svc.adKisa, `${city.il} ${svc.adKisa}`],
  });

  const crumbLd = breadcrumbJsonLd([
    { name: 'Ana Sayfa', url: `${SITE_URL}/tr` },
    { name: svc.adKisa, url: `${SITE_URL}/tr${svc.anaHizmetHref}` },
    { name: city.il, url: pageUrl },
  ]);

  // Bu hizmet sayfasına özgü şehir SSS'leri — sayfalar arası benzerliği düşürür.
  const sssListesi = city.sss.filter((s) => s.hizmet === service);
  const faqLd = sssListesi.length
    ? faqPageJsonLd(sssListesi.map((s) => ({ question: s.soru, answer: s.cevap })))
    : null;

  return (
    <>
      <JsonLd data={localLd} />
      <JsonLd data={crumbLd} />
      {faqLd && <JsonLd data={faqLd} />}

      <PageHero
        eyebrow={`${city.il} · ${svc.hizmetEtiketi}`}
        title={h1}
        description={`${city.il} ${city.merkez} başta olmak üzere il genelinde profesyonel ${svc.hizmetEtiketi} hizmetleri. Yerel yapı stoğunu, sanayi bölgelerini ve mevzuatı bilen ekiple uçtan uca çözüm.`}
        chips={city.ilceler.slice(0, 6)}
      />

      {/* Yerel bağlam + risk profili — şehre özgü özgün içerik */}
      <Section>
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Neden {city.il}{city.ekDe} {svc.adKisa}?
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted">{city.yerelBaglam}</p>
          <p className="mt-4 text-base leading-relaxed text-muted">{city.riskProfili}</p>

          {city.sanayi.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground/70">
                {city.il}{city.ekDe} öne çıkan üretim & risk odakları
              </h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {city.sanayi.map((s) => (
                  <li
                    key={s}
                    className="rounded-full border border-black/10 bg-surface px-3 py-1 text-sm text-foreground/80"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Section>

      {/* Hizmet kapsamı */}
      <Section tone="muted">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            {city.il}{city.ekDe} {svc.adKisa} kapsamı
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {svc.kapsam.map((k) => (
            <div
              key={k.baslik}
              className="rounded-xl border border-black/10 bg-background p-6"
            >
              <div className="mb-3 h-1 w-10 rounded-full" style={{ backgroundColor: ACCENT }} />
              <h3 className="font-display text-lg font-semibold text-foreground">{k.baslik}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{k.metin}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Hizmet verilen ilçeler — yerel sinyal */}
      <Section>
        <div className="max-w-3xl">
          <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
            {city.il}{city.ekDe} hizmet verdiğimiz ilçeler
          </h2>
          <p className="mt-3 text-sm text-muted">
            {svc.adKisa} hizmetlerimizden {city.il}{city.ekNin} tüm ilçelerinde yararlanabilirsiniz.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {city.ilceler.map((ilce) => (
              <li
                key={ilce}
                className="rounded-md border border-black/10 bg-surface px-2.5 py-1 text-xs text-foreground/75"
              >
                {ilce}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Şehre özgü SSS — özgün içerik + FAQPage JSON-LD kaynağı */}
      {sssListesi.length > 0 && (
        <Section tone="muted">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              {city.il}{city.ekDe} {svc.adKisa} — Sık Sorulan Sorular
            </h2>
            <div className="mt-8 space-y-6">
              {sssListesi.map((s) => (
                <div key={s.soru} className="rounded-xl border border-black/10 bg-background p-6">
                  <h3 className="font-display text-base font-semibold text-foreground">{s.soru}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.cevap}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Çapraz linkler + CTA */}
      <Section tone="dark">
        <div className="flex flex-col items-center gap-6 text-center">
          <h2 className="max-w-2xl font-display text-2xl font-bold text-white sm:text-3xl">
            {city.il}{city.ekDeki} projeniz için teklif alın
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-white/70">
            {city.il} ve çevresindeki yangın güvenliği ihtiyaçlarınızı değerlendirelim, size en uygun
            çözümü sunalım.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button href="/teklif" variant="primary" className="bg-primary text-white hover:bg-primary/90">
              Teklif İste
            </Button>
            <Button href="/iletisim" variant="secondary">
              İletişime Geç
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/60">
            <Link href={`/${SERVICE_PATH[otherService]}/${city.slug}`} className="underline-offset-4 hover:text-white hover:underline">
              {city.il} {otherSvc.adKisa}
            </Link>
            <Link href={svc.anaHizmetHref} className="underline-offset-4 hover:text-white hover:underline">
              {svc.adKisa} (genel)
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
