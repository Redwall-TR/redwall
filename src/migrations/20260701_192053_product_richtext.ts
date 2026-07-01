import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { plainToLexical } from '../lib/lexical/plainToLexical'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // ── product_locales.aciklama ────────────────────────────────────────────────
  // 1) ALTER'dan önce eski düz-metin değerleri yakala (varchar olarak)
  const existingProduct = await db.execute(sql`
    SELECT "_parent_id" AS id, "_locale" AS locale, "aciklama" AS metin
    FROM "product_locales"
    WHERE "aciklama" IS NOT NULL AND "aciklama" <> ''
  `)
  const productRows = (existingProduct.rows ?? existingProduct) as unknown as {
    id: number
    locale: string
    metin: string
  }[]

  // 2) Kolon tipini jsonb'a çevir (Payload üretimi; USING ile veri düşürülür, veriyi 1'de yakaladık)
  await db.execute(sql`ALTER TABLE "product_locales" ALTER COLUMN "aciklama" TYPE jsonb USING NULL;`)

  // 3) Yakalanan düz metni Lexical JSON olarak geri yaz
  for (const r of productRows) {
    const lex = JSON.stringify(plainToLexical(r.metin))
    await db.execute(sql`
      UPDATE "product_locales"
      SET "aciklama" = ${lex}::jsonb
      WHERE "_parent_id" = ${r.id} AND "_locale" = ${r.locale}
    `)
  }

  // ── product_ozellikler_locales.aciklama ─────────────────────────────────────
  // 1) ALTER'dan önce eski düz-metin değerleri yakala (varchar olarak)
  const existingOzellik = await db.execute(sql`
    SELECT "_parent_id" AS id, "_locale" AS locale, "aciklama" AS metin
    FROM "product_ozellikler_locales"
    WHERE "aciklama" IS NOT NULL AND "aciklama" <> ''
  `)
  const ozellikRows = (existingOzellik.rows ?? existingOzellik) as unknown as {
    id: number
    locale: string
    metin: string
  }[]

  // 2) Kolon tipini jsonb'a çevir (Payload üretimi; USING ile veri düşürülür, veriyi 1'de yakaladık)
  await db.execute(
    sql`ALTER TABLE "product_ozellikler_locales" ALTER COLUMN "aciklama" TYPE jsonb USING NULL;`,
  )

  // 3) Yakalanan düz metni Lexical JSON olarak geri yaz
  for (const r of ozellikRows) {
    const lex = JSON.stringify(plainToLexical(r.metin))
    await db.execute(sql`
      UPDATE "product_ozellikler_locales"
      SET "aciklama" = ${lex}::jsonb
      WHERE "_parent_id" = ${r.id} AND "_locale" = ${r.locale}
    `)
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // jsonb → varchar (Lexical'den düz metne dönüş yapılmaz; boşaltılır)
  await db.execute(sql`ALTER TABLE "product_locales" ALTER COLUMN "aciklama" TYPE varchar USING NULL;`)
  await db.execute(
    sql`ALTER TABLE "product_ozellikler_locales" ALTER COLUMN "aciklama" TYPE varchar USING NULL;`,
  )
}
