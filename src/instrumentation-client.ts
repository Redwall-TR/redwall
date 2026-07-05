import * as Sentry from '@sentry/nextjs';

// Env-gated: NEXT_PUBLIC_SENTRY_DSN yoksa init hiç çağrılmaz → Sentry client tamamen inert kalır.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    // Yalnız hata takibi — performans izleme (APM) kapalı.
    tracesSampleRate: 0,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
