/**
 * Idempotent seed script — Payload 3.85.1
 *
 * Usage:  npm run payload:seed
 *
 * Creates:
 *  • First admin user (users collection)
 *  • Globals: siteSettings, navigation, homePage (TR + EN locales)
 *  • Collections: service (3 × isKolu), product (2), referans (2),
 *    page (2), faq (2), post (1), job (1), project (2)
 *
 * Idempotency strategy: `find` by stable key (slug / isKolu / email)
 * before each create; skip if already exists.
 *
 * Localization: create with locale:'tr', then update with locale:'en'.
 */

import { config as dotenvConfig } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
// Load .env.local first (Next.js convention), then fall back to .env
dotenvConfig({ path: resolve(__dirname, '../../.env.local') })
dotenvConfig({ path: resolve(__dirname, '../../.env') })

// Dynamic imports so env vars are set BEFORE payload.config.ts executes
const { default: config } = await import('../../payload.config')
const { getPayload } = await import('payload')

// ── helpers ──────────────────────────────────────────────────────────────────

async function main() {
  const payload = await getPayload({ config })

  console.log('🌱  Payload seed başlıyor…')

  // ── 1. Admin user ─────────────────────────────────────────────────────────

  // GÜVENLİK: Üretimde varsayılan admin kimlik bilgisi ASLA kullanılmaz.
  // Env verilmezse seed başarısız olur (aksi halde herkesçe bilinen bir
  // admin@redwall.tr / redwall-dev-admin hesabı oluşur — kritik açık).
  if (
    process.env.NODE_ENV === 'production' &&
    (!process.env.PAYLOAD_SEED_ADMIN_EMAIL || !process.env.PAYLOAD_SEED_ADMIN_PASSWORD)
  ) {
    throw new Error(
      'Üretimde admin seed için PAYLOAD_SEED_ADMIN_EMAIL ve PAYLOAD_SEED_ADMIN_PASSWORD zorunludur.',
    )
  }
  const adminEmail =
    process.env.PAYLOAD_SEED_ADMIN_EMAIL ?? 'admin@redwall.tr'
  const adminPassword =
    process.env.PAYLOAD_SEED_ADMIN_PASSWORD ?? 'redwall-dev-admin'

  const existingUsers = await payload.find({
    collection: 'users',
    limit: 1,
    overrideAccess: true,
  })

  if (existingUsers.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      data: { email: adminEmail, password: adminPassword },
      overrideAccess: true,
    })
    console.log(`  ✓ Admin kullanıcı oluşturuldu: ${adminEmail}`)
  } else {
    console.log(`  – Admin kullanıcı zaten var (${existingUsers.docs[0].email}), atlandı.`)
  }

  // ── 2. Globals ────────────────────────────────────────────────────────────

  // 2a. siteSettings — TR
  await payload.updateGlobal({
    slug: 'siteSettings',
    locale: 'tr',
    data: {
      sirketAdi:
        'Redwall Yangın Danışmanlık Yazılım ve Mühendislik Hizmetleri Limited Şirketi',
      iletisim: {
        tel: '+90 212 000 00 00',
        email: 'info@redwall.tr',
        adres:
          'Mecidiyeköy Mahallesi, Büyükdere Caddesi No:52, Kat:8, 34387 Şişli / İstanbul',
      },
      sosyal: {
        linkedin: 'https://www.linkedin.com/company/redwall-yangin',
        instagram: 'https://www.instagram.com/redwallyangin',
        youtube: 'https://www.youtube.com/@redwallyangin',
      },
      calismaSaatleri: 'Pazartesi–Cuma: 09:00–18:00',
      istatistikler: [
        { deger: '20+', etiket: 'Yıl Tecrübe' },
        { deger: '500+', etiket: 'Tamamlanan Proje' },
        { deger: '200+', etiket: 'Kurumsal Müşteri' },
        { deger: '3', etiket: 'İş Kolu' },
      ],
      seo: {
        baslik: 'Redwall — Yangın Güvenliği, Yazılım ve Mühendislik',
        aciklama:
          'Redwall; yangın danışmanlığı, mühendislik uygulamaları ve özgün yazılımlarıyla Türkiye\'nin önde gelen yangın güvenliği şirketidir.',
      },
    },
    overrideAccess: true,
  })
  // 2a. siteSettings — EN (localized fields only)
  await payload.updateGlobal({
    slug: 'siteSettings',
    locale: 'en',
    data: {
      iletisim: {
        adres:
          'Mecidiyeköy Quarter, Büyükdere Street No:52, Floor:8, 34387 Şişli / Istanbul, Turkey',
      },
      calismaSaatleri: 'Monday–Friday: 09:00–18:00',
      istatistikler: [
        { deger: '20+', etiket: 'Years of Experience' },
        { deger: '500+', etiket: 'Completed Projects' },
        { deger: '200+', etiket: 'Corporate Clients' },
        { deger: '3', etiket: 'Business Lines' },
      ],
      seo: {
        baslik: 'Redwall — Fire Safety, Software & Engineering',
        aciklama:
          'Redwall is Turkey\'s leading fire safety company offering fire consulting, engineering applications, and proprietary engineering software.',
      },
    },
    overrideAccess: true,
  })
  console.log('  ✓ siteSettings güncellendi')

  // 2b. navigation — TR
  await payload.updateGlobal({
    slug: 'navigation',
    locale: 'tr',
    data: {
      headerLinks: [
        {
          etiket: 'Hizmetler',
          href: '/hizmetler',
          alt: [
            { etiket: 'Yazılım', href: '/yazilim' },
            { etiket: 'Danışmanlık', href: '/danismanlik' },
            { etiket: 'Mühendislik', href: '/muhendislik' },
          ],
        },
        {
          etiket: 'Ürünler',
          href: '/urunler',
          alt: [
            { etiket: 'YangınPro', href: '/urunler/yanginpro' },
            { etiket: 'MekanikPro', href: '/urunler/mekanikpro' },
          ],
        },
        { etiket: 'Projeler', href: '/projeler', alt: [] },
        { etiket: 'Referanslar', href: '/referanslar', alt: [] },
        { etiket: 'Blog', href: '/blog', alt: [] },
        { etiket: 'Hakkımızda', href: '/hakkimizda', alt: [] },
        { etiket: 'İletişim', href: '/iletisim', alt: [] },
      ],
      footerKolonlari: [
        {
          baslik: 'Hizmetler',
          linkler: [
            { etiket: 'Yazılım', href: '/yazilim' },
            { etiket: 'Danışmanlık', href: '/danismanlik' },
            { etiket: 'Mühendislik', href: '/muhendislik' },
          ],
        },
        {
          baslik: 'Şirket',
          linkler: [
            { etiket: 'Hakkımızda', href: '/hakkimizda' },
            { etiket: 'Kariyer', href: '/kariyer' },
            { etiket: 'İletişim', href: '/iletisim' },
          ],
        },
        {
          baslik: 'Hukuki',
          linkler: [
            { etiket: 'Gizlilik Politikası', href: '/gizlilik' },
            { etiket: 'Kullanım Koşulları', href: '/kullanim-kosullari' },
          ],
        },
      ],
    },
    overrideAccess: true,
  })
  // 2b. navigation — EN
  await payload.updateGlobal({
    slug: 'navigation',
    locale: 'en',
    data: {
      headerLinks: [
        {
          etiket: 'Services',
          href: '/hizmetler',
          alt: [
            { etiket: 'Software', href: '/yazilim' },
            { etiket: 'Consulting', href: '/danismanlik' },
            { etiket: 'Engineering', href: '/muhendislik' },
          ],
        },
        {
          etiket: 'Products',
          href: '/urunler',
          alt: [
            { etiket: 'YangınPro', href: '/urunler/yanginpro' },
            { etiket: 'MekanikPro', href: '/urunler/mekanikpro' },
          ],
        },
        { etiket: 'Projects', href: '/projeler', alt: [] },
        { etiket: 'References', href: '/referanslar', alt: [] },
        { etiket: 'Blog', href: '/blog', alt: [] },
        { etiket: 'About', href: '/hakkimizda', alt: [] },
        { etiket: 'Contact', href: '/iletisim', alt: [] },
      ],
      footerKolonlari: [
        {
          baslik: 'Services',
          linkler: [
            { etiket: 'Software', href: '/yazilim' },
            { etiket: 'Consulting', href: '/danismanlik' },
            { etiket: 'Engineering', href: '/muhendislik' },
          ],
        },
        {
          baslik: 'Company',
          linkler: [
            { etiket: 'About Us', href: '/hakkimizda' },
            { etiket: 'Careers', href: '/kariyer' },
            { etiket: 'Contact', href: '/iletisim' },
          ],
        },
        {
          baslik: 'Legal',
          linkler: [
            { etiket: 'Privacy Policy', href: '/gizlilik' },
            { etiket: 'Terms of Use', href: '/kullanim-kosullari' },
          ],
        },
      ],
    },
    overrideAccess: true,
  })
  console.log('  ✓ navigation güncellendi')

  // 2c. homePage — TR
  await payload.updateGlobal({
    slug: 'homePage',
    locale: 'tr',
    data: {
      heroBaslik:
        'Yangın güvenliğinde 360° yaklaşım: Yazılım, Danışmanlık, Mühendislik.',
      heroAltMetin:
        'Redwall; kendi geliştirdiği yazılımlar, itfaiye uyumlu danışmanlık ve anahtar teslim mühendislik hizmetleriyle yangın güvenliğinin her adımında yanınızda.',
      heroBirincilCta: { etiket: 'Teklif İste', href: '/teklif' },
      heroIkincilCta: { etiket: 'Yazılımı İncele', href: '/yazilim' },
    },
    overrideAccess: true,
  })
  // 2c. homePage — EN
  await payload.updateGlobal({
    slug: 'homePage',
    locale: 'en',
    data: {
      heroBaslik:
        'A 360° approach to fire safety: Software, Consulting, Engineering.',
      heroAltMetin:
        'Redwall covers every step of fire safety — proprietary software, fire-department-compliant consulting, and turnkey engineering services.',
      heroBirincilCta: { etiket: 'Get a Quote', href: '/teklif' },
      heroIkincilCta: { etiket: 'Explore Software', href: '/yazilim' },
    },
    overrideAccess: true,
  })
  console.log('  ✓ homePage güncellendi')

  // ── 3. Collections ────────────────────────────────────────────────────────

  // 3a. service — 3 records (unique per isKolu)
  type ServiceDef = {
    isKolu: 'yazilim' | 'danismanlik' | 'muhendislik'
    tr: { baslik: string; ozet: string }
    en: { baslik: string; ozet: string }
    sira: number
  }

  const services: ServiceDef[] = [
    {
      isKolu: 'yazilim',
      tr: {
        baslik: 'Yazılım',
        ozet:
          'YangınPro & MekanikPro — fikri mülkiyeti Redwall\'a ait, bulut tabanlı mühendislik yazılımları.',
      },
      en: {
        baslik: 'Software',
        ozet:
          'YangınPro & MekanikPro — cloud-based engineering software owned by Redwall.',
      },
      sira: 1,
    },
    {
      isKolu: 'danismanlik',
      tr: {
        baslik: 'Yangın Güvenliği Danışmanlığı',
        ozet:
          'Kamu kurumlarından bina yönetimlerine, mal sahiplerinden müteahhitlere; mevzuata uygunluk, olumsuz itfaiye raporlarının olumluya çevrilmesi, doğru projelendirme ve uçtan uca süreç yönetiminde uzman desteği sunuyoruz.',
      },
      en: {
        baslik: 'Fire Safety Consulting',
        ozet:
          'From public institutions to building managements, property owners to contractors — expert support on regulatory compliance, turning negative fire-department reports positive, sound project design, and end-to-end process management.',
      },
      sira: 2,
    },
    {
      isKolu: 'muhendislik',
      tr: {
        baslik: 'Mühendislik & Uygulama',
        ozet:
          'Yangın söndürme, alarm ve kaçış sistemlerinin anahtar teslim tasarım ve uygulaması.',
      },
      en: {
        baslik: 'Engineering & Application',
        ozet:
          'Turnkey design and installation of fire suppression, alarm, and evacuation systems.',
      },
      sira: 3,
    },
  ]

  for (const s of services) {
    const existing = await payload.find({
      collection: 'service',
      where: { isKolu: { equals: s.isKolu } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.totalDocs > 0) {
      console.log(`  – service[${s.isKolu}] zaten var, atlandı.`)
      continue
    }
    const doc = await payload.create({
      collection: 'service',
      locale: 'tr',
      data: {
        isKolu: s.isKolu,
        baslik: s.tr.baslik,
        ozet: s.tr.ozet,
        sira: s.sira,
      },
      overrideAccess: true,
    })
    await payload.update({
      collection: 'service',
      id: doc.id,
      locale: 'en',
      data: { baslik: s.en.baslik, ozet: s.en.ozet },
      overrideAccess: true,
    })
    console.log(`  ✓ service[${s.isKolu}] oluşturuldu`)
  }

  // 3b. product — 2 records (unique slug)
  type ProductDef = {
    slug: string
    ad: string
    tr: { slogan: string; aciklama: string }
    en: { slogan: string; aciklama: string }
    sira: number
  }

  const products: ProductDef[] = [
    {
      slug: 'yanginpro',
      ad: 'YangınPro',
      tr: {
        slogan: 'Bina Yangın Güvenliği Uyumluluğunu Otomatikleştirin',
        aciklama:
          'Yangın güvenliği proje süreçlerini dijitalleştiren bulut tabanlı yazılım platformu.',
      },
      en: {
        slogan: 'Automate Fire Safety Compliance for Buildings',
        aciklama:
          'A cloud-based software platform that digitizes fire safety project workflows.',
      },
      sira: 1,
    },
    {
      slug: 'mekanikpro',
      ad: 'MekanikPro',
      tr: {
        slogan: 'Mekanik Hesapları Otomatikleştirin',
        aciklama:
          'Mekanik tesisat mühendisleri için hidrolik denge ve boru boyutlandırma yazılımı.',
      },
      en: {
        slogan: 'Automate Mechanical Calculations',
        aciklama:
          'Hydraulic balancing and pipe sizing software for mechanical installation engineers.',
      },
      sira: 2,
    },
  ]

  for (const p of products) {
    const existing = await payload.find({
      collection: 'product',
      where: { slug: { equals: p.slug } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.totalDocs > 0) {
      console.log(`  – product[${p.slug}] zaten var, atlandı.`)
      continue
    }
    const doc = await payload.create({
      collection: 'product',
      locale: 'tr',
      data: {
        slug: p.slug,
        ad: p.ad,
        slogan: p.tr.slogan,
        aciklama: p.tr.aciklama,
        sira: p.sira,
      },
      overrideAccess: true,
    })
    await payload.update({
      collection: 'product',
      id: doc.id,
      locale: 'en',
      data: { slogan: p.en.slogan, aciklama: p.en.aciklama },
      overrideAccess: true,
    })
    console.log(`  ✓ product[${p.slug}] oluşturuldu`)
  }

  // 3c. referans — 2 records
  type ReferansDef = {
    ad: string
    anasayfada: boolean
    tr: { gorus: { metin: string; kisi: string; unvan: string } }
    en: { gorus: { metin: string; unvan: string } }
  }

  const referanslar: ReferansDef[] = [
    {
      ad: 'Aksa Enerji Üretim A.Ş.',
      anasayfada: true,
      tr: {
        gorus: {
          metin: 'Redwall\'ın YangınPro yazılımı ekibimizin proje üretim süresini yaklaşık %40 kısalttı.',
          kisi: 'Ahmet Demir',
          unvan: 'Teknik Direktör',
        },
      },
      en: {
        gorus: {
          metin: 'Redwall\'s YangınPro software reduced our team\'s project production time by approximately 40%.',
          unvan: 'Technical Director',
        },
      },
    },
    {
      ad: 'Emlak Konut GYO A.Ş.',
      anasayfada: false,
      tr: {
        gorus: {
          metin: 'Büyük ölçekli konut projelerimizde Redwall\'ın danışmanlık desteği sayesinde itfaiye onaylarını hızla aldık.',
          kisi: 'Zeynep Arslan',
          unvan: 'Proje Koordinatörü',
        },
      },
      en: {
        gorus: {
          metin: 'Thanks to Redwall\'s consulting support on our large-scale residential projects, we obtained fire department approvals swiftly.',
          unvan: 'Project Coordinator',
        },
      },
    },
  ]

  for (const r of referanslar) {
    const existing = await payload.find({
      collection: 'referans',
      where: { ad: { equals: r.ad } },
      limit: 1,
      overrideAccess: true,
    })
    let docId: string | number
    if (existing.totalDocs > 0) {
      docId = existing.docs[0].id
      console.log(`  – referans[${r.ad}] zaten var, EN güncelleniyor.`)
    } else {
      const doc = await payload.create({
        collection: 'referans',
        locale: 'tr',
        data: {
          ad: r.ad,
          anasayfada: r.anasayfada,
          gorus: {
            metin: r.tr.gorus.metin,
            kisi: r.tr.gorus.kisi,
            unvan: r.tr.gorus.unvan,
          },
        },
        overrideAccess: true,
      })
      docId = doc.id
      console.log(`  ✓ referans[${r.ad}] oluşturuldu (TR)`)
    }
    await payload.update({
      collection: 'referans',
      id: docId,
      locale: 'en',
      data: {
        gorus: {
          metin: r.en.gorus.metin,
          unvan: r.en.gorus.unvan,
        },
      },
      overrideAccess: true,
    })
    console.log(`  ✓ referans[${r.ad}] EN locale yazıldı`)
  }

  // 3d. page — 2 records
  type PageDef = {
    slug: string
    tr: { baslik: string; altBaslik: string; girisLead: string }
    en: { baslik: string; altBaslik: string; girisLead: string }
  }

  const pages: PageDef[] = [
    {
      slug: 'hakkimizda',
      tr: {
        baslik: 'Hakkımızda',
        altBaslik:
          'Yangın güvenliğinde 20 yılı aşkın tecrübemizle her projede güvenilir çözüm ortağınız.',
        girisLead:
          'Redwall, Türkiye\'nin önde gelen yangın güvenliği şirketlerinden biridir.',
      },
      en: {
        baslik: 'About Us',
        altBaslik:
          'With over 20 years of expertise in fire safety, we are your reliable partner in every project.',
        girisLead:
          'Redwall is one of Turkey\'s leading fire safety companies.',
      },
    },
    {
      slug: 'vizyon-misyon',
      tr: {
        baslik: 'Vizyon & Misyon',
        altBaslik: 'Yangın güvenliğinde teknolojiyi öncü biçimde kullanan şirket.',
        girisLead: 'Geleceği şekillendiren değerlerimiz.',
      },
      en: {
        baslik: 'Vision & Mission',
        altBaslik: 'A company that pioneering the use of technology in fire safety.',
        girisLead: 'The values that shape our future.',
      },
    },
  ]

  for (const pg of pages) {
    const existing = await payload.find({
      collection: 'page',
      where: { slug: { equals: pg.slug } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.totalDocs > 0) {
      console.log(`  – page[${pg.slug}] zaten var, atlandı.`)
      continue
    }
    const doc = await payload.create({
      collection: 'page',
      locale: 'tr',
      data: {
        slug: pg.slug,
        baslik: pg.tr.baslik,
        altBaslik: pg.tr.altBaslik,
        girisLead: pg.tr.girisLead,
      },
      overrideAccess: true,
    })
    await payload.update({
      collection: 'page',
      id: doc.id,
      locale: 'en',
      data: {
        baslik: pg.en.baslik,
        altBaslik: pg.en.altBaslik,
        girisLead: pg.en.girisLead,
      },
      overrideAccess: true,
    })
    console.log(`  ✓ page[${pg.slug}] oluşturuldu`)
  }

  // 3e. faq — 2 records
  type FaqDef = {
    kategori: 'genel' | 'yazilim' | 'danismanlik' | 'muhendislik'
    tr: { soru: string; cevap: string }
    en: { soru: string; cevap: string }
    sira: number
  }

  const faqs: FaqDef[] = [
    {
      kategori: 'genel',
      tr: {
        soru: 'Redwall hangi sektörlere hizmet veriyor?',
        cevap:
          'Endüstriyel tesisler, AVM\'ler, hastaneler, konut projeleri ve kamu yapıları başta olmak üzere yangın güvenliği gerektiren tüm sektörlere hizmet veriyoruz.',
      },
      en: {
        soru: 'Which sectors does Redwall serve?',
        cevap:
          'We serve all sectors requiring fire safety, primarily industrial facilities, shopping malls, hospitals, residential projects, and public buildings.',
      },
      sira: 1,
    },
    {
      kategori: 'yazilim',
      tr: {
        soru: 'YangınPro\'yu satın almadan önce deneyebilir miyim?',
        cevap:
          'Evet, 14 günlük ücretsiz deneme sürümü için iletişim formundan talep oluşturabilirsiniz.',
      },
      en: {
        soru: 'Can I try YangınPro before purchasing?',
        cevap:
          'Yes, you can request a 14-day free trial through the contact form.',
      },
      sira: 2,
    },
  ]

  for (const faq of faqs) {
    const existing = await payload.find({
      collection: 'faq',
      where: { soru: { equals: faq.tr.soru } },
      locale: 'tr',
      limit: 1,
      overrideAccess: true,
    })
    if (existing.totalDocs > 0) {
      console.log(`  – faq[${faq.tr.soru.slice(0, 30)}…] zaten var, atlandı.`)
      continue
    }
    const doc = await payload.create({
      collection: 'faq',
      locale: 'tr',
      data: {
        kategori: faq.kategori,
        soru: faq.tr.soru,
        cevap: faq.tr.cevap,
        sira: faq.sira,
      },
      overrideAccess: true,
    })
    await payload.update({
      collection: 'faq',
      id: doc.id,
      locale: 'en',
      data: { soru: faq.en.soru, cevap: faq.en.cevap },
      overrideAccess: true,
    })
    console.log(`  ✓ faq oluşturuldu: ${faq.tr.soru.slice(0, 40)}`)
  }

  // 3f. post — 1 record
  const postSlug = '2024-yangin-yonetmeligi-degisiklikleri'
  const existingPost = await payload.find({
    collection: 'post',
    where: { slug: { equals: postSlug } },
    limit: 1,
    overrideAccess: true,
  })
  if (existingPost.totalDocs === 0) {
    const doc = await payload.create({
      collection: 'post',
      locale: 'tr',
      data: {
        slug: postSlug,
        baslik: '2024 Yangın Yönetmeliği Değişiklikleri',
        tarih: new Date('2024-03-15').toISOString(),
        ozet:
          'BYKHY 2024 güncellemesi ile gelen en önemli değişiklikler ve projelerinize etkileri.',
      },
      overrideAccess: true,
    })
    await payload.update({
      collection: 'post',
      id: doc.id,
      locale: 'en',
      data: {
        baslik: '2024 Fire Safety Regulation Changes',
        ozet:
          'The most important changes introduced by the BYKHY 2024 update and their impact on your projects.',
      },
      overrideAccess: true,
    })
    console.log('  ✓ post oluşturuldu')
  } else {
    console.log('  – post zaten var, atlandı.')
  }

  // 3g. job — 1 record
  const jobSlug = 'yangin-muhendisi'
  const existingJob = await payload.find({
    collection: 'job',
    where: { slug: { equals: jobSlug } },
    limit: 1,
    overrideAccess: true,
  })
  if (existingJob.totalDocs === 0) {
    const doc = await payload.create({
      collection: 'job',
      locale: 'tr',
      data: {
        slug: jobSlug,
        baslik: 'Yangın Mühendisi',
        lokasyon: 'İstanbul (Hibrit)',
        tip: 'Tam Zamanlı',
        aktif: true,
      },
      overrideAccess: true,
    })
    await payload.update({
      collection: 'job',
      id: doc.id,
      locale: 'en',
      data: { baslik: 'Fire Engineer' },
      overrideAccess: true,
    })
    console.log('  ✓ job oluşturuldu')
  } else {
    console.log('  – job zaten var, atlandı.')
  }

  // 3h. project — 2 records
  type ProjectDef = {
    slug: string
    isKolu: 'yazilim' | 'danismanlik' | 'muhendislik'
    musteri: string
    il: string
    yil: number
    durum: 'devam-eden' | 'tamamlandi'
    oneCikan: boolean
    tr: { baslik: string; ozet: string; kapsam: string }
    en: { baslik: string; ozet: string; kapsam: string }
  }

  const projects: ProjectDef[] = [
    {
      slug: 'ada-avm-yangin-sistemi',
      isKolu: 'muhendislik',
      musteri: 'Ada Alışveriş Merkezi',
      il: 'İstanbul',
      yil: 2023,
      durum: 'tamamlandi',
      oneCikan: true,
      tr: {
        baslik: 'Ada AVM Yangın Söndürme Sistemi',
        ozet: '45.000 m² AVM için sprinkler ve gazlı söndürme sistemi tasarım ve uygulaması.',
        kapsam: 'Sprinkler, Gazlı Söndürme, Alarm',
      },
      en: {
        baslik: 'Ada Shopping Mall Fire Suppression System',
        ozet: 'Sprinkler and gas-based suppression system design and installation for a 45,000 m² shopping mall.',
        kapsam: 'Sprinkler, Gas Suppression, Alarm',
      },
    },
    {
      slug: 'teknopark-izmir-yanginpro',
      isKolu: 'yazilim',
      musteri: 'İzmir Teknopark A.Ş.',
      il: 'İzmir',
      yil: 2024,
      durum: 'tamamlandi',
      oneCikan: false,
      tr: {
        baslik: 'İzmir Teknopark YangınPro Entegrasyonu',
        ozet: 'YangınPro\'nun teknopark mevzuat süreçleriyle entegrasyonu ve uzaktan izleme modülü.',
        kapsam: 'SaaS Entegrasyon, Uzaktan İzleme',
      },
      en: {
        baslik: 'İzmir Technopark YangınPro Integration',
        ozet: 'Integration of YangınPro with technopark regulatory processes and remote monitoring module.',
        kapsam: 'SaaS Integration, Remote Monitoring',
      },
    },
  ]

  for (const pr of projects) {
    const existing = await payload.find({
      collection: 'project',
      where: { slug: { equals: pr.slug } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.totalDocs > 0) {
      console.log(`  – project[${pr.slug}] zaten var, atlandı.`)
      continue
    }
    const doc = await payload.create({
      collection: 'project',
      locale: 'tr',
      data: {
        slug: pr.slug,
        baslik: pr.tr.baslik,
        musteri: pr.musteri,
        isKolu: pr.isKolu,
        durum: pr.durum,
        yil: pr.yil,
        il: pr.il,
        kapsam: pr.tr.kapsam,
        ozet: pr.tr.ozet,
        oneCikan: pr.oneCikan,
      },
      overrideAccess: true,
    })
    await payload.update({
      collection: 'project',
      id: doc.id,
      locale: 'en',
      data: {
        baslik: pr.en.baslik,
        ozet: pr.en.ozet,
        kapsam: pr.en.kapsam,
      },
      overrideAccess: true,
    })
    console.log(`  ✓ project[${pr.slug}] oluşturuldu`)
  }

  console.log('\n✅  Seed tamamlandı.')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌  Seed hatası:', err)
  process.exit(1)
})
