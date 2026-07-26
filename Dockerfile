# syntax=docker/dockerfile:1

# FormOS production image.
#
# IMPORTANT: package.json's `npm run build` runs `prisma migrate deploy`, which
# needs a live database. We must NOT do that during `docker build` (no DB, and
# migrating at image-build time is wrong). So here we only run
# `prisma generate && next build`. Migrations are applied at container START by
# docker-entrypoint.sh, right before the server boots.
#
# Debian slim (not alpine) is used on purpose: Prisma + bcrypt/pg native modules
# are more reliable against glibc + OpenSSL than against alpine/musl.

# ---- Base: shared OS layer with OpenSSL for Prisma ----
FROM node:22-bookworm-slim AS base
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- Deps: install node_modules (needs build tools for bcrypt/pg) ----
FROM base AS deps
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
# schema is needed because `postinstall` runs `prisma generate`
COPY prisma ./prisma
RUN npm ci

# ---- Build: compile Next.js (no DB access here) ----
FROM deps AS build
COPY . .
# NEXT_PUBLIC_* values are inlined into the client bundle at build time.
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npx next build

# ---- Runner: lean-ish runtime image ----
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001

# Run as non-root
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nextjs

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/postcss.config.mjs ./postcss.config.mjs
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/scripts ./scripts
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh && chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3001
ENTRYPOINT ["docker-entrypoint.sh"]
# scripts/start.js -> `next start -H 0.0.0.0 -p $PORT`
CMD ["npm", "start"]
