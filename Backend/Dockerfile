# syntax=docker/dockerfile:1

# ---- deps: install once, shared by build and runtime prune -----------------
FROM node:20-alpine AS deps
WORKDIR /app
# bcrypt is a native module — Alpine (musl libc) frequently has no matching
# prebuilt binary, so npm falls back to compiling from source and needs a
# toolchain present. Removed again after install to keep the layer small.
RUN apk add --no-cache --virtual .build-deps python3 make g++
COPY package.json package-lock.json ./
RUN npm ci
RUN apk del .build-deps

# ---- build: compile TypeScript + generate the Prisma client ----------------
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- runtime: production deps only + compiled output -----------------------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

RUN apk add --no-cache --virtual .build-deps python3 make g++
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
RUN apk del .build-deps

COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/prisma ./prisma
# The Prisma client is generated into node_modules/@prisma/client and
# node_modules/.prisma — re-run generate against the production
# node_modules so its query engine binary matches what actually ships.
RUN npx prisma generate

USER nodejs
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/v1/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["node", "dist/server.js"]
