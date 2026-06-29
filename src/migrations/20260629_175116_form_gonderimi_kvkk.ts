import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_form_gonderimi_tur" ADD VALUE 'kvkk';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "form_gonderimi" ALTER COLUMN "tur" SET DATA TYPE text;
  DROP TYPE "public"."enum_form_gonderimi_tur";
  CREATE TYPE "public"."enum_form_gonderimi_tur" AS ENUM('iletisim', 'teklif', 'demo');
  ALTER TABLE "form_gonderimi" ALTER COLUMN "tur" SET DATA TYPE "public"."enum_form_gonderimi_tur" USING "tur"::"public"."enum_form_gonderimi_tur";`)
}
