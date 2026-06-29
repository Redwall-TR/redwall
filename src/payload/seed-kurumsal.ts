/**
 * Idempotent seed script — kurumsal içerik (doküman)
 *
 * Usage:  npm run payload:seed-kurumsal
 *
 * Oluşturur / günceller:
 *  • document:    3 placeholder doküman (dosya /admin'de yüklenecek)
 *
 * İdempotentlik: document başlık (tr) ile bulunur; yoksa create
 * (locale:tr), her durumda update (locale:en).
 *
 * NOT: Dokümanlar PLACEHOLDER'dır; gerçek dosya bilgileri Payload
 * admin panelinden (/admin) yüklenmelidir.
 *
 * NOT: `solution` ve `teamMember` koleksiyonları Payload'da durur ancak
 * sitede "Çözümler" / "Ekibimiz" sayfaları şimdilik gösterilmiyor; bu
 * seed o kayıtları oluşturmaz. İleride sayfalar geri açılırsa içerik
 * git geçmişinden geri alınabilir.
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
