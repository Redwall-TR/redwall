import * as Sentry from '@sentry/nextjs';

// Env-gated: DSN yoksa init hiç çağrılmaz → Sentry tamamen inert kalır.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    // Yalnız hata takibi — performans izleme (APM) kapalı.
    tracesSampleRate: 0,
  });
}
