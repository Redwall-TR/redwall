import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { withPayload } from '@payloadcms/next/withPayload';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Self-contained server build → small Docker image (.next/standalone/server.js).
  // The runner stage copies only this + .next/static + public.
  output: 'standalone',

  experimental: {
    serverActions: {
      // Server Action origin allowlist — proxy arkasında spoofed Host ile
      // same-origin kontrolünün gevşetilmesini engeller (localhost dev zaten
      // same-origin olduğu için etkilenmez).
      allowedOrigins: ['redwall.tr', 'www.redwall.tr'],
      // Form gönderimleri küçük; oversized payload'ları sınırla (DoS amplifikasyonu).
      bodySizeLimit: '100kb',
    },
  },

  // Güvenlik yanıt başlıkları (tüm rotalar). Tam CSP (script-src/style-src) bilinçli
  // olarak eklenmedi (Payload /admin'in inline script/style'larını ve next'i bozabilir);
  // clickjacking koruması frame-ancestors 'self' + X-Frame-Options ile sağlanır.
  // frame-src ile dışarı açılan iframe'ler allowlist'e alındı: OSM haritası
  // (/tr/iletisim) + Medya Gömme bloğunun desteklediği 4 platform (YouTube, Vimeo,
  // SoundCloud, Spotify). Allowlist dışı iframe'ler bloklanır.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; frame-src 'self' https://www.openstreetmap.org https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com https://w.soundcloud.com https://open.spotify.com" },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default withPayload(withNextIntl(nextConfig));
