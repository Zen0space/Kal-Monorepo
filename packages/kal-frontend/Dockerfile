FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app

# Copy workspace files  
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./

# Copy package files
COPY packages/kal-shared/package.json ./packages/kal-shared/
COPY packages/kal-backend/package.json ./packages/kal-backend/
COPY packages/kal-frontend/package.json ./packages/kal-frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copy source
COPY packages/kal-shared ./packages/kal-shared
COPY packages/kal-backend ./packages/kal-backend
COPY packages/kal-frontend ./packages/kal-frontend
COPY tsconfig.json ./

# Build shared first
RUN pnpm --filter kal-shared build || true

# Build frontend
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter kal-frontend build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/packages/kal-frontend/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/packages/kal-frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/kal-frontend/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
