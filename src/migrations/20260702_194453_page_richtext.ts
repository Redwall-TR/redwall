import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { plainToLexical } from '../lib/lexical/plainToLexical'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // ── page_locales.giris_lead ──────────────────────────────────────────────
  // 1) ALTER'dan önce eski düz-metin değerleri yakala (varchar olarak)
  const existingGirisLead = await db.execute(sql`
    SELECT "_parent_id" AS id, "_locale" AS locale, "giris_lead" AS metin
    FROM "page_locales"
    WHERE "giris_lead" IS NOT NULL AND "giris_lead" <> ''
  `)
  const girisLeadRows = (existingGirisLead.rows ?? existingGirisLead) as unknown as {
    id: number
    locale: string
    metin: string
  }[]

  // 2) Kolon tipini jsonb'a çevir (Payload üretimi; USING ile veri düşürülür, veriyi 1'de yakaladık)
  await db.execute(sql`ALTER TABLE "page_locales" ALTER COLUMN "giris_lead" TYPE jsonb USING NULL;`)

  // 3) Yakalanan düz metni Lexical JSON olarak geri yaz
  for (const r of girisLeadRows) {
    const lex = JSON.stringify(plainToLexical(r.metin))
    await db.execute(sql`
      UPDATE "page_locales"
      SET "giris_lead" = ${lex}::jsonb
      WHERE "_parent_id" = ${r.id} AND "_locale" = ${r.locale}
    `)
  }

  // ── page_giris_paragraflar_locales.paragraf ─────────────────────────────
  // 1) ALTER'dan önce eski düz-metin değerleri yakala (varchar olarak; _parent_id burada varchar)
  const existingParagraf = await db.execute(sql`
    SELECT "_parent_id" AS id, "_locale" AS locale, "paragraf" AS metin
    FROM "page_giris_paragraflar_locales"
    WHERE "paragraf" IS NOT NULL AND "paragraf" <> ''
  `)
  const paragrafRows = (existingParagraf.rows ?? existingParagraf) as unknown as {
    id: string
    locale: string
    metin: string
  }[]

  // 2) Kolon tipini jsonb'a çevir (Payload üretimi; USING ile veri düşürülür, veriyi 1'de yakaladık)
  await db.execute(
    sql`ALTER TABLE "page_giris_paragraflar_locales" ALTER COLUMN "paragraf" TYPE jsonb USING NULL;`,
  )

  // 3) Yakalanan düz metni Lexical JSON olarak geri yaz
  for (const r of paragrafRows) {
    const lex = JSON.stringify(plainToLexical(r.metin))
    await db.execute(sql`
      UPDATE "page_giris_paragraflar_locales"
      SET "paragraf" = ${lex}::jsonb
      WHERE "_parent_id" = ${r.id} AND "_locale" = ${r.locale}
    `)
  }

  // ── page_locales.vizyon_metin ────────────────────────────────────────────
  // 1) ALTER'dan önce eski düz-metin değerleri yakala (varchar olarak)
  const existingVizyonMetin = await db.execute(sql`
    SELECT "_parent_id" AS id, "_locale" AS locale, "vizyon_metin" AS metin
    FROM "page_locales"
    WHERE "vizyon_metin" IS NOT NULL AND "vizyon_metin" <> ''
  `)
  const vizyonMetinRows = (existingVizyonMetin.rows ?? existingVizyonMetin) as unknown as {
    id: number
    locale: string
    metin: string
  }[]

  // 2) Kolon tipini jsonb'a çevir (Payload üretimi; USING ile veri düşürülür, veriyi 1'de yakaladık)
  await db.execute(sql`ALTER TABLE "page_locales" ALTER COLUMN "vizyon_metin" TYPE jsonb USING NULL;`)

  // 3) Yakalanan düz metni Lexical JSON olarak geri yaz
  for (const r of vizyonMetinRows) {
    const lex = JSON.stringify(plainToLexical(r.metin))
    await db.execute(sql`
      UPDATE "page_locales"
      SET "vizyon_metin" = ${lex}::jsonb
      WHERE "_parent_id" = ${r.id} AND "_locale" = ${r.locale}
    `)
  }

  // ── page_locales.misyon_metin ────────────────────────────────────────────
  // 1) ALTER'dan önce eski düz-metin değerleri yakala (varchar olarak)
  const existingMisyonMetin = await db.execute(sql`
    SELECT "_parent_id" AS id, "_locale" AS locale, "misyon_metin" AS metin
    FROM "page_locales"
    WHERE "misyon_metin" IS NOT NULL AND "misyon_metin" <> ''
  `)
  const misyonMetinRows = (existingMisyonMetin.rows ?? existingMisyonMetin) as unknown as {
    id: number
    locale: string
    metin: string
  }[]

  // 2) Kolon tipini jsonb'a çevir (Payload üretimi; USING ile veri düşürülür, veriyi 1'de yakaladık)
  await db.execute(sql`ALTER TABLE "page_locales" ALTER COLUMN "misyon_metin" TYPE jsonb USING NULL;`)

  // 3) Yakalanan düz metni Lexical JSON olarak geri yaz
  for (const r of misyonMetinRows) {
    const lex = JSON.stringify(plainToLexical(r.metin))
    await db.execute(sql`
      UPDATE "page_locales"
      SET "misyon_metin" = ${lex}::jsonb
      WHERE "_parent_id" = ${r.id} AND "_locale" = ${r.locale}
    `)
  }

  // ── page_kartlar_locales.aciklama ───────────────────────────────────────
  // 1) ALTER'dan önce eski düz-metin değerleri yakala (varchar olarak; _parent_id burada varchar)
  const existingKartlarAciklama = await db.execute(sql`
    SELECT "_parent_id" AS id, "_locale" AS locale, "aciklama" AS metin
    FROM "page_kartlar_locales"
    WHERE "aciklama" IS NOT NULL AND "aciklama" <> ''
  `)
  const kartlarAciklamaRows = (existingKartlarAciklama.rows ?? existingKartlarAciklama) as unknown as {
    id: string
    locale: string
    metin: string
  }[]

  // 2) Kolon tipini jsonb'a çevir (Payload üretimi; USING ile veri düşürülür, veriyi 1'de yakaladık)
  await db.execute(sql`ALTER TABLE "page_kartlar_locales" ALTER COLUMN "aciklama" TYPE jsonb USING NULL;`)

  // 3) Yakalanan düz metni Lexical JSON olarak geri yaz
  for (const r of kartlarAciklamaRows) {
    const lex = JSON.stringify(plainToLexical(r.metin))
    await db.execute(sql`
      UPDATE "page_kartlar_locales"
      SET "aciklama" = ${lex}::jsonb
      WHERE "_parent_id" = ${r.id} AND "_locale" = ${r.locale}
    `)
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // jsonb → varchar (Lexical'den düz metne dönüş yapılmaz; boşaltılır)
  await db.execute(sql`ALTER TABLE "page_locales" ALTER COLUMN "giris_lead" TYPE varchar USING NULL;`)
  await db.execute(
    sql`ALTER TABLE "page_giris_paragraflar_locales" ALTER COLUMN "paragraf" TYPE varchar USING NULL;`,
  )
  await db.execute(sql`ALTER TABLE "page_locales" ALTER COLUMN "vizyon_metin" TYPE varchar USING NULL;`)
  await db.execute(sql`ALTER TABLE "page_locales" ALTER COLUMN "misyon_metin" TYPE varchar USING NULL;`)
  await db.execute(
    sql`ALTER TABLE "page_kartlar_locales" ALTER COLUMN "aciklama" TYPE varchar USING NULL;`,
  )
}
