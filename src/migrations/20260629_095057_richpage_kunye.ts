import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_rich_page_kategori" AS ENUM('legal', 'kurumsal', 'redwall');
  CREATE TABLE "rich_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"kategori" "enum_rich_page_kategori" DEFAULT 'kurumsal',
  	"son_guncelleme" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "rich_page_locales" (
  	"baslik" varchar NOT NULL,
  	"icerik" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "rich_page_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "kunye_mersis_no" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "kunye_ticaret_sicil_no" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "kunye_kep_adresi" varchar;
  ALTER TABLE "rich_page_locales" ADD CONSTRAINT "rich_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rich_page"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "rich_page_slug_idx" ON "rich_page" USING btree ("slug");
  CREATE INDEX "rich_page_updated_at_idx" ON "rich_page" USING btree ("updated_at");
  CREATE INDEX "rich_page_created_at_idx" ON "rich_page" USING btree ("created_at");
  CREATE UNIQUE INDEX "rich_page_locales_locale_parent_id_unique" ON "rich_page_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rich_page_fk" FOREIGN KEY ("rich_page_id") REFERENCES "public"."rich_page"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_rich_page_id_idx" ON "payload_locked_documents_rels" USING btree ("rich_page_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rich_page" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "rich_page_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "rich_page" CASCADE;
  DROP TABLE "rich_page_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_rich_page_fk";
  
  DROP INDEX "payload_locked_documents_rels_rich_page_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "rich_page_id";
  ALTER TABLE "site_settings" DROP COLUMN "kunye_mersis_no";
  ALTER TABLE "site_settings" DROP COLUMN "kunye_ticaret_sicil_no";
  ALTER TABLE "site_settings" DROP COLUMN "kunye_kep_adresi";
  DROP TYPE "public"."enum_rich_page_kategori";`)
}
