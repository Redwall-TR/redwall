import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { plainToLexical } from '../lib/lexical/plainToLexical'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // ── service_locales.giris_lead ──────────────────────────────────────────────
  // 1) ALTER'dan önce eski düz-metin değerleri yakala (varchar olarak)
  const existingGirisLead = await db.execute(sql`
    SELECT "_parent_id" AS id, "_locale" AS locale, "giris_lead" AS metin
    FROM "service_locales"
    WHERE "giris_lead" IS NOT NULL AND "giris_lead" <> ''
  `)
  const girisLeadRows = (existingGirisLead.rows ?? existingGirisLead) as unknown as {
    id: number
    locale: string
    metin: string
  }[]

  // 2) Kolon tipini jsonb'a çevir (Payload üretimi; USING ile veri düşürülür, veriyi 1'de yakaladık)
  await db.execute(sql`ALTER TABLE "service_locales" ALTER COLUMN "giris_lead" TYPE jsonb USING NULL;`)

  // 3) Yakalanan düz metni Lexical JSON olarak geri yaz
  for (const r of girisLeadRows) {
    const lex = JSON.stringify(plainToLexical(r.metin))
    await db.execute(sql`
      UPDATE "service_locales"
      SET "giris_lead" = ${lex}::jsonb
      WHERE "_parent_id" = ${r.id} AND "_locale" = ${r.locale}
    `)
  }

  // ── service_giris_paragraflar_locales.paragraf ──────────────────────────────
  // 1) ALTER'dan önce eski düz-metin değerleri yakala (varchar olarak; _parent_id burada varchar)
  const existingParagraf = await db.execute(sql`
    SELECT "_parent_id" AS id, "_locale" AS locale, "paragraf" AS metin
    FROM "service_giris_paragraflar_locales"
    WHERE "paragraf" IS NOT NULL AND "paragraf" <> ''
  `)
  const paragrafRows = (existingParagraf.rows ?? existingParagraf) as unknown as {
    id: string
    locale: string
    metin: string
  }[]

  // 2) Kolon tipini jsonb'a çevir (Payload üretimi; USING ile veri düşürülür, veriyi 1'de yakaladık)
  await db.execute(
    sql`ALTER TABLE "service_giris_paragraflar_locales" ALTER COLUMN "paragraf" TYPE jsonb USING NULL;`,
  )

  // 3) Yakalanan düz metni Lexical JSON olarak geri yaz
  for (const r of paragrafRows) {
    const lex = JSON.stringify(plainToLexical(r.metin))
    await db.execute(sql`
      UPDATE "service_giris_paragraflar_locales"
      SET "paragraf" = ${lex}::jsonb
      WHERE "_parent_id" = ${r.id} AND "_locale" = ${r.locale}
    `)
  }

  // ── service_alt_hizmetler_locales.aciklama ──────────────────────────────────
  // 1) ALTER'dan önce eski düz-metin değerleri yakala (varchar olarak; _parent_id burada varchar)
  const existingAltHizmet = await db.execute(sql`
    SELECT "_parent_id" AS id, "_locale" AS locale, "aciklama" AS metin
    FROM "service_alt_hizmetler_locales"
    WHERE "aciklama" IS NOT NULL AND "aciklama" <> ''
  `)
  const altHizmetRows = (existingAltHizmet.rows ?? existingAltHizmet) as unknown as {
    id: string
    locale: string
    metin: string
  }[]

  // 2) Kolon tipini jsonb'a çevir (Payload üretimi; USING ile veri düşürülür, veriyi 1'de yakaladık)
  await db.execute(
    sql`ALTER TABLE "service_alt_hizmetler_locales" ALTER COLUMN "aciklama" TYPE jsonb USING NULL;`,
  )

  // 3) Yakalanan düz metni Lexical JSON olarak geri yaz
  for (const r of altHizmetRows) {
    const lex = JSON.stringify(plainToLexical(r.metin))
    await db.execute(sql`
      UPDATE "service_alt_hizmetler_locales"
      SET "aciklama" = ${lex}::jsonb
      WHERE "_parent_id" = ${r.id} AND "_locale" = ${r.locale}
    `)
  }

  // ── service_surec_locales.aciklama ──────────────────────────────────────────
  // 1) ALTER'dan önce eski düz-metin değerleri yakala (varchar olarak; _parent_id burada varchar)
  const existingSurec = await db.execute(sql`
    SELECT "_parent_id" AS id, "_locale" AS locale, "aciklama" AS metin
    FROM "service_surec_locales"
    WHERE "aciklama" IS NOT NULL AND "aciklama" <> ''
  `)
  const surecRows = (existingSurec.rows ?? existingSurec) as unknown as {
    id: string
    locale: string
    metin: string
  }[]

  // 2) Kolon tipini jsonb'a çevir (Payload üretimi; USING ile veri düşürülür, veriyi 1'de yakaladık)
  await db.execute(sql`ALTER TABLE "service_surec_locales" ALTER COLUMN "aciklama" TYPE jsonb USING NULL;`)

  // 3) Yakalanan düz metni Lexical JSON olarak geri yaz
  for (const r of surecRows) {
    const lex = JSON.stringify(plainToLexical(r.metin))
    await db.execute(sql`
      UPDATE "service_surec_locales"
      SET "aciklama" = ${lex}::jsonb
      WHERE "_parent_id" = ${r.id} AND "_locale" = ${r.locale}
    `)
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // jsonb → varchar (Lexical'den düz metne dönüş yapılmaz; boşaltılır)
  await db.execute(sql`ALTER TABLE "service_locales" ALTER COLUMN "giris_lead" TYPE varchar USING NULL;`)
  await db.execute(
    sql`ALTER TABLE "service_giris_paragraflar_locales" ALTER COLUMN "paragraf" TYPE varchar USING NULL;`,
  )
  await db.execute(
    sql`ALTER TABLE "service_alt_hizmetler_locales" ALTER COLUMN "aciklama" TYPE varchar USING NULL;`,
  )
  await db.execute(sql`ALTER TABLE "service_surec_locales" ALTER COLUMN "aciklama" TYPE varchar USING NULL;`)
}
