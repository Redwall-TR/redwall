import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { backfillReferansSlugs } from '../payload/backfillReferansSlug'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "referans" ADD COLUMN "slug" varchar;
  ALTER TABLE "project" ADD COLUMN "referans_id" integer;
  ALTER TABLE "project" ADD CONSTRAINT "project_referans_id_referans_id_fk" FOREIGN KEY ("referans_id") REFERENCES "public"."referans"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "referans_slug_idx" ON "referans" USING btree ("slug");
  CREATE INDEX "project_referans_idx" ON "project" USING btree ("referans_id");`)

  // Mevcut referans satırlarına benzersiz slug doldur.
  // req MUTLAKA geçilir → backfill bu migration'ın transaction'ında çalışır;
  // ayrı bağlantı açıp ALTER/CREATE INDEX'in ACCESS EXCLUSIVE kilidiyle
  // deadlock olmaz (önceki deploy bu yüzden 14dk asılıp timeout olmuştu).
  await backfillReferansSlugs(payload, req)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "project" DROP CONSTRAINT "project_referans_id_referans_id_fk";
  
  DROP INDEX "referans_slug_idx";
  DROP INDEX "project_referans_idx";
  ALTER TABLE "referans" DROP COLUMN "slug";
  ALTER TABLE "project" DROP COLUMN "referans_id";`)
}
