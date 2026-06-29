import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_form_gonderimi_tur" AS ENUM('iletisim', 'teklif', 'demo');
  CREATE TABLE "form_gonderimi" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tur" "enum_form_gonderimi_tur" NOT NULL,
  	"ad" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"telefon" varchar,
  	"kurum" varchar,
  	"is_kolu" varchar,
  	"il" varchar,
  	"metrekare" varchar,
  	"urun" varchar,
  	"mesaj" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "form_gonderimi_id" integer;
  CREATE INDEX "form_gonderimi_updated_at_idx" ON "form_gonderimi" USING btree ("updated_at");
  CREATE INDEX "form_gonderimi_created_at_idx" ON "form_gonderimi" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_form_gonderimi_fk" FOREIGN KEY ("form_gonderimi_id") REFERENCES "public"."form_gonderimi"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_form_gonderimi_id_idx" ON "payload_locked_documents_rels" USING btree ("form_gonderimi_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "form_gonderimi" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "form_gonderimi" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_form_gonderimi_fk";
  
  DROP INDEX "payload_locked_documents_rels_form_gonderimi_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "form_gonderimi_id";
  DROP TYPE "public"."enum_form_gonderimi_tur";`)
}
