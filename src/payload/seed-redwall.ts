/**
 * Idempotent seed script — 4 redwall bilgi sayfası (TR + EN)
 *
 * Usage:  npm run payload:seed-redwall
 *
 * Oluşturur / günceller:
 *  • richPage: mevzuat, guvenlik, nasil-calisir, destek
 *
 * İdempotentlik: slug ile bulur; yoksa create (locale:tr),
 * varsa veya yeni oluşturulduysa update (locale:en).
 *
 * NOT: Bu metinler bilgilendirme amaçlıdır (ürün/kurumsal tanıtım).
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

// ── Lexical helper ────────────────────────────────────────────────────────────

type Block =
  | { h2: string }
  | { h3: string }
  | { p: string }

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

// ── Shared ──────────────────────────────────────────────────────────────────

const EMAIL = 'info@redwall.com.tr'
const TELEFON = '[DOLDURULACAK: destek telefonu]'

const INFO_NOTE_TR =
  'Bu sayfa bilgilendirme amaçlıdır. İçerik, ürün ve hizmetlerimizin genel çalışma prensiplerini açıklar; sözleşmesel taahhüt veya uygunluk garantisi niteliği taşımaz.'
const INFO_NOTE_EN =
  'This page is for informational purposes. The content describes the general operating principles of our products and services and does not constitute a contractual commitment or compliance guarantee.'

// 1 ── Mevzuat Uyumluluğu
const mevzuatTR: Block[] = [
  { p: INFO_NOTE_TR },
  { h2: 'Mevzuata Dayalı Yaklaşım' },
  {
    p: "Redwall yazılım ve mühendislik hizmetleri, Türkiye'deki yangından korunma mevzuatı esas alınarak tasarlanır. Hesaplama ve raporlama akışlarımız, yürürlükteki düzenlemelerin gerektirdiği yöntem ve kabullerle uyumlu çalışacak biçimde kurgulanmıştır.",
  },
  { h2: 'Binaların Yangından Korunması Hakkında Yönetmelik (BYKHY)' },
  {
    p: 'YangınPro ve MekanikPro, projelerin tasarımında temel referans olan Binaların Yangından Korunması Hakkında Yönetmelik (BYKHY) hükümlerini dikkate alır. Yapı sınıfı, kullanım amacı ve tehlike sınıfı gibi girdilere bağlı olarak yönetmeliğin öngördüğü gereksinimler hesap akışına yansıtılır.',
  },
  { h2: 'Standartlar ve Referanslar' },
  {
    p: 'Yazılımlarımız; ilgili Türk Standartları (TS) ile yangın güvenliği alanında yaygın olarak başvurulan uluslararası referanslara (ör. NFPA serisi) uygun yöntemleri temel alır. Hangi standartların hangi proje için uygulanacağı, projenin kapsamına ve yetkili mühendisin değerlendirmesine bağlıdır.',
  },
  { h2: 'Hesapların Güncel Tutulması' },
  {
    p: 'Mevzuat ve standartlar zaman içinde güncellenebilir. Redwall, hesaplama modüllerini yürürlükteki düzenlemelerle uyumlu tutmak için düzenli olarak gözden geçirir; önemli mevzuat değişikliklerinde yazılım güncellemeleri yayımlanır.',
  },
  { h2: 'Mühendis Sorumluluğu' },
  {
    p: 'Yazılımlarımız, yetkili mühendisin tasarım ve karar süreçlerini destekleyen araçlardır. Nihai proje, hesap ve raporların mevzuata uygunluğunun doğrulanması ve onaylanması, ilgili meslek mensubunun sorumluluğundadır.',
  },
  { h2: 'Uygunluk Çıktıları' },
  {
    p: 'Yazılım, hesap sonuçlarını ve uygulanan kabulleri izlenebilir raporlar hâlinde sunar. Bu çıktılar, projenin ilgili kurum ve denetim süreçlerinde belgelenmesini kolaylaştırır.',
  },
]

const mevzuatEN: Block[] = [
  { p: INFO_NOTE_EN },
  { h2: 'A Regulation-Driven Approach' },
  {
    p: "Redwall's software and engineering services are designed on the basis of Turkey's fire-protection regulation. Our calculation and reporting workflows are built to operate in line with the methods and assumptions required by the regulations in force.",
  },
  { h2: 'Fire Protection Regulation for Buildings (BYKHY)' },
  {
    p: 'YangınPro and MekanikPro take into account the provisions of the Regulation on Fire Protection of Buildings (BYKHY), which is the primary reference in project design. Requirements set out by the regulation are reflected in the calculation flow based on inputs such as building class, intended use, and hazard class.',
  },
  { h2: 'Standards and References' },
  {
    p: 'Our software is based on methods compliant with the relevant Turkish Standards (TS) and with internationally recognised references commonly applied in fire safety (e.g., the NFPA series). Which standards apply to a given project depends on the project scope and the assessment of the responsible engineer.',
  },
  { h2: 'Keeping Calculations Current' },
  {
    p: 'Regulations and standards may be updated over time. Redwall regularly reviews its calculation modules to keep them aligned with the regulations in force, and publishes software updates following significant regulatory changes.',
  },
  { h2: 'Engineer Responsibility' },
  {
    p: 'Our software products are tools that support the design and decision-making of the responsible engineer. Verifying and approving the regulatory compliance of the final project, calculations, and reports remains the responsibility of the relevant professional.',
  },
  { h2: 'Compliance Output' },
  {
    p: 'The software presents calculation results and the assumptions applied as traceable reports. These outputs make it easier to document a project throughout the relevant authority and inspection processes.',
  },
]

// 2 ── Güvenlik ve Veri Koruma
const guvenlikTR: Block[] = [
  { p: INFO_NOTE_TR },
  { h2: 'Veri Egemenliği' },
  {
    p: 'Redwall altyapısı kendi yönetimimizdeki sunucularda (self-hosted) çalışır. Bu yaklaşım, verilerin nerede tutulduğu ve nasıl işlendiği üzerinde tam denetim sağlar ve verilerinizin üçüncü taraf hizmetlere dağılmasını en aza indirir.',
  },
  { h2: 'KVKK ve GDPR Uyumu' },
  {
    p: '6698 sayılı KVKK ve Avrupa Birliği Genel Veri Koruma Tüzüğü (GDPR) ilkelerini gözeterek hareket ederiz. Veri işleme süreçlerimiz; amaçla sınırlılık, veri minimizasyonu ve saklama sürelerine uygunluk ilkeleri çerçevesinde yürütülür.',
  },
  { h2: 'Erişim Denetimi' },
  {
    p: 'Sistemlere erişim, rol tabanlı yetkilendirme ile sınırlandırılır. Kullanıcılar yalnızca görevleri için gerekli verilere erişebilir; yönetimsel işlemler için ayrı yetki seviyeleri tanımlanır.',
  },
  { h2: 'İletim Güvenliği' },
  {
    p: 'Web sitemiz ve uygulamalarımızla yapılan tüm iletişim, aktarım sırasında şifrelenir (HTTPS/TLS). Bu sayede veriler, sizinle sunucularımız arasında güvenli biçimde taşınır.',
  },
  { h2: 'Yedekleme ve Süreklilik' },
  {
    p: 'Verilerin kaybolmasını önlemek için düzenli yedekleme yapılır ve yedeklerin bütünlüğü gözetilir. Süreklilik planlamamız, beklenmedik kesintilerde hizmetin yeniden ayağa kaldırılmasını hedefler.',
  },
  { h2: 'İdari Tedbirler' },
  {
    p: 'Teknik önlemlerin yanı sıra; güncellemelerin düzenli uygulanması, en az ayrıcalık ilkesi ve erişim kayıtlarının tutulması gibi idari tedbirlerle güvenlik bütünsel olarak ele alınır.',
  },
]

const guvenlikEN: Block[] = [
  { p: INFO_NOTE_EN },
  { h2: 'Data Sovereignty' },
  {
    p: 'Redwall infrastructure runs on servers under our own management (self-hosted). This approach provides full control over where data is stored and how it is processed, and minimises the dispersal of your data across third-party services.',
  },
  { h2: 'KVKK and GDPR Alignment' },
  {
    p: 'We operate with regard to the principles of the KVKK No. 6698 and the European Union General Data Protection Regulation (GDPR). Our data processing is carried out within the framework of purpose limitation, data minimisation, and adherence to retention periods.',
  },
  { h2: 'Access Control' },
  {
    p: 'Access to systems is restricted through role-based authorisation. Users can access only the data necessary for their tasks, and separate privilege levels are defined for administrative operations.',
  },
  { h2: 'Transit Security' },
  {
    p: 'All communication with our website and applications is encrypted in transit (HTTPS/TLS). Data is therefore carried securely between you and our servers.',
  },
  { h2: 'Backup and Continuity' },
  {
    p: 'Regular backups are performed and their integrity is monitored to prevent data loss. Our continuity planning aims to restore service in the event of unexpected outages.',
  },
  { h2: 'Administrative Measures' },
  {
    p: 'Alongside technical measures, security is addressed holistically through administrative practices such as applying updates regularly, the principle of least privilege, and maintaining access logs.',
  },
]

// 3 ── Nasıl Çalışır
const nasilTR: Block[] = [
  { p: INFO_NOTE_TR },
  { h2: 'Genel Akış' },
  {
    p: 'YangınPro ve MekanikPro, bir yangın güvenliği projesini baştan sona dijital ortamda yürütmenizi sağlar. Süreç; proje kurulumu, hesaplama, raporlama ve uygunluk çıktısı olmak üzere dört temel adımda ilerler.',
  },
  { h3: '1. Proje Kurulumu' },
  {
    p: 'Yapının kullanım amacı, kat ve alan bilgileri, tehlike sınıfı gibi temel parametreleri girerek projenizi tanımlarsınız. Bu girdiler, sonraki adımlarda yapılacak hesapların temelini oluşturur.',
  },
  { h3: '2. Hesaplama' },
  {
    p: 'Yazılım, tanımladığınız parametrelere göre ilgili yangın güvenliği hesaplarını yürütür. MekanikPro mekanik tesisat ve duman tahliyesi gibi mühendislik hesaplarına, YangınPro ise yangın güvenliği sistem tasarımına odaklanır. Hesaplarda kullanılan kabuller şeffaf biçimde gösterilir.',
  },
  { h3: '3. Raporlama' },
  {
    p: 'Hesap sonuçları, düzenli ve okunabilir raporlara dönüştürülür. Raporlar; girdileri, uygulanan yöntemleri ve sonuçları içerir; böylece proje üzerinde yapılan çalışma izlenebilir kalır.',
  },
  { h3: '4. Uygunluk Çıktısı' },
  {
    p: 'Son adımda, mevzuata uygun biçimde belgelenebilen çıktılar elde edersiniz. Bu çıktılar; onay, denetim ve arşivleme süreçlerinde kullanılmak üzere dışa aktarılabilir.',
  },
  { h2: 'Birlikte Çalışma' },
  {
    p: 'YangınPro ve MekanikPro, aynı projenin farklı yönlerini ele alacak şekilde birbirini tamamlar. Veriler tutarlı biçimde paylaşılır; böylece tekrar eden veri girişine gerek kalmadan bütünsel bir proje yönetimi sağlanır.',
  },
]

const nasilEN: Block[] = [
  { p: INFO_NOTE_EN },
  { h2: 'Overall Workflow' },
  {
    p: 'YangınPro and MekanikPro let you run a fire safety project from start to finish in a digital environment. The process proceeds in four core steps: project setup, calculation, reporting, and compliance output.',
  },
  { h3: '1. Project Setup' },
  {
    p: 'You define your project by entering basic parameters such as the building’s intended use, floor and area information, and hazard class. These inputs form the basis for the calculations performed in subsequent steps.',
  },
  { h3: '2. Calculation' },
  {
    p: 'The software runs the relevant fire safety calculations based on the parameters you define. MekanikPro focuses on engineering calculations such as mechanical systems and smoke evacuation, while YangınPro focuses on fire safety system design. The assumptions used in calculations are shown transparently.',
  },
  { h3: '3. Reporting' },
  {
    p: 'Calculation results are turned into organised, readable reports. The reports include the inputs, the methods applied, and the results, so that the work done on the project remains traceable.',
  },
  { h3: '4. Compliance Output' },
  {
    p: 'In the final step, you obtain outputs that can be documented in line with the regulations. These outputs can be exported for use in approval, inspection, and archiving processes.',
  },
  { h2: 'Working Together' },
  {
    p: 'YangınPro and MekanikPro complement each other by addressing different aspects of the same project. Data is shared consistently, enabling holistic project management without the need for repeated data entry.',
  },
]

// 4 ── Destek
const destekTR: Block[] = [
  { p: INFO_NOTE_TR },
  { h2: 'Destek Kanalları' },
  {
    p: `Sorularınız, talepleriniz ve teknik destek ihtiyaçlarınız için bizimle iletişime geçebilirsiniz. Birincil destek kanalımız e-postadır: ${EMAIL}`,
  },
  { p: `Telefon: ${TELEFON}` },
  { h2: 'Belgeler ve Kaynaklar' },
  {
    p: 'YangınPro ve MekanikPro kullanımına ilişkin yardım belgeleri ve rehberler, ürünlerin yaygın senaryolarını adım adım açıklar. Belgeler, mevzuat ve ürün güncellemelerine paralel olarak güncellenir.',
  },
  { h2: 'Kurulum ve Başlangıç (Onboarding)' },
  {
    p: 'Yeni kullanıcılar için başlangıç sürecini kolaylaştıran bir onboarding desteği sunarız. İlk proje kurulumu, temel akışların tanıtımı ve sık karşılaşılan sorulara ilişkin yönlendirme bu kapsamdadır.',
  },
  { h2: 'Yanıt Yaklaşımımız' },
  {
    p: 'Destek taleplerini, alındıkları sırada ve önceliklerine göre değerlendiririz. Acil ve hizmeti engelleyen sorunlara öncelik verilir; bilgilendirme ve genel sorular sırasıyla yanıtlanır.',
  },
  {
    p: 'Not: Bu sayfada belirtilen yanıt süreleri ve hizmet seviyesi bilgileri yol gösterici niteliktedir; bağlayıcı bir hizmet seviyesi taahhüdü (SLA) için ayrıca sözleşmesel düzenleme yapılması gerekir.',
  },
  { h2: 'İletişim' },
  { p: `E-posta: ${EMAIL}` },
]

const destekEN: Block[] = [
  { p: INFO_NOTE_EN },
  { h2: 'Support Channels' },
  {
    p: `You can contact us for your questions, requests, and technical support needs. Our primary support channel is e-mail: ${EMAIL}`,
  },
  { p: `Phone: ${TELEFON}` },
  { h2: 'Documentation and Resources' },
  {
    p: 'Help documents and guides on using YangınPro and MekanikPro explain common product scenarios step by step. Documentation is updated in parallel with regulatory and product updates.',
  },
  { h2: 'Onboarding' },
  {
    p: 'We provide onboarding support that eases the getting-started process for new users. This covers initial project setup, an introduction to the core workflows, and guidance on frequently asked questions.',
  },
  { h2: 'Our Response Approach' },
  {
    p: 'We evaluate support requests in the order received and according to their priority. Urgent and service-blocking issues are prioritised, while informational and general questions are answered in turn.',
  },
  {
    p: 'Note: The response times and service-level information stated on this page are indicative; a binding service-level agreement (SLA) requires a separate contractual arrangement.',
  },
  { h2: 'Contact' },
  { p: `E-mail: ${EMAIL}` },
]

// ── Page definitions ──────────────────────────────────────────────────────────

type RedwallPage = {
  slug: string
  baslikTR: string
  baslikEN: string
  icerikTR: Block[]
  icerikEN: Block[]
}

const redwallPages: RedwallPage[] = [
  {
    slug: 'mevzuat',
    baslikTR: 'Mevzuat Uyumluluğu',
    baslikEN: 'Regulatory Compliance',
    icerikTR: mevzuatTR,
    icerikEN: mevzuatEN,
  },
  {
    slug: 'guvenlik',
    baslikTR: 'Güvenlik ve Veri Koruma',
    baslikEN: 'Security & Data Protection',
    icerikTR: guvenlikTR,
    icerikEN: guvenlikEN,
  },
  {
    slug: 'nasil-calisir',
    baslikTR: 'Nasıl Çalışır',
    baslikEN: 'How It Works',
    icerikTR: nasilTR,
    icerikEN: nasilEN,
  },
  {
    slug: 'destek',
    baslikTR: 'Destek',
    baslikEN: 'Support',
    icerikTR: destekTR,
    icerikEN: destekEN,
  },
]

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const payload = await getPayload({ config })
  console.log('🌱  Redwall bilgi sayfaları seed başlıyor…')

  const today = new Date().toISOString()

  for (const page of redwallPages) {
    const existing = await payload.find({
      collection: 'richPage',
      where: { slug: { equals: page.slug } },
      limit: 1,
      overrideAccess: true,
    })

    let docId: string | number

    if (existing.totalDocs === 0) {
      // Create with TR locale
      const doc = await payload.create({
        collection: 'richPage',
        locale: 'tr',
        data: {
          slug: page.slug,
          kategori: 'redwall',
          baslik: page.baslikTR,
          icerik: lex(page.icerikTR),
          sonGuncelleme: today,
        },
        overrideAccess: true,
      })
      docId = doc.id
      console.log(`  ✓ richPage[${page.slug}] oluşturuldu (TR)`)
    } else {
      docId = existing.docs[0].id
      // Update TR locale (for idempotency — keeps content fresh)
      await payload.update({
        collection: 'richPage',
        id: docId,
        locale: 'tr',
        data: {
          baslik: page.baslikTR,
          icerik: lex(page.icerikTR),
          sonGuncelleme: today,
        },
        overrideAccess: true,
      })
      console.log(`  – richPage[${page.slug}] zaten var, TR güncellendi.`)
    }

    // Always update EN locale
    await payload.update({
      collection: 'richPage',
      id: docId,
      locale: 'en',
      data: {
        baslik: page.baslikEN,
        icerik: lex(page.icerikEN),
      },
      overrideAccess: true,
    })
    console.log(`  ✓ richPage[${page.slug}] EN locale yazıldı`)
  }

  console.log('\n✅  Redwall bilgi sayfaları seed tamamlandı.')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌  Seed hatası:', err)
  process.exit(1)
})
