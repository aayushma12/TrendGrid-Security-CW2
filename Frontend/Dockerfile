# syntax=docker/dockerfile:1

# ---- deps --------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build ---------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, not
# read at container start — must be a build ARG, not a runtime env var. It
# needs to be reachable from the *browser*, so the compose default is the
# host-mapped port (http://localhost:5000/...), not the Docker-internal
# service hostname.
ARG NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# prisma.config.ts (Prisma 7) hard-fails to even load if DATABASE_URL isn't
# resolvable at all — not just unreachable, genuinely unset throws a
# PrismaConfigEnvError before generation starts. .dockerignore correctly
# excludes .env* from the build context, so there's nothing to read it from
# here. `generate` never actually connects to the database, it only needs
# the URL to be a syntactically present string — this placeholder is never
# used for a real connection and doesn't survive into the runtime stage
# (multi-stage builds don't inherit ENV across a FROM boundary).
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate
RUN npm run build

# ---- runtime: Next.js standalone output only, nothing else ---------------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
# Next.js's standalone file tracer doesn't always pick up the generated
# Prisma client's query-engine binary — copy it explicitly rather than
# depend on that working.
COPY --from=build --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
