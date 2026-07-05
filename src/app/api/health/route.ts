import { getPayloadClient } from '@/lib/cms/client';
import { sql } from '@payloadcms/db-postgres';

export const dynamic = 'force-dynamic';

/** Sağlık kontrolü: uygulama + DB. Uptime Kuma bu URL'i izler. */
export async function GET() {
  const ts = new Date().toISOString();
  try {
    const payload = await getPayloadClient();
    await payload.db.drizzle.execute(sql`SELECT 1`);
    return Response.json({ status: 'ok', db: 'ok', ts }, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[health] DB ping başarısız:', err);
    return Response.json({ status: 'degraded', db: 'error', ts }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
