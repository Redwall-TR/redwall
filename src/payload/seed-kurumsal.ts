/**
 * Idempotent seed script — kurumsal içerik (çözümler / ekip / doküman)
 *
 * Usage:  npm run payload:seed-kurumsal
 *
 * Oluşturur / günceller:
 *  • solution:    kamu-cozumleri, muteahhit-insaat-cozumleri,
 *                 saglik-yapilari, sanayi-enerji  (TR + EN)
 *  • teamMember:  3 placeholder üye (/admin'de gerçekleştirilecek)
 *  • document:    3 placeholder doküman (dosya /admin'de yüklenecek)
 *
 * İdempotentlik: solution slug ile, teamMember `ad` ile, document
 * başlık (tr) ile bulunur; yoksa create (locale:tr), her durumda
 * update (locale:en).
 *
 * NOT: Ekip üyeleri ve dokümanlar PLACEHOLDER'dır; gerçek ad/foto/
 * dosya bilgileri Payload admin panelinden (/admin) doldurulmalıdır.
 */

import { config as dotenvConfig } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenvConfig({ path: resolve(__dirname, '../../.env.local') })
dotenvConfig({ path: resolve(__dirname, '../../.env') })

const { default: config } = await import('../../payload.config')
const { getPayload } = await import('payload')

// ── Lexical helper ──────────────────────────────────────────────────────────

type Block = { h2: string } | { h3: string } | { p: string }

function lexText(text: string) {
  return {
    detail: 0,
    format: 0,
    mode: 'normal' as const,
    style: '',
    text,
    type: 'text',
    version: 1,
  }
}

function lexParagraph(text: string) {
  return {
    children: [lexText(text)],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    type: 'paragraph',
    version: 1,
    textFormat: 0,
    textStyle: '',
  }
}

function lexHeading(tag: 'h2' | 'h3', text: string) {
  return {
    children: [lexText(text)],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    tag,
    type: 'heading',
    version: 1,
  }
}

