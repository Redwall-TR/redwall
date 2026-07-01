import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { plainToLexical } from '../lib/lexical/plainToLexical'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // 1) ALTER'dan önce eski düz-metin değerleri yakala (varchar olarak)
  const existing = await db.execute(sql`
    SELECT "_parent_id" AS id, "_locale" AS locale, "gorus_metin" AS metin
    FROM "referans_locales"
    WHERE "gorus_metin" IS NOT NULL AND "gorus_metin" <> ''
  `)
  const rows = (existing.rows ?? existing) as unknown as { id: number; locale: string; metin: string }[]

  // 2) Kolon tipini jsonb'a çevir (Payload üretimi; USING ile veri düşürülür, veriyi 1'de yakaladık)
  await db.execute(sql`ALTER TABLE "referans_locales" ALTER COLUMN "gorus_metin" TYPE jsonb USING NULL;`)

  // 3) Yakalanan düz metni Lexical JSON olarak geri yaz
  for (const r of rows) {
    const lex = JSON.stringify(plainToLexical(r.metin))
    await db.execute(sql`
      UPDATE "referans_locales"
      SET "gorus_metin" = ${lex}::jsonb
      WHERE "_parent_id" = ${r.id} AND "_locale" = ${r.locale}
    `)
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // jsonb → varchar (Lexical'den düz metne dönüş yapılmaz; boşaltılır)
  await db.execute(sql`ALTER TABLE "referans_locales" ALTER COLUMN "gorus_metin" TYPE varchar USING NULL;`)
}
