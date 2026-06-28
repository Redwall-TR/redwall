import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_service_alt_hizmetler_icon" AS ENUM('shield-check', 'clipboard', 'ruler', 'hard-hat', 'building', 'key', 'droplet', 'wall', 'wrench', 'refresh', 'code', 'flame', 'gauge', 'document');
  CREATE TYPE "public"."enum_service_is_kolu" AS ENUM('yazilim', 'danismanlik', 'muhendislik');
  CREATE TYPE "public"."enum_product_ozellikler_icon" AS ENUM('shield-check', 'clipboard', 'ruler', 'hard-hat', 'building', 'key', 'droplet', 'wall', 'wrench', 'refresh', 'code', 'flame', 'gauge', 'document');
  CREATE TABLE "service_chips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "service_chips_locales" (
  	"etiket" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "service_giris_paragraflar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "service_giris_paragraflar_locales" (
  	"paragraf" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "service_alt_hizmetler" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_service_alt_hizmetler_icon"
  );
  
  CREATE TABLE "service_alt_hizmetler_locales" (
  	"baslik" varchar,
  	"aciklama" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "service_surec" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "service_surec_locales" (
  	"baslik" varchar,
  	"aciklama" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "service" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"is_kolu" "enum_service_is_kolu" NOT NULL,
  	"sira" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "service_locales" (
  	"baslik" varchar NOT NULL,
  	"ozet" varchar,
  	"giris_lead" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "product_ozellikler" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_product_ozellikler_icon"
  );
  
  CREATE TABLE "product_ozellikler_locales" (
  	"baslik" varchar,
  	"aciklama" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "product_hedef_kitle" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "product_hedef_kitle_locales" (
  	"madde" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "product_ekran_gorselleri" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"gorsel_id" integer
  );
  
  CREATE TABLE "product" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"ad" varchar NOT NULL,
  	"sira" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "product_locales" (
  	"slogan" varchar,
  	"aciklama" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "referans" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ad" varchar NOT NULL,
  	"logo_id" integer,
  	"anasayfada" boolean DEFAULT false,
  	"gorus_kisi" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "referans_locales" (
  	"gorus_metin" varchar,
  	"gorus_unvan" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "service_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "product_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "referans_id" integer;
  ALTER TABLE "service_chips" ADD CONSTRAINT "service_chips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "service_chips_locales" ADD CONSTRAINT "service_chips_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service_chips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "service_giris_paragraflar" ADD CONSTRAINT "service_giris_paragraflar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "service_giris_paragraflar_locales" ADD CONSTRAINT "service_giris_paragraflar_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service_giris_paragraflar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "service_alt_hizmetler" ADD CONSTRAINT "service_alt_hizmetler_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "service_alt_hizmetler_locales" ADD CONSTRAINT "service_alt_hizmetler_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service_alt_hizmetler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "service_surec" ADD CONSTRAINT "service_surec_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "service_surec_locales" ADD CONSTRAINT "service_surec_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service_surec"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "service_locales" ADD CONSTRAINT "service_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "product_ozellikler" ADD CONSTRAINT "product_ozellikler_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "product_ozellikler_locales" ADD CONSTRAINT "product_ozellikler_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."product_ozellikler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "product_hedef_kitle" ADD CONSTRAINT "product_hedef_kitle_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "product_hedef_kitle_locales" ADD CONSTRAINT "product_hedef_kitle_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."product_hedef_kitle"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "product_ekran_gorselleri" ADD CONSTRAINT "product_ekran_gorselleri_gorsel_id_media_id_fk" FOREIGN KEY ("gorsel_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "product_ekran_gorselleri" ADD CONSTRAINT "product_ekran_gorselleri_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "product_locales" ADD CONSTRAINT "product_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "referans" ADD CONSTRAINT "referans_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "referans_locales" ADD CONSTRAINT "referans_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."referans"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "service_chips_order_idx" ON "service_chips" USING btree ("_order");
  CREATE INDEX "service_chips_parent_id_idx" ON "service_chips" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "service_chips_locales_locale_parent_id_unique" ON "service_chips_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "service_giris_paragraflar_order_idx" ON "service_giris_paragraflar" USING btree ("_order");
  CREATE INDEX "service_giris_paragraflar_parent_id_idx" ON "service_giris_paragraflar" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "service_giris_paragraflar_locales_locale_parent_id_unique" ON "service_giris_paragraflar_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "service_alt_hizmetler_order_idx" ON "service_alt_hizmetler" USING btree ("_order");
  CREATE INDEX "service_alt_hizmetler_parent_id_idx" ON "service_alt_hizmetler" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "service_alt_hizmetler_locales_locale_parent_id_unique" ON "service_alt_hizmetler_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "service_surec_order_idx" ON "service_surec" USING btree ("_order");
  CREATE INDEX "service_surec_parent_id_idx" ON "service_surec" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "service_surec_locales_locale_parent_id_unique" ON "service_surec_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "service_updated_at_idx" ON "service" USING btree ("updated_at");
  CREATE INDEX "service_created_at_idx" ON "service" USING btree ("created_at");
  CREATE UNIQUE INDEX "service_locales_locale_parent_id_unique" ON "service_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "product_ozellikler_order_idx" ON "product_ozellikler" USING btree ("_order");
  CREATE INDEX "product_ozellikler_parent_id_idx" ON "product_ozellikler" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "product_ozellikler_locales_locale_parent_id_unique" ON "product_ozellikler_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "product_hedef_kitle_order_idx" ON "product_hedef_kitle" USING btree ("_order");
  CREATE INDEX "product_hedef_kitle_parent_id_idx" ON "product_hedef_kitle" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "product_hedef_kitle_locales_locale_parent_id_unique" ON "product_hedef_kitle_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "product_ekran_gorselleri_order_idx" ON "product_ekran_gorselleri" USING btree ("_order");
  CREATE INDEX "product_ekran_gorselleri_parent_id_idx" ON "product_ekran_gorselleri" USING btree ("_parent_id");
  CREATE INDEX "product_ekran_gorselleri_gorsel_idx" ON "product_ekran_gorselleri" USING btree ("gorsel_id");
  CREATE UNIQUE INDEX "product_slug_idx" ON "product" USING btree ("slug");
  CREATE INDEX "product_updated_at_idx" ON "product" USING btree ("updated_at");
  CREATE INDEX "product_created_at_idx" ON "product" USING btree ("created_at");
  CREATE UNIQUE INDEX "product_locales_locale_parent_id_unique" ON "product_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "referans_logo_idx" ON "referans" USING btree ("logo_id");
  CREATE INDEX "referans_updated_at_idx" ON "referans" USING btree ("updated_at");
  CREATE INDEX "referans_created_at_idx" ON "referans" USING btree ("created_at");
  CREATE UNIQUE INDEX "referans_locales_locale_parent_id_unique" ON "referans_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_service_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_product_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_referans_fk" FOREIGN KEY ("referans_id") REFERENCES "public"."referans"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_service_id_idx" ON "payload_locked_documents_rels" USING btree ("service_id");
  CREATE INDEX "payload_locked_documents_rels_product_id_idx" ON "payload_locked_documents_rels" USING btree ("product_id");
  CREATE INDEX "payload_locked_documents_rels_referans_id_idx" ON "payload_locked_documents_rels" USING btree ("referans_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "service_chips" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "service_chips_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "service_giris_paragraflar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "service_giris_paragraflar_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "service_alt_hizmetler" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "service_alt_hizmetler_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "service_surec" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "service_surec_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "service" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "service_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "product_ozellikler" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "product_ozellikler_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "product_hedef_kitle" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "product_hedef_kitle_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "product_ekran_gorselleri" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "product" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "product_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "referans" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "referans_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "service_chips" CASCADE;
  DROP TABLE "service_chips_locales" CASCADE;
  DROP TABLE "service_giris_paragraflar" CASCADE;
  DROP TABLE "service_giris_paragraflar_locales" CASCADE;
  DROP TABLE "service_alt_hizmetler" CASCADE;
  DROP TABLE "service_alt_hizmetler_locales" CASCADE;
  DROP TABLE "service_surec" CASCADE;
  DROP TABLE "service_surec_locales" CASCADE;
  DROP TABLE "service" CASCADE;
  DROP TABLE "service_locales" CASCADE;
  DROP TABLE "product_ozellikler" CASCADE;
  DROP TABLE "product_ozellikler_locales" CASCADE;
  DROP TABLE "product_hedef_kitle" CASCADE;
  DROP TABLE "product_hedef_kitle_locales" CASCADE;
  DROP TABLE "product_ekran_gorselleri" CASCADE;
  DROP TABLE "product" CASCADE;
  DROP TABLE "product_locales" CASCADE;
  DROP TABLE "referans" CASCADE;
  DROP TABLE "referans_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_service_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_product_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_referans_fk";
  
  DROP INDEX "payload_locked_documents_rels_service_id_idx";
  DROP INDEX "payload_locked_documents_rels_product_id_idx";
  DROP INDEX "payload_locked_documents_rels_referans_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "service_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "product_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "referans_id";
  DROP TYPE "public"."enum_service_alt_hizmetler_icon";
  DROP TYPE "public"."enum_service_is_kolu";
  DROP TYPE "public"."enum_product_ozellikler_icon";`)
}
