import { config as dotenvConfig } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenvConfig({ path: resolve(__dirname, '../../.env.local') })
dotenvConfig({ path: resolve(__dirname, '../../.env') })

const { default: config } = await import('../../payload.config')
const { getPayload } = await import('payload')
const { backfillReferansSlugs } = await import('./backfillReferansSlug')

async function main() {
  const payload = await getPayload({ config })
  console.log('🌱  Referans slug backfill başlıyor…')
  const n = await backfillReferansSlugs(payload)
  console.log(`✅  ${n} referans slug ile dolduruldu.`)
  process.exit(0)
}

main().catch((err) => {
  console.error('❌  Backfill hatası:', err)
  process.exit(1)
})
