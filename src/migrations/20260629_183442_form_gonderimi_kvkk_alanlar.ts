import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "form_gonderimi" ADD COLUMN "basvuru_sahibi_sifati" varchar;
  ALTER TABLE "form_gonderimi" ADD COLUMN "talep_turu" varchar;
  ALTER TABLE "form_gonderimi" ADD COLUMN "kvkk_onay" boolean;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "form_gonderimi" DROP COLUMN "basvuru_sahibi_sifati";
  ALTER TABLE "form_gonderimi" DROP COLUMN "talep_turu";
  ALTER TABLE "form_gonderimi" DROP COLUMN "kvkk_onay";`)
}