function lex(blocks: Block[]) {
  const children = blocks.map((b) => {
    if ('h2' in b) return lexHeading('h2', b.h2)
    if ('h3' in b) return lexHeading('h3', b.h3)
    return lexParagraph(b.p)
  })
  return {
    root: {
      children,
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

// ── Çözümler ──────────────────────────────────────────────────────────────────

type SolutionSeed = {
  slug: string
  ikon: string
  sira: number
  baslikTR: string
  baslikEN: string
  ozetTR: string
  ozetEN: string
  hedefKitleTR: string
  hedefKitleEN: string
  icerikTR: Block[]
  icerikEN: Block[]
}

const solutions: SolutionSeed[] = [
  {
    slug: 'kamu-cozumleri',
    ikon: 'building',
    sira: 1,
    baslikTR: 'Kamu Çözümleri',
    baslikEN: 'Public Sector Solutions',
    ozetTR:
      'Belediyeler, kamu kurumları ve resmi yapı işletmecileri için yangın güvenliği projelendirme, denetim ve raporlama süreçlerini dijitalleştiren uçtan uca çözümler.',
    ozetEN:
      'End-to-end solutions that digitalize fire-safety design, inspection and reporting processes for municipalities, public institutions and operators of official buildings.',
    hedefKitleTR:
      'Belediyeler ve büyükşehir itfaiye daireleri\nKamu yapı işleri ve yatırım müdürlükleri\nOkul, hastane ve resmî bina işletmecileri\nKamu ihale süreçlerini yürüten teknik birimler',
    hedefKitleEN:
      'Municipalities and metropolitan fire departments\nPublic works and investment directorates\nOperators of schools, hospitals and official buildings\nTechnical units managing public procurement processes',
    icerikTR: [
      { h2: 'Kamu yapılarında yangın güvenliği' },
      {
        p: 'Kamu binaları yoğun insan trafiği, yüksek doluluk ve katı mevzuat gereksinimleri nedeniyle yangın güvenliği açısından özel bir dikkat gerektirir. Redwall, "Binaların Yangından Korunması Hakkında Yönetmelik" (BYKHY) çerçevesinde projelendirme, hesap ve raporlama adımlarını standartlaştırarak kamu kurumlarının süreçlerini hızlandırır.',
      },
      { h2: 'Sunduğumuz hizmetler' },
      {
        p: 'Yangın güvenliği danışmanlığı, mevcut yapıların mevzuata uygunluk denetimi, yangın algılama ve söndürme sistemlerinin projelendirilmesi ve tahliye senaryolarının değerlendirilmesi.',
      },
      {
        p: 'YangınPro ve MekanikPro yazılımlarımız ile hesapların, projelerin ve denetim raporlarının dijital ortamda izlenebilir biçimde üretilmesi.',
      },
      { h2: 'Neden Redwall?' },
      {
        p: 'Mühendislik danışmanlığını kendi geliştirdiğimiz yazılımlarla birleştirerek, kamu projelerinde hem hız hem de denetlenebilir kayıt bütünlüğü sağlıyoruz.',
      },
    ],
    icerikEN: [
      { h2: 'Fire safety in public buildings' },
      {
        p: 'Public buildings require particular attention in terms of fire safety due to high foot traffic, high occupancy and strict regulatory requirements. Redwall standardizes design, calculation and reporting steps within the framework of the Turkish Regulation on Fire Protection of Buildings, accelerating the processes of public institutions.',
      },
      { h2: 'Services we provide' },
      {
        p: 'Fire-safety consultancy, compliance auditing of existing buildings, design of fire detection and suppression systems, and evaluation of evacuation scenarios.',
      },
      {
        p: 'Traceable digital production of calculations, projects and inspection reports through our YangınPro and MekanikPro software.',
      },
      { h2: 'Why Redwall?' },
      {
        p: 'By combining engineering consultancy with software we develop in-house, we deliver both speed and auditable record integrity in public projects.',
      },
    ],
  },
  {
    slug: 'muteahhit-insaat-cozumleri',
    ikon: 'hard-hat',
    sira: 2,
    baslikTR: 'Müteahhit ve İnşaat Çözümleri',
    baslikEN: 'Contractor & Construction Solutions',
    ozetTR:
      'Yüklenici firmalar ve inşaat şirketleri için ruhsat aşamasından kabule kadar yangın güvenliği projelendirme ve uygunluk süreçlerini hızlandıran çözümler.',
    ozetEN:
      'Solutions that accelerate fire-safety design and compliance processes for contractors and construction companies, from permit stage through to acceptance.',
    hedefKitleTR:
      'İnşaat ve taahhüt firmaları\nProje ve şantiye yöneticileri\nMekanik ve elektrik taahhüt firmaları\nYapı denetim kuruluşları',
    hedefKitleEN:
      'Construction and contracting firms\nProject and site managers\nMechanical and electrical contractors\nBuilding inspection organizations',
    icerikTR: [
      { h2: 'Projeden kabule yangın güvenliği' },
      {
        p: 'İnşaat projelerinde yangın güvenliği gereksinimleri, ruhsat ve yapı kullanma izni süreçlerinin kritik bir parçasıdır. Eksik veya hatalı projelendirme, ciddi zaman ve maliyet kayıplarına yol açar.',
      },
      { h2: 'Sunduğumuz hizmetler' },
      {
        p: 'Yangın algılama, alarm ve söndürme sistemlerinin projelendirilmesi; sprinkler ve yangın pompası hesapları; duman tahliye ve basınçlandırma sistemlerinin tasarımı; mevzuata uygunluk raporlaması.',
      },
      {
        p: 'MekanikPro ile mekanik tesisat ve yangın söndürme hesaplarının, YangınPro ile algılama ve uyarı sistemlerinin hızlı ve standart biçimde projelendirilmesi.',
      },
      { h2: 'Kazanımınız' },
      {
        p: 'Ruhsat süreçlerinde tekrar eden revizyonları azaltır, yüklenici firmaların projelerini ilk seferde mevzuata uygun teslim etmesini sağlarız.',
      },
    ],
    icerikEN: [
      { h2: 'Fire safety from design to acceptance' },
      {
        p: 'In construction projects, fire-safety requirements are a critical part of permit and occupancy-permit processes. Incomplete or incorrect design leads to significant losses of time and cost.',
      },
      { h2: 'Services we provide' },
      {
        p: 'Design of fire detection, alarm and suppression systems; sprinkler and fire-pump calculations; design of smoke-exhaust and pressurization systems; regulatory compliance reporting.',
      },
      {
        p: 'Fast, standardized design of mechanical installation and fire-suppression calculations with MekanikPro, and of detection and warning systems with YangınPro.',
      },
      { h2: 'Your benefit' },
      {
        p: 'We reduce repeated revisions in permit processes and enable contractors to deliver compliant projects the first time.',
      },
    ],
  },
  {
    slug: 'saglik-yapilari',
    ikon: 'shield-check',
    sira: 3,
    baslikTR: 'Sağlık Yapıları',
    baslikEN: 'Healthcare Facilities',
    ozetTR:
      'Hastane ve sağlık tesisleri için kesintisiz hizmet, hasta tahliyesi ve katı yönetmelik gereksinimlerini gözeten özel yangın güvenliği çözümleri.',
    ozetEN:
      'Specialized fire-safety solutions for hospitals and healthcare facilities, addressing uninterrupted service, patient evacuation and strict regulatory requirements.',
    hedefKitleTR:
      'Hastaneler ve özel sağlık kuruluşları\nSağlık yatırımları yapan kurumlar\nTesis ve teknik işletme müdürlükleri\nSağlık yapıları projelendiren mimar ve mühendisler',
    hedefKitleEN:
      'Hospitals and private healthcare institutions\nOrganizations investing in healthcare facilities\nFacility and technical operations directorates\nArchitects and engineers designing healthcare buildings',
    icerikTR: [
      { h2: 'Sağlık yapılarında kritik gereksinimler' },
      {
        p: 'Sağlık yapıları, hareket kabiliyeti kısıtlı kullanıcılar, kesintisiz tıbbi hizmet zorunluluğu ve yüksek doluluk nedeniyle yangın güvenliğinde en hassas yapı sınıflarından biridir.',
      },
      { h2: 'Sunduğumuz hizmetler' },
      {
        p: 'Yatay ve dikey tahliye senaryolarının tasarımı, yangın kompartımanlaması, kritik alanların duman kontrolü ve yedekli yangın algılama altyapısının projelendirilmesi.',
      },
      {
        p: 'Ameliyathane, yoğun bakım ve görüntüleme üniteleri gibi özel alanlar için risk değerlendirmesi ve mevzuata uygunluk raporlaması.',
      },
      { h2: 'Yaklaşımımız' },
      {
        p: 'Hasta güvenliğini merkeze alan, hizmet sürekliliğini bozmadan uygulanabilir yangın güvenliği tasarımları geliştiririz.',
      },
    ],
    icerikEN: [
      { h2: 'Critical requirements in healthcare buildings' },
      {
        p: 'Healthcare buildings are among the most sensitive building classes for fire safety due to users with limited mobility, the requirement for uninterrupted medical service, and high occupancy.',
      },
      { h2: 'Services we provide' },
      {
        p: 'Design of horizontal and vertical evacuation scenarios, fire compartmentation, smoke control of critical areas, and design of redundant fire-detection infrastructure.',
      },
      {
        p: 'Risk assessment and compliance reporting for special areas such as operating rooms, intensive-care and imaging units.',
      },
      { h2: 'Our approach' },
      {
        p: 'We develop fire-safety designs that put patient safety at the center and remain applicable without disrupting service continuity.',
      },
    ],
  },
  {
    slug: 'sanayi-enerji',
    ikon: 'gauge',
    sira: 4,
    baslikTR: 'Sanayi ve Enerji Tesisleri',
    baslikEN: 'Industry & Energy Facilities',
    ozetTR:
      'Fabrika, depo ve enerji tesisleri için yüksek yangın yükü ve proses risklerini gözeten ileri seviye yangın güvenliği projelendirme ve danışmanlık hizmetleri.',
    ozetEN:
      'Advanced fire-safety design and consultancy services for factories, warehouses and energy facilities, addressing high fire loads and process risks.',
    hedefKitleTR:
      'Üretim tesisleri ve organize sanayi bölgeleri\nLojistik ve depolama işletmeleri\nEnerji üretim ve dağıtım tesisleri\nİş sağlığı ve güvenliği birimleri',
    hedefKitleEN:
      'Manufacturing facilities and organized industrial zones\nLogistics and storage operations\nEnergy generation and distribution facilities\nOccupational health and safety units',
    icerikTR: [
      { h2: 'Yüksek riskli tesislerde yangın güvenliği' },
      {
        p: 'Sanayi ve enerji tesisleri, yüksek yangın yükü, parlayıcı/patlayıcı maddeler ve karmaşık proses riskleri nedeniyle özelleşmiş bir yangın güvenliği yaklaşımı gerektirir.',
      },
      { h2: 'Sunduğumuz hizmetler' },
      {
        p: 'Depolama alanları için sprinkler ve köpüklü söndürme sistemleri, yangın pompa istasyonu hesapları, gaz algılama ve özel söndürme sistemlerinin projelendirilmesi.',
      },
      {
        p: 'Proses risklerine yönelik yangın senaryosu değerlendirmeleri ve mevzuata uygunluk raporlaması; MekanikPro ile hidrolik hesapların hızlı üretimi.',
      },
      { h2: 'Değer önerimiz' },
      {
        p: 'Üretim sürekliliğini ve varlık güvenliğini koruyan, ölçeklenebilir yangın güvenliği çözümleri tasarlarız.',
      },
    ],
    icerikEN: [
      { h2: 'Fire safety in high-risk facilities' },
      {
        p: 'Industrial and energy facilities require a specialized fire-safety approach due to high fire loads, flammable/explosive materials and complex process risks.',
      },
      { h2: 'Services we provide' },
      {
        p: 'Sprinkler and foam suppression systems for storage areas, fire pump-station calculations, and design of gas-detection and special suppression systems.',
      },
      {
        p: 'Fire-scenario assessments for process risks and regulatory compliance reporting; rapid production of hydraulic calculations with MekanikPro.',
      },
      { h2: 'Our value proposition' },
      {
        p: 'We design scalable fire-safety solutions that protect production continuity and asset security.',
      },
    ],
  },
]

// ── Ekip (placeholder) ──────────────────────────────────────────────────────

type TeamSeed = {
  ad: string
  sira: number
  unvanTR: string
  unvanEN: string
  bioTR: string
  bioEN: string
}

const team: TeamSeed[] = [
  {
    ad: '[Ad Soyad 1]',
    sira: 1,
    unvanTR: 'Kurucu ve Genel Müdür',
    unvanEN: 'Founder & General Manager',
    bioTR:
      'PLACEHOLDER — Bu alanı /admin panelinden gerçek ekip üyesi bilgisiyle güncelleyin. Yangın güvenliği danışmanlığı ve yazılım geliştirme alanındaki deneyim özeti buraya yazılır.',
    bioEN:
      'PLACEHOLDER — Update this field with real team member information from the /admin panel. A summary of experience in fire-safety consultancy and software development goes here.',
  },
  {
    ad: '[Ad Soyad 2]',
    sira: 2,
    unvanTR: 'Yangın Güvenliği Mühendisi',
    unvanEN: 'Fire Safety Engineer',
    bioTR:
      'PLACEHOLDER — Mühendislik projelendirme ve mevzuata uygunluk denetimi sorumlusu. Gerçek bilgiyi /admin panelinden ekleyin.',
    bioEN:
      'PLACEHOLDER — Responsible for engineering design and regulatory compliance auditing. Add real information from the /admin panel.',
  },
  {
    ad: '[Ad Soyad 3]',
    sira: 3,
    unvanTR: 'Yazılım Geliştirme Lideri',
    unvanEN: 'Software Development Lead',
    bioTR:
      'PLACEHOLDER — YangınPro ve MekanikPro ürünlerinin geliştirme sorumlusu. Gerçek bilgiyi /admin panelinden ekleyin.',
    bioEN:
      'PLACEHOLDER — Responsible for the development of YangınPro and MekanikPro products. Add real information from the /admin panel.',
  },
]

// ── Dokümanlar (placeholder — dosya /admin'de yüklenir) ───────────────────────

type DocSeed = {
  baslikTR: string
  baslikEN: string
  aciklamaTR: string
  aciklamaEN: string
  kategoriTR: string
  kategoriEN: string
  sira: number
}

const documents: DocSeed[] = [
  {
    baslikTR: 'Redwall Kurumsal Tanıtım Kataloğu',
    baslikEN: 'Redwall Corporate Brochure',
    aciklamaTR:
      'Şirketimizin hizmetlerini ve yazılım ürünlerini tanıtan kurumsal katalog. (Dosya /admin panelinden yüklenecektir.)',
    aciklamaEN:
      'Corporate brochure introducing our services and software products. (The file will be uploaded from the /admin panel.)',
    kategoriTR: 'Kurumsal',
    kategoriEN: 'Corporate',
    sira: 1,
  },
  {
    baslikTR: 'YangınPro Ürün Broşürü',
    baslikEN: 'YangınPro Product Brochure',
    aciklamaTR:
      'YangınPro yazılımının özelliklerini ve kullanım alanlarını anlatan broşür. (Dosya /admin panelinden yüklenecektir.)',
    aciklamaEN:
      'Brochure describing the features and use cases of the YangınPro software. (The file will be uploaded from the /admin panel.)',
    kategoriTR: 'Ürün Broşürleri',
    kategoriEN: 'Product Brochures',
    sira: 2,
  },
  {
    baslikTR: 'MekanikPro Ürün Broşürü',
    baslikEN: 'MekanikPro Product Brochure',
    aciklamaTR:
      'MekanikPro yazılımının mekanik tesisat ve yangın hesaplama yeteneklerini anlatan broşür. (Dosya /admin panelinden yüklenecektir.)',
    aciklamaEN:
      'Brochure describing the mechanical installation and fire-calculation capabilities of MekanikPro. (The file will be uploaded from the /admin panel.)',
    kategoriTR: 'Ürün Broşürleri',
    kategoriEN: 'Product Brochures',
    sira: 3,
  },
]

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const payload = await getPayload({ config })
  console.log('🌱  Kurumsal içerik seed başlıyor…')

  // ── Çözümler ──
  for (const s of solutions) {
    const existing = await payload.find({
      collection: 'solution',
      where: { slug: { equals: s.slug } },
      limit: 1,
      overrideAccess: true,
    })

    let docId: string | number
    if (existing.totalDocs === 0) {
      const doc = await payload.create({
        collection: 'solution',
        locale: 'tr',
        data: {
          slug: s.slug,
          ikon: s.ikon,
          sira: s.sira,
          baslik: s.baslikTR,
          ozet: s.ozetTR,
          icerik: lex(s.icerikTR),
          hedefKitle: s.hedefKitleTR,
        },
        overrideAccess: true,
      })
      docId = doc.id
      console.log(`  ✓ solution[${s.slug}] oluşturuldu (TR)`)
    } else {
      docId = existing.docs[0].id
      await payload.update({
        collection: 'solution',
        id: docId,
        locale: 'tr',
        data: {
          ikon: s.ikon,
          sira: s.sira,
          baslik: s.baslikTR,
          ozet: s.ozetTR,
          icerik: lex(s.icerikTR),
          hedefKitle: s.hedefKitleTR,
        },
        overrideAccess: true,
      })
      console.log(`  – solution[${s.slug}] zaten var, TR güncellendi.`)
    }

    await payload.update({
      collection: 'solution',
      id: docId,
      locale: 'en',
      data: {
        baslik: s.baslikEN,
        ozet: s.ozetEN,
        icerik: lex(s.icerikEN),
        hedefKitle: s.hedefKitleEN,
      },
      overrideAccess: true,
    })
    console.log(`  ✓ solution[${s.slug}] EN locale yazıldı`)
  }

  // ── Ekip ──
  for (const m of team) {
    const existing = await payload.find({
      collection: 'teamMember',
      where: { ad: { equals: m.ad } },
      limit: 1,
      overrideAccess: true,
    })

    let docId: string | number
    if (existing.totalDocs === 0) {
      const doc = await payload.create({
        collection: 'teamMember',
        locale: 'tr',
        data: { ad: m.ad, sira: m.sira, unvan: m.unvanTR, bio: m.bioTR },
        overrideAccess: true,
      })
      docId = doc.id
      console.log(`  ✓ teamMember[${m.ad}] oluşturuldu (TR)`)
    } else {
      docId = existing.docs[0].id
      await payload.update({
        collection: 'teamMember',
        id: docId,
        locale: 'tr',
        data: { sira: m.sira, unvan: m.unvanTR, bio: m.bioTR },
        overrideAccess: true,
      })
      console.log(`  – teamMember[${m.ad}] zaten var, TR güncellendi.`)
    }

    await payload.update({
      collection: 'teamMember',
      id: docId,
      locale: 'en',
      data: { unvan: m.unvanEN, bio: m.bioEN },
      overrideAccess: true,
    })
    console.log(`  ✓ teamMember[${m.ad}] EN locale yazıldı`)
  }

  // ── Dokümanlar ──
  for (const d of documents) {
    const existing = await payload.find({
      collection: 'document',
      where: { baslik: { equals: d.baslikTR } },
      locale: 'tr',
      limit: 1,
      overrideAccess: true,
    })

    let docId: string | number
    if (existing.totalDocs === 0) {
      const doc = await payload.create({
        collection: 'document',
        locale: 'tr',
        data: {
          sira: d.sira,
          baslik: d.baslikTR,
          aciklama: d.aciklamaTR,
          kategori: d.kategoriTR,
        },
        overrideAccess: true,
      })
      docId = doc.id
      console.log(`  ✓ document[${d.baslikTR}] oluşturuldu (TR)`)
    } else {
      docId = existing.docs[0].id
      await payload.update({
        collection: 'document',
        id: docId,
        locale: 'tr',
        data: {
          sira: d.sira,
          baslik: d.baslikTR,
          aciklama: d.aciklamaTR,
          kategori: d.kategoriTR,
        },
        overrideAccess: true,
      })
      console.log(`  – document[${d.baslikTR}] zaten var, TR güncellendi.`)
    }

    await payload.update({
      collection: 'document',
      id: docId,
      locale: 'en',
      data: { baslik: d.baslikEN, aciklama: d.aciklamaEN, kategori: d.kategoriEN },
      overrideAccess: true,
    })
    console.log(`  ✓ document[${d.baslikTR}] EN locale yazıldı`)
  }

  console.log('\n✅  Kurumsal içerik seed tamamlandı.')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌  Seed hatası:', err)
  process.exit(1)
})
