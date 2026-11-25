import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_product_landing_bolumler_tur" AS ENUM('adimlar', 'sure', 'teslim', 'ozellikler', 'paketler', 'platformlar', 'gizlilik', 'kapanis');
  CREATE TABLE "product_landing_bolumler_maddeler" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "product_landing_bolumler_maddeler_locales" (
  	"ad" varchar,
  	"etiket" varchar,
  	"metin" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "product_landing_bolumler" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tur" "enum_product_landing_bolumler_tur" NOT NULL
  );
  
  CREATE TABLE "product_landing_bolumler_locales" (
  	"baslik" varchar,
  	"giris" varchar,
  	"not" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "product_landing_paket_satirlari" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "product_landing_paket_satirlari_locales" (
  	"ozellik" varchar,
  	"starter" varchar,
  	"studio" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "product" ADD COLUMN "landing_sure_hedef" numeric;
  ALTER TABLE "product" ADD COLUMN "landing_sure_en_az" numeric;
  ALTER TABLE "product" ADD COLUMN "landing_sure_en_cok" numeric;
  ALTER TABLE "product_locales" ADD COLUMN "landing_durum" varchar;
  ALTER TABLE "product_locales" ADD COLUMN "landing_baslik" varchar;
  ALTER TABLE "product_locales" ADD COLUMN "landing_giris" varchar;
  ALTER TABLE "product_locales" ADD COLUMN "landing_cta" varchar;
  ALTER TABLE "product_landing_bolumler_maddeler" ADD CONSTRAINT "product_landing_bolumler_maddeler_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."product_landing_bolumler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "product_landing_bolumler_maddeler_locales" ADD CONSTRAINT "product_landing_bolumler_maddeler_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."product_landing_bolumler_maddeler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "product_landing_bolumler" ADD CONSTRAINT "product_landing_bolumler_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "product_landing_bolumler_locales" ADD CONSTRAINT "product_landing_bolumler_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."product_landing_bolumler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "product_landing_paket_satirlari" ADD CONSTRAINT "product_landing_paket_satirlari_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "product_landing_paket_satirlari_locales" ADD CONSTRAINT "product_landing_paket_satirlari_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."product_landing_paket_satirlari"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "product_landing_bolumler_maddeler_order_idx" ON "product_landing_bolumler_maddeler" USING btree ("_order");
  CREATE INDEX "product_landing_bolumler_maddeler_parent_id_idx" ON "product_landing_bolumler_maddeler" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "product_landing_bolumler_maddeler_locales_locale_parent_id_u" ON "product_landing_bolumler_maddeler_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "product_landing_bolumler_order_idx" ON "product_landing_bolumler" USING btree ("_order");
  CREATE INDEX "product_landing_bolumler_parent_id_idx" ON "product_landing_bolumler" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "product_landing_bolumler_locales_locale_parent_id_unique" ON "product_landing_bolumler_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "product_landing_paket_satirlari_order_idx" ON "product_landing_paket_satirlari" USING btree ("_order");
  CREATE INDEX "product_landing_paket_satirlari_parent_id_idx" ON "product_landing_paket_satirlari" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "product_landing_paket_satirlari_locales_locale_parent_id_uni" ON "product_landing_paket_satirlari_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "product_landing_bolumler_maddeler" CASCADE;
  DROP TABLE "product_landing_bolumler_maddeler_locales" CASCADE;
  DROP TABLE "product_landing_bolumler" CASCADE;
  DROP TABLE "product_landing_bolumler_locales" CASCADE;
  DROP TABLE "product_landing_paket_satirlari" CASCADE;
  DROP TABLE "product_landing_paket_satirlari_locales" CASCADE;
  ALTER TABLE "product" DROP COLUMN "landing_sure_hedef";
  ALTER TABLE "product" DROP COLUMN "landing_sure_en_az";
  ALTER TABLE "product" DROP COLUMN "landing_sure_en_cok";
  ALTER TABLE "product_locales" DROP COLUMN "landing_durum";
  ALTER TABLE "product_locales" DROP COLUMN "landing_baslik";
  ALTER TABLE "product_locales" DROP COLUMN "landing_giris";
  ALTER TABLE "product_locales" DROP COLUMN "landing_cta";
  DROP TYPE "public"."enum_product_landing_bolumler_tur";`)
}
