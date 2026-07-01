/**
 * Idempotent — danışmanlık `service` kaydının içeriğini (baslik/ozet/chips/
 * giriş/altHizmetler/surec) onaylı 4-teklif revizyonuyla günceller. TR + EN.
 *
 * Usage:  npm run payload:seed-danismanlik
 *
 * Localized dizi deseni: önce locale:'tr' ile tüm yapı yazılır, dizilerin
 * id'leri okunur, sonra locale:'en' aynı id'lerle güncellenir (Payload satırları
 * yeniden oluşturmasın, TR locale verisi korunsun diye).
 */
import { config as dotenvConfig } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { plainToLexical } from '../lib/lexical/plainToLexical'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenvConfig({ path: resolve(__dirname, '../../.env.local') })
dotenvConfig({ path: resolve(__dirname, '../../.env') })

const { default: config } = await import('../../payload.config')
const { getPayload } = await import('payload')

const TR = {
  baslik: 'Yangın Güvenliği Danışmanlığı',
  ozet:
    'Kamu kurumlarından bina yönetimlerine, mal sahiplerinden müteahhitlere; mevzuata uygunluk, olumsuz itfaiye raporlarının olumluya çevrilmesi, doğru projelendirme ve uçtan uca süreç yönetiminde uzman desteği sunuyoruz.',
  chips: ['Kamu kurumları', 'Bina yönetimleri & mal sahipleri', 'Müteahhitler', 'Anahtar teslim süreç'],
  girisLead:
    'Her kurumun ve yapının yangın güvenliği gereksinimi farklıdır; çoğu zaman asıl ihtiyaç, mevzuata tam uyum ile hukuki güvenceyi birlikte sağlamaktır.',
  paragraflar: [
    'Yangın güvenliği mevzuatına hâkim uzman ekibimizle kurumunuzun, binanızın veya projenizin koşullarına özel danışmanlık sunarız. Tek seferlik bir uygunluk denetiminden olumsuz bir itfaiye raporunun olumluya çevrilmesine, sıfırdan olumlu rapora kadar tüm sürecin yönetimine değin; işi sizin adınıza, yazılı ve denetlenebilir çıktılarla yürütürüz.',
  ],
}

const EN = {
  baslik: 'Fire Safety Consulting',
  ozet:
    'From public institutions to building managements, property owners to contractors — expert support on regulatory compliance, turning negative fire-department reports positive, sound project design, and end-to-end process management.',
  chips: ['Public institutions', 'Building managements & owners', 'Contractors', 'Turnkey process'],
  girisLead:
    'Every institution and building has different fire-safety needs; the real requirement is often achieving full regulatory compliance and legal assurance together.',
  paragraflar: [
    "With our team's command of fire-safety legislation, we offer consulting tailored to the circumstances of your institution, building, or project. From a one-time compliance audit, to turning a negative fire-department report positive, to managing the entire process from zero to a positive report — we carry out the work on your behalf, with written and auditable outputs.",
  ],
}

