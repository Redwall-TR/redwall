import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_solution_ikon" AS ENUM('shield-check', 'clipboard', 'ruler', 'hard-hat', 'building', 'key', 'droplet', 'wall', 'wrench', 'refresh', 'code', 'flame', 'gauge', 'document');
  CREATE TABLE "solution" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"ikon" "enum_solution_ikon",
  	"sira" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "solution_locales" (
  	"baslik" varchar NOT NULL,
  	"ozet" varchar,
  	"icerik" jsonb,
  	"hedef_kitle" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "team_member" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ad" varchar NOT NULL,
  	"foto_id" integer,
  	"linkedin" varchar,
  	"sira" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "team_member_locales" (
  	"unvan" varchar,
  	"bio" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "document" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"dosya_id" integer,
  	"sira" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "document_locales" (
  	"baslik" varchar NOT NULL,
  	"aciklama" varchar,
  	"kategori" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "solution_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "team_member_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "document_id" integer;
  ALTER TABLE "solution_locales" ADD CONSTRAINT "solution_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."solution"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_member" ADD CONSTRAINT "team_member_foto_id_media_id_fk" FOREIGN KEY ("foto_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_member_locales" ADD CONSTRAINT "team_member_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_member"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "document" ADD CONSTRAINT "document_dosya_id_media_id_fk" FOREIGN KEY ("dosya_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "document_locales" ADD CONSTRAINT "document_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "solution_slug_idx" ON "solution" USING btree ("slug");
  CREATE INDEX "solution_updated_at_idx" ON "solution" USING btree ("updated_at");
  CREATE INDEX "solution_created_at_idx" ON "solution" USING btree ("created_at");
  CREATE UNIQUE INDEX "solution_locales_locale_parent_id_unique" ON "solution_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "team_member_foto_idx" ON "team_member" USING btree ("foto_id");
  CREATE INDEX "team_member_updated_at_idx" ON "team_member" USING btree ("updated_at");
  CREATE INDEX "team_member_created_at_idx" ON "team_member" USING btree ("created_at");
  CREATE UNIQUE INDEX "team_member_locales_locale_parent_id_unique" ON "team_member_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "document_dosya_idx" ON "document" USING btree ("dosya_id");
  CREATE INDEX "document_updated_at_idx" ON "document" USING btree ("updated_at");
  CREATE INDEX "document_created_at_idx" ON "document" USING btree ("created_at");
  CREATE UNIQUE INDEX "document_locales_locale_parent_id_unique" ON "document_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_solution_fk" FOREIGN KEY ("solution_id") REFERENCES "public"."solution"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_team_member_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_member"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_document_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_solution_id_idx" ON "payload_locked_documents_rels" USING btree ("solution_id");
  CREATE INDEX "payload_locked_documents_rels_team_member_id_idx" ON "payload_locked_documents_rels" USING btree ("team_member_id");
  CREATE INDEX "payload_locked_documents_rels_document_id_idx" ON "payload_locked_documents_rels" USING btree ("document_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "solution" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "solution_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "team_member" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "team_member_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "document" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "document_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "solution" CASCADE;
  DROP TABLE "solution_locales" CASCADE;
  DROP TABLE "team_member" CASCADE;
  DROP TABLE "team_member_locales" CASCADE;
  DROP TABLE "document" CASCADE;
  DROP TABLE "document_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_solution_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_team_member_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_document_fk";
  
  DROP INDEX "payload_locked_documents_rels_solution_id_idx";
  DROP INDEX "payload_locked_documents_rels_team_member_id_idx";
  DROP INDEX "payload_locked_documents_rels_document_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "solution_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "team_member_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "document_id";
  DROP TYPE "public"."enum_solution_ikon";`)
}
