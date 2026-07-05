import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "form_rate_limit" (
      "ip" varchar(64) NOT NULL,
      "hit_at" bigint NOT NULL
    );
  `)
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "form_rate_limit_ip_hit_at_idx" ON "form_rate_limit" ("ip", "hit_at");`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "form_rate_limit";`)
}