const CARDS = [
  {
    icon: 'building',
    tr: {
      baslik: 'Kamu Kurumları Danışmanlığı',
      aciklama:
        "İşyeri Açma ve Çalışma Ruhsatları Yönetmeliği'nin 5/h maddesi kapsamında itfaiye tarafından rapor düzenlenmesi gerekmeyen; ancak Binaların Yangından Korunması Hakkında Yönetmelik uyarınca gerekli tedbirlerin alınması zorunlu olan binalarda, kurum adına yerinde denetim gerçekleştiririz. Talep doğrultusunda düzenlediğimiz uygunluk raporuyla, kurumun ilgili mevzuat karşısındaki hukuki sorumluluk riskini asgariye indiririz.",
    },
    en: {
      baslik: 'Public Institution Consulting',
      aciklama:
        "For buildings that do not require a fire-department report under Article 5/h of the Workplace Opening and Operating Licenses Regulation, yet must implement measures under the Regulation on Fire Protection of Buildings, we conduct on-site inspections on the institution's behalf. With the compliance report we issue on request, we minimize the institution's legal-liability risk against the relevant legislation.",
    },
  },
  {
    icon: 'shield-check',
    tr: {
      baslik: 'İtfaiye Raporu Düzeltme (Olumsuz → Olumlu)',
      aciklama:
        'Hakkında olumsuz itfaiye raporu düzenlenmiş binalarda, bina yönetimleri ve/veya mal sahipleri adına süreci yürütürüz. Raporda belirtilen eksiklikler doğrultusunda binayı detaylı biçimde analiz eder, yönetmeliğe uygun çözümleri önceliklendirir ve raporun olumluya çevrilmesi için izlenecek yol haritasını netleştiririz.',
    },
    en: {
      baslik: 'Fire-Department Report Remediation (Negative → Positive)',
      aciklama:
        'For buildings with a negative fire-department report, we manage the process on behalf of building managements and/or owners. In line with the deficiencies cited in the report, we analyze the building in detail, prioritize regulation-compliant solutions, and clarify the roadmap to turn the report positive.',
    },
  },
  {
    icon: 'ruler',
    tr: {
      baslik: 'Müteahhit & Proje Danışmanlığı',
      aciklama:
        'İnşaat firmaları ve müteahhitler için proje aşamasında devreye gireriz. Yangın güvenliği sistemlerini yönetmeliğe tam uyumlu, maliyeti optimize eden ve kaynakları verimli kullanan bir yaklaşımla projelendirir; ileride doğabilecek revizyon ve maliyetleri önceden önleriz.',
    },
    en: {
      baslik: 'Contractor & Project Consulting',
      aciklama:
        'For construction firms and contractors, we engage at the design stage. We design fire-safety systems in full regulatory compliance with an approach that optimizes cost and uses resources efficiently, preventing future revisions and expenses in advance.',
    },
  },
  {
    icon: 'clipboard',
    tr: {
      baslik: 'Uçtan Uca Süreç Yönetimi (Anahtar Teslim)',
      aciklama:
        'Talebiniz hâlinde tüm süreci uçtan uca yönetiriz. Sıfırdan başlayıp olumlu rapor alınıncaya kadar gereken tüm iş ve işlemleri — keşif, projelendirme, başvuru ve kurum/itfaiye takibi dâhil — kurumunuz adına yürütür, tek muhatap olarak süreci sonuca taşırız.',
    },
    en: {
      baslik: 'End-to-End Process Management (Turnkey)',
      aciklama:
        'On request, we manage the entire process end-to-end. From zero until a positive report is obtained, we carry out all required work and procedures — including survey, design, application, and institution/fire-department follow-up — on your behalf, taking the process to conclusion as your single point of contact.',
    },
  },
]

const STEPS = [
  {
    tr: { baslik: 'Keşif & Etüt', aciklama: 'Yapıyı veya projeyi yerinde inceler; mevcut durumu ve mevzuat gereksinimlerini eksiksiz tespit ederiz.' },
    en: { baslik: 'Survey & Assessment', aciklama: 'We inspect the building or project on site, fully identifying the current status and regulatory requirements.' },
  },
  {
    tr: { baslik: 'Uygunluk & Çözüm Raporu', aciklama: 'Tespit edilen eksiklik ve riskleri raporlar, yönetmeliğe uygun çözümleri önceliklendiririz.' },
    en: { baslik: 'Compliance & Solution Report', aciklama: 'We report identified deficiencies and risks, prioritizing regulation-compliant solutions.' },
  },
  {
    tr: { baslik: 'Projelendirme', aciklama: 'Gerekli yangın güvenliği sistemlerini mevzuata uygun ve maliyet-etkin biçimde projelendiririz.' },
    en: { baslik: 'Engineering Design', aciklama: 'We design the required fire-safety systems in a compliant and cost-effective manner.' },
  },
  {
    tr: { baslik: 'Kurum/İtfaiye Başvurusu & Takip', aciklama: 'Başvuru dosyasını hazırlar; kurum ve itfaiye nezdindeki süreçleri sizin adınıza titizlikle takip ederiz.' },
    en: { baslik: 'Institution & Fire-Department Submission & Follow-up', aciklama: 'We prepare the application file and meticulously follow up the processes before the institution and fire department on your behalf.' },
  },
  {
    tr: { baslik: 'Olumlu Rapor & Teslim', aciklama: 'Süreci olumlu rapor/uygunluk belgesiyle sonuçlandırır, tüm çıktıları teslim ederiz.' },
    en: { baslik: 'Positive Report & Handover', aciklama: 'We conclude the process with a positive report/compliance document and deliver all outputs.' },
  },
]

