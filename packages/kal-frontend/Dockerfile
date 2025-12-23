FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY packages/kal-shared/package.json ./packages/kal-shared/
COPY packages/kal-backend/package.json ./packages/kal-backend/
COPY packages/kal-frontend/package.json ./packages/kal-frontend/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY packages/kal-shared ./packages/kal-shared
COPY packages/kal-backend ./packages/kal-backend
COPY packages/kal-frontend ./packages/kal-frontend
COPY tsconfig.json ./

RUN pnpm --filter kal-shared build || true

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter kal-frontend build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy everything needed to run
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/kal-frontend/node_modules ./packages/kal-frontend/node_modules
COPY --from=builder /app/packages/kal-frontend/.next ./packages/kal-frontend/.next
COPY --from=builder /app/packages/kal-frontend/public ./packages/kal-frontend/public
COPY --from=builder /app/packages/kal-frontend/package.json ./packages/kal-frontend/
COPY --from=builder /app/packages/kal-frontend/next.config.mjs ./packages/kal-frontend/

WORKDIR /app/packages/kal-frontend

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "start"]
