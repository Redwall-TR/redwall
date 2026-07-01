import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "marka_navbar_logo_acik_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "marka_navbar_logo_koyu_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "marka_footer_logo_acik_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "marka_footer_logo_koyu_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "marka_favicon_id" integer;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_marka_navbar_logo_acik_id_media_id_fk" FOREIGN KEY ("marka_navbar_logo_acik_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_marka_navbar_logo_koyu_id_media_id_fk" FOREIGN KEY ("marka_navbar_logo_koyu_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_marka_footer_logo_acik_id_media_id_fk" FOREIGN KEY ("marka_footer_logo_acik_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_marka_footer_logo_koyu_id_media_id_fk" FOREIGN KEY ("marka_footer_logo_koyu_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_marka_favicon_id_media_id_fk" FOREIGN KEY ("marka_favicon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "site_settings_marka_marka_navbar_logo_acik_idx" ON "site_settings" USING btree ("marka_navbar_logo_acik_id");
  CREATE INDEX "site_settings_marka_marka_navbar_logo_koyu_idx" ON "site_settings" USING btree ("marka_navbar_logo_koyu_id");
  CREATE INDEX "site_settings_marka_marka_footer_logo_acik_idx" ON "site_settings" USING btree ("marka_footer_logo_acik_id");
  CREATE INDEX "site_settings_marka_marka_footer_logo_koyu_idx" ON "site_settings" USING btree ("marka_footer_logo_koyu_id");
  CREATE INDEX "site_settings_marka_marka_favicon_idx" ON "site_settings" USING btree ("marka_favicon_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_marka_navbar_logo_acik_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_marka_navbar_logo_koyu_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_marka_footer_logo_acik_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_marka_footer_logo_koyu_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_marka_favicon_id_media_id_fk";
  
  DROP INDEX "site_settings_marka_marka_navbar_logo_acik_idx";
  DROP INDEX "site_settings_marka_marka_navbar_logo_koyu_idx";
  DROP INDEX "site_settings_marka_marka_footer_logo_acik_idx";
  DROP INDEX "site_settings_marka_marka_footer_logo_koyu_idx";
  DROP INDEX "site_settings_marka_marka_favicon_idx";
  ALTER TABLE "site_settings" DROP COLUMN "marka_navbar_logo_acik_id";
  ALTER TABLE "site_settings" DROP COLUMN "marka_navbar_logo_koyu_id";
  ALTER TABLE "site_settings" DROP COLUMN "marka_footer_logo_acik_id";
  ALTER TABLE "site_settings" DROP COLUMN "marka_footer_logo_koyu_id";
  ALTER TABLE "site_settings" DROP COLUMN "marka_favicon_id";`)
}
