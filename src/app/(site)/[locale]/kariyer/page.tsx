import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { getJobs } from '@/lib/cms/queries';
import { isLocale, pick, type Locale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { Section, Cta, Button } from '@/components/ui';
import { PageHero } from '@/components/sections/PageHero';
import { IntroLead } from '@/components/sections/page-blocks';
import { ServiceIcon } from '@/components/ui/icons';
import { ACCENT } from '@/lib/theme';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Job {
  slug: string;
  baslik: {
    tr: string;
    en: string;
  };
  lokasyon: string;
  tip: string;
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = !isLocale(locale) || locale === 'tr';
  const loc = isTr ? ('tr' as const) : ('en' as const);

  const baslik = isTr ? 'Kariyer Fırsatları — Redwall Yangın Güvenliği Ailesi' : 'Careers at Redwall — Join Our Fire Safety Team';
  const aciklama = isTr
    ? 'Redwall ailesinin bir parçası olmak için yangın güvenliği, mühendislik ve yazılım alanlarındaki açık pozisyonlarımızı keşfedin, hemen başvurun.'
    : 'Explore our open positions in fire safety, engineering, and software, and join the Redwall team to build your career with us today.';

  return buildMetadata({ baslik, aciklama, locale: loc, path: '/kariyer' });
}

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return [{ locale: 'tr' }, { locale: 'en' }];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function KariyerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const loc: Locale = locale;
  const jobs = (await getJobs()) as unknown as Job[];

  // Page heading
  const heading = loc === 'tr' ? 'Kariyer' : 'Careers';
  const description =
    loc === 'tr'
      ? 'Redwall ailesine katıl, yazılım, danışmanlık ve mühendislik alanında yeni fırsatları keşfet.'
      : 'Join the Redwall team and discover new opportunities in software, consulting, and engineering.';

  // Intro section
  const introParagraphs = loc === 'tr'
    ? [
        'Redwall\'da çok disiplinli bir ekip olarak çalışıyoruz. Yazılım geliştirme, saha mühendisliği ve danışmanlık hizmetlerimiz, müşterilerimizin karmaşık sorunlarına bütünsel çözümler sunmaktadır.',
        'Ekibimize katılan her profesyonel, kendini geliştirme fırsatları bulacak, gerçek projelerde etkili rol oynayacak ve Redwall\'ın başarı hikâyesinin bir parçası olacaktır.',
      ]
    : [
        'At Redwall, we work as a multidisciplinary team. Our software development, field engineering, and consulting services deliver comprehensive solutions to our clients\' complex challenges.',
        'Every professional joining our team will find opportunities to grow, take on meaningful roles in real-world projects, and become part of Redwall\'s success story.',
      ];

  // Empty state message
  const emptyLabel =
    loc === 'tr'
      ? 'Şu anda açık pozisyonumuz bulunmuyor.'
      : 'We have no open positions right now.';

  const emptyInvite =
    loc === 'tr'
      ? 'Ancak, CV\'nizi gönderebilir ve henüz duyurulanmamış pozisyonlar için değerlendirilme talebinde bulunabilirsiniz.'
      : 'However, you can send your CV and request to be considered for positions not yet announced.';

  // CTA section
  const ctaBaslik =
    loc === 'tr'
      ? 'CV\'nizi gönderin'
      : 'Send Your CV';

  const ctaAciklama =
    loc === 'tr'
      ? 'Açık pozisyon olmasa da, CV\'nizi bize gönderebilirsiniz. Uygun bir pozisyon ortaya çıktığında, sizinle iletişime geçeceğiz.'
      : 'Even when no positions are open, you can send us your CV. We\'ll reach out when a suitable opportunity arises.';

  const ctaButon =
    loc === 'tr' ? 'Başvur' : 'Apply';

  const chips = loc === 'tr'
    ? ['Yazılım', 'Saha', 'Mühendislik']
    : ['Software', 'Field', 'Engineering'];

  return (
    <>
      <PageHero
        eyebrow={loc === 'tr' ? 'Kariyer' : 'Careers'}
        title={heading}
        description={description}
        accent={ACCENT}
        chips={chips}
        glyph={<ServiceIcon name="hard-hat" className="h-[26rem] w-[26rem]" />}
      />

      {/* Intro section */}
      <Section tone="muted">
        <IntroLead
          lead={introParagraphs[0]}
          body={introParagraphs.slice(1)}
          accent={ACCENT}
        />
      </Section>

      {/* Positions section */}
      <Section>
        <h2 className="mb-8 font-display text-2xl font-bold sm:text-3xl">
          {loc === 'tr' ? 'Açık Pozisyonlar' : 'Open Positions'}
        </h2>

        {jobs.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {jobs.map((job) => {
              const jobTitle = pick(job.baslik, loc) ?? job.baslik.en;
              return (
                <div
                  key={job.slug}
                  className="flex flex-col justify-between rounded-xl border border-border bg-surface p-6"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{jobTitle}</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                        {job.lokasyon}
                      </span>
                      <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                        {job.tip}
                      </span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button href="/iletisim" variant="secondary" className="w-full">
                      {loc === 'tr' ? 'Başvur' : 'Apply'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface p-12 text-center">
            <p className="text-lg text-foreground">{emptyLabel}</p>
            <p className="mt-2 text-base text-muted">{emptyInvite}</p>
          </div>
        )}
      </Section>

      {/* CTA section */}
      <Cta
        baslik={ctaBaslik}
        aciklama={ctaAciklama}
        buton={{ etiket: ctaButon, href: '/iletisim' }}
      />
    </>
  );
}