async function main() {
  const payload = await getPayload({ config })
  console.log('🌱  Danışmanlık içeriği güncelleniyor…')

  const { docs } = await payload.find({
    collection: 'service',
    where: { isKolu: { equals: 'danismanlik' } },
    limit: 1,
    overrideAccess: true,
  })
  if (docs.length === 0) throw new Error('danismanlik service kaydı bulunamadı')
  const id = docs[0].id

  // 1) TR — tüm yapı
  await payload.update({
    collection: 'service',
    id,
    locale: 'tr',
    overrideAccess: true,
    data: {
      baslik: TR.baslik,
      ozet: TR.ozet,
      chips: TR.chips.map((etiket) => ({ etiket })),
      girisLead: plainToLexical(TR.girisLead),
      girisParagraflar: TR.paragraflar.map((paragraf) => ({ paragraf: plainToLexical(paragraf) })),
      altHizmetler: CARDS.map((c) => ({
        icon: c.icon,
        baslik: c.tr.baslik,
        aciklama: plainToLexical(c.tr.aciklama),
      })),
      surec: STEPS.map((s) => ({ baslik: s.tr.baslik, aciklama: plainToLexical(s.tr.aciklama) })),
    } as unknown as Record<string, unknown>,
  })
  console.log('  ✓ TR yazıldı')

  // 2) id'leri oku
  const fresh = (await payload.findByID({
    collection: 'service',
    id,
    locale: 'tr',
    depth: 0,
    overrideAccess: true,
  })) as unknown as {
    chips?: { id?: string }[]
    girisParagraflar?: { id?: string }[]
    altHizmetler?: { id?: string }[]
    surec?: { id?: string }[]
  }

  // 3) EN — aynı id'lerle
  await payload.update({
    collection: 'service',
    id,
    locale: 'en',
    overrideAccess: true,
    data: {
      baslik: EN.baslik,
      ozet: EN.ozet,
      chips: (fresh.chips ?? []).map((it, i) => ({ id: it.id, etiket: EN.chips[i] })),
      girisLead: plainToLexical(EN.girisLead),
      girisParagraflar: (fresh.girisParagraflar ?? []).map((it, i) => ({
        id: it.id,
        paragraf: plainToLexical(EN.paragraflar[i]),
      })),
      altHizmetler: (fresh.altHizmetler ?? []).map((it, i) => ({
        id: it.id,
        icon: CARDS[i].icon,
        baslik: CARDS[i].en.baslik,
        aciklama: plainToLexical(CARDS[i].en.aciklama),
      })),
      surec: (fresh.surec ?? []).map((it, i) => ({
        id: it.id,
        baslik: STEPS[i].en.baslik,
        aciklama: plainToLexical(STEPS[i].en.aciklama),
      })),
    } as unknown as Record<string, unknown>,
  })
  console.log('  ✓ EN yazıldı')
  console.log('\n✅  Danışmanlık içeriği güncellendi (4 kart + 5 süreç + giriş).')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌  Hata:', err)
  process.exit(1)
})
