import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_page_kartlar_icon" AS ENUM('shield-check', 'clipboard', 'ruler', 'hard-hat', 'building', 'key', 'droplet', 'wall', 'wrench', 'refresh', 'code', 'flame', 'gauge', 'document');
  CREATE TYPE "public"."enum_faq_kategori" AS ENUM('genel', 'yazilim', 'danismanlik', 'muhendislik');
  CREATE TYPE "public"."enum_project_is_kolu" AS ENUM('yazilim', 'danismanlik', 'muhendislik');
  CREATE TYPE "public"."enum_project_durum" AS ENUM('devam-eden', 'tamamlandi');
  CREATE TABLE "page_chips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "page_chips_locales" (
  	"etiket" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "page_giris_paragraflar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "page_giris_paragraflar_locales" (
  	"paragraf" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "page_kartlar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_page_kartlar_icon"
  );
  
  CREATE TABLE "page_kartlar_locales" (
  	"baslik" varchar,
  	"aciklama" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "page_locales" (
  	"baslik" varchar NOT NULL,
  	"alt_baslik" varchar,
  	"giris_lead" varchar,
  	"vizyon_baslik" varchar,
  	"vizyon_metin" varchar,
  	"misyon_baslik" varchar,
  	"misyon_metin" varchar,
  	"kartlar_eyebrow" varchar,
  	"kartlar_baslik" varchar,
  	"kartlar_aciklama" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "faq" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kategori" "enum_faq_kategori",
  	"sira" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "faq_locales" (
  	"soru" varchar NOT NULL,
  	"cevap" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "post_etiketler" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"etiket" varchar
  );
  
  CREATE TABLE "post" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"tarih" timestamp(3) with time zone,
  	"kapak_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "post_locales" (
  	"baslik" varchar NOT NULL,
  	"ozet" varchar,
  	"icerik" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "job" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"lokasyon" varchar,
  	"tip" varchar,
  	"aktif" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "job_locales" (
  	"baslik" varchar NOT NULL,
  	"aciklama" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "project_gorseller" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"gorsel_id" integer
  );
  
  CREATE TABLE "project" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"musteri" varchar,
  	"is_kolu" "enum_project_is_kolu",
  	"durum" "enum_project_durum",
  	"yil" numeric,
  	"il" varchar,
  	"one_cikan" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "project_locales" (
  	"baslik" varchar NOT NULL,
  	"kapsam" varchar,
  	"ozet" varchar,
  	"aciklama" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "site_settings_istatistikler" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"deger" varchar
  );
  
  CREATE TABLE "site_settings_istatistikler_locales" (
  	"etiket" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"sirket_adi" varchar NOT NULL,
  	"iletisim_tel" varchar,
  	"iletisim_email" varchar,
  	"sosyal_linkedin" varchar,
  	"sosyal_instagram" varchar,
  	"sosyal_youtube" varchar,
  	"sosyal_x" varchar,
  	"sosyal_facebook" varchar,
  	"sosyal_whatsapp" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_settings_locales" (
  	"iletisim_adres" varchar,
  	"calisma_saatleri" varchar,
  	"seo_baslik" varchar,
  	"seo_aciklama" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "navigation_header_links_alt" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar
  );
  
  CREATE TABLE "navigation_header_links_alt_locales" (
  	"etiket" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_header_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar
  );
  
  CREATE TABLE "navigation_header_links_locales" (
  	"etiket" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_footer_kolonlari_linkler" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar
  );
  
  CREATE TABLE "navigation_footer_kolonlari_linkler_locales" (
  	"etiket" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_footer_kolonlari" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "navigation_footer_kolonlari_locales" (
  	"baslik" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_birincil_cta_href" varchar,
  	"hero_ikincil_cta_href" varchar,
  	"one_cikan_urun_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_page_locales" (
  	"hero_baslik" varchar NOT NULL,
  	"hero_alt_metin" varchar,
  	"hero_birincil_cta_etiket" varchar,
  	"hero_ikincil_cta_etiket" varchar,
  	"yaklasim" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "page_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "faq_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "post_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "job_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "project_id" integer;
  ALTER TABLE "page_chips" ADD CONSTRAINT "page_chips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_chips_locales" ADD CONSTRAINT "page_chips_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_chips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_giris_paragraflar" ADD CONSTRAINT "page_giris_paragraflar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_giris_paragraflar_locales" ADD CONSTRAINT "page_giris_paragraflar_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_giris_paragraflar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_kartlar" ADD CONSTRAINT "page_kartlar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_kartlar_locales" ADD CONSTRAINT "page_kartlar_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_kartlar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_locales" ADD CONSTRAINT "page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "faq_locales" ADD CONSTRAINT "faq_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "post_etiketler" ADD CONSTRAINT "post_etiketler_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "post" ADD CONSTRAINT "post_kapak_id_media_id_fk" FOREIGN KEY ("kapak_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "post_locales" ADD CONSTRAINT "post_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "job_locales" ADD CONSTRAINT "job_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."job"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "project_gorseller" ADD CONSTRAINT "project_gorseller_gorsel_id_media_id_fk" FOREIGN KEY ("gorsel_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "project_gorseller" ADD CONSTRAINT "project_gorseller_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "project_locales" ADD CONSTRAINT "project_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_istatistikler" ADD CONSTRAINT "site_settings_istatistikler_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_istatistikler_locales" ADD CONSTRAINT "site_settings_istatistikler_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_istatistikler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_locales" ADD CONSTRAINT "site_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_header_links_alt" ADD CONSTRAINT "navigation_header_links_alt_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_header_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_header_links_alt_locales" ADD CONSTRAINT "navigation_header_links_alt_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_header_links_alt"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_header_links" ADD CONSTRAINT "navigation_header_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_header_links_locales" ADD CONSTRAINT "navigation_header_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_header_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_kolonlari_linkler" ADD CONSTRAINT "navigation_footer_kolonlari_linkler_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_footer_kolonlari"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_kolonlari_linkler_locales" ADD CONSTRAINT "navigation_footer_kolonlari_linkler_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_footer_kolonlari_linkler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_kolonlari" ADD CONSTRAINT "navigation_footer_kolonlari_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_kolonlari_locales" ADD CONSTRAINT "navigation_footer_kolonlari_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_footer_kolonlari"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_one_cikan_urun_id_product_id_fk" FOREIGN KEY ("one_cikan_urun_id") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page_locales" ADD CONSTRAINT "home_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "page_chips_order_idx" ON "page_chips" USING btree ("_order");
  CREATE INDEX "page_chips_parent_id_idx" ON "page_chips" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "page_chips_locales_locale_parent_id_unique" ON "page_chips_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "page_giris_paragraflar_order_idx" ON "page_giris_paragraflar" USING btree ("_order");
  CREATE INDEX "page_giris_paragraflar_parent_id_idx" ON "page_giris_paragraflar" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "page_giris_paragraflar_locales_locale_parent_id_unique" ON "page_giris_paragraflar_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "page_kartlar_order_idx" ON "page_kartlar" USING btree ("_order");
  CREATE INDEX "page_kartlar_parent_id_idx" ON "page_kartlar" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "page_kartlar_locales_locale_parent_id_unique" ON "page_kartlar_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "page_slug_idx" ON "page" USING btree ("slug");
  CREATE INDEX "page_updated_at_idx" ON "page" USING btree ("updated_at");
  CREATE INDEX "page_created_at_idx" ON "page" USING btree ("created_at");
  CREATE UNIQUE INDEX "page_locales_locale_parent_id_unique" ON "page_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "faq_updated_at_idx" ON "faq" USING btree ("updated_at");
  CREATE INDEX "faq_created_at_idx" ON "faq" USING btree ("created_at");
  CREATE UNIQUE INDEX "faq_locales_locale_parent_id_unique" ON "faq_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "post_etiketler_order_idx" ON "post_etiketler" USING btree ("_order");
  CREATE INDEX "post_etiketler_parent_id_idx" ON "post_etiketler" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "post_slug_idx" ON "post" USING btree ("slug");
  CREATE INDEX "post_kapak_idx" ON "post" USING btree ("kapak_id");
  CREATE INDEX "post_updated_at_idx" ON "post" USING btree ("updated_at");
  CREATE INDEX "post_created_at_idx" ON "post" USING btree ("created_at");
  CREATE UNIQUE INDEX "post_locales_locale_parent_id_unique" ON "post_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "job_slug_idx" ON "job" USING btree ("slug");
  CREATE INDEX "job_updated_at_idx" ON "job" USING btree ("updated_at");
  CREATE INDEX "job_created_at_idx" ON "job" USING btree ("created_at");
  CREATE UNIQUE INDEX "job_locales_locale_parent_id_unique" ON "job_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "project_gorseller_order_idx" ON "project_gorseller" USING btree ("_order");
  CREATE INDEX "project_gorseller_parent_id_idx" ON "project_gorseller" USING btree ("_parent_id");
  CREATE INDEX "project_gorseller_gorsel_idx" ON "project_gorseller" USING btree ("gorsel_id");
  CREATE UNIQUE INDEX "project_slug_idx" ON "project" USING btree ("slug");
  CREATE INDEX "project_updated_at_idx" ON "project" USING btree ("updated_at");
  CREATE INDEX "project_created_at_idx" ON "project" USING btree ("created_at");
  CREATE UNIQUE INDEX "project_locales_locale_parent_id_unique" ON "project_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_istatistikler_order_idx" ON "site_settings_istatistikler" USING btree ("_order");
  CREATE INDEX "site_settings_istatistikler_parent_id_idx" ON "site_settings_istatistikler" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_istatistikler_locales_locale_parent_id_unique" ON "site_settings_istatistikler_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "site_settings_locales_locale_parent_id_unique" ON "site_settings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_header_links_alt_order_idx" ON "navigation_header_links_alt" USING btree ("_order");
  CREATE INDEX "navigation_header_links_alt_parent_id_idx" ON "navigation_header_links_alt" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_header_links_alt_locales_locale_parent_id_unique" ON "navigation_header_links_alt_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_header_links_order_idx" ON "navigation_header_links" USING btree ("_order");
  CREATE INDEX "navigation_header_links_parent_id_idx" ON "navigation_header_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_header_links_locales_locale_parent_id_unique" ON "navigation_header_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_footer_kolonlari_linkler_order_idx" ON "navigation_footer_kolonlari_linkler" USING btree ("_order");
  CREATE INDEX "navigation_footer_kolonlari_linkler_parent_id_idx" ON "navigation_footer_kolonlari_linkler" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_footer_kolonlari_linkler_locales_locale_parent_id" ON "navigation_footer_kolonlari_linkler_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_footer_kolonlari_order_idx" ON "navigation_footer_kolonlari" USING btree ("_order");
  CREATE INDEX "navigation_footer_kolonlari_parent_id_idx" ON "navigation_footer_kolonlari" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_footer_kolonlari_locales_locale_parent_id_unique" ON "navigation_footer_kolonlari_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_page_one_cikan_urun_idx" ON "home_page" USING btree ("one_cikan_urun_id");
  CREATE UNIQUE INDEX "home_page_locales_locale_parent_id_unique" ON "home_page_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_page_fk" FOREIGN KEY ("page_id") REFERENCES "public"."page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faq_fk" FOREIGN KEY ("faq_id") REFERENCES "public"."faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_post_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_job_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_project_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_page_id_idx" ON "payload_locked_documents_rels" USING btree ("page_id");
  CREATE INDEX "payload_locked_documents_rels_faq_id_idx" ON "payload_locked_documents_rels" USING btree ("faq_id");
  CREATE INDEX "payload_locked_documents_rels_post_id_idx" ON "payload_locked_documents_rels" USING btree ("post_id");
  CREATE INDEX "payload_locked_documents_rels_job_id_idx" ON "payload_locked_documents_rels" USING btree ("job_id");
  CREATE INDEX "payload_locked_documents_rels_project_id_idx" ON "payload_locked_documents_rels" USING btree ("project_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "page_chips" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "page_chips_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "page_giris_paragraflar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "page_giris_paragraflar_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "page_kartlar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "page_kartlar_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "page" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "page_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "faq_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "post_etiketler" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "post" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "post_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "job" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "job_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "project_gorseller" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "project" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "project_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_istatistikler" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_istatistikler_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_header_links_alt" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_header_links_alt_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_header_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_header_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_footer_kolonlari_linkler" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_footer_kolonlari_linkler_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_footer_kolonlari" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_footer_kolonlari_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "page_chips" CASCADE;
  DROP TABLE "page_chips_locales" CASCADE;
  DROP TABLE "page_giris_paragraflar" CASCADE;
  DROP TABLE "page_giris_paragraflar_locales" CASCADE;
  DROP TABLE "page_kartlar" CASCADE;
  DROP TABLE "page_kartlar_locales" CASCADE;
  DROP TABLE "page" CASCADE;
  DROP TABLE "page_locales" CASCADE;
  DROP TABLE "faq" CASCADE;
  DROP TABLE "faq_locales" CASCADE;
  DROP TABLE "post_etiketler" CASCADE;
  DROP TABLE "post" CASCADE;
  DROP TABLE "post_locales" CASCADE;
  DROP TABLE "job" CASCADE;
  DROP TABLE "job_locales" CASCADE;
  DROP TABLE "project_gorseller" CASCADE;
  DROP TABLE "project" CASCADE;
  DROP TABLE "project_locales" CASCADE;
  DROP TABLE "site_settings_istatistikler" CASCADE;
  DROP TABLE "site_settings_istatistikler_locales" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "site_settings_locales" CASCADE;
  DROP TABLE "navigation_header_links_alt" CASCADE;
  DROP TABLE "navigation_header_links_alt_locales" CASCADE;
  DROP TABLE "navigation_header_links" CASCADE;
  DROP TABLE "navigation_header_links_locales" CASCADE;
  DROP TABLE "navigation_footer_kolonlari_linkler" CASCADE;
  DROP TABLE "navigation_footer_kolonlari_linkler_locales" CASCADE;
  DROP TABLE "navigation_footer_kolonlari" CASCADE;
  DROP TABLE "navigation_footer_kolonlari_locales" CASCADE;
  DROP TABLE "navigation" CASCADE;
  DROP TABLE "home_page" CASCADE;
  DROP TABLE "home_page_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_page_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_faq_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_post_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_job_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_project_fk";
  
  DROP INDEX "payload_locked_documents_rels_page_id_idx";
  DROP INDEX "payload_locked_documents_rels_faq_id_idx";
  DROP INDEX "payload_locked_documents_rels_post_id_idx";
  DROP INDEX "payload_locked_documents_rels_job_id_idx";
  DROP INDEX "payload_locked_documents_rels_project_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "page_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "faq_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "post_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "job_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "project_id";
  DROP TYPE "public"."enum_page_kartlar_icon";
  DROP TYPE "public"."enum_faq_kategori";
  DROP TYPE "public"."enum_project_is_kolu";
  DROP TYPE "public"."enum_project_durum";`)
}
