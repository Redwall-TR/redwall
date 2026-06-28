import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { withPayload } from '@payloadcms/next/withPayload';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Self-contained server build → small Docker image (.next/standalone/server.js).
  // The runner stage copies only this + .next/static + public.
  output: 'standalone',
  images: {
    // Sanity-hosted reference/project logos served through next/image.
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },
};

export default withPayload(withNextIntl(nextConfig));
