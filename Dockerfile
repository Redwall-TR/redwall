# syntax=docker/dockerfile:1.7
# Redwall — Next.js 16 (standalone) production image.
# Multi-stage: deps → builder → runner. Final image runs as non-root on :3000.

# ---------- Base ----------
FROM node:22-alpine AS base
# libc6-compat: native deps (sharp/sanity) expect glibc symbols on Alpine.
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---------- Dependencies ----------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Builder ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* are inlined into the client bundle at build time, so they MUST
# be present during `next build`. They are not secrets (they ship to the browser).
ARG NEXT_PUBLIC_SANITY_PROJECT_ID
ARG NEXT_PUBLIC_SANITY_DATASET
ARG NEXT_PUBLIC_SANITY_API_VERSION
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_SANITY_PROJECT_ID=$NEXT_PUBLIC_SANITY_PROJECT_ID \
    NEXT_PUBLIC_SANITY_DATASET=$NEXT_PUBLIC_SANITY_DATASET \
    NEXT_PUBLIC_SANITY_API_VERSION=$NEXT_PUBLIC_SANITY_API_VERSION \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY

RUN npm run build

# ---------- Tools (tek-seferlik job'lar: payload migrate, Sanity import) ----------
# Tam node_modules (tsx + payload CLI dahil) + kaynak. Servis olarak deploy EDİLMEZ;
# yalnız `docker run --rm --network <stack>_app-internal <tools-image> <cmd>` ile çağrılır.
FROM builder AS tools
ENV NODE_ENV=production
CMD ["npx", "payload", "migrate"]

# ---------- Runner ----------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Run as an unprivileged user.
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Standalone build = self-contained server.js + traced node_modules.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Liveness: hit a real localized route (/ → 307 to /tr; /tr → 200).
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/tr >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
