FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS builder
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY packages/kal-shared/package.json ./packages/kal-shared/
COPY packages/kal-db/package.json ./packages/kal-db/
COPY packages/kal-backend/package.json ./packages/kal-backend/
RUN pnpm install --frozen-lockfile

COPY packages/kal-shared ./packages/kal-shared
COPY packages/kal-db ./packages/kal-db
COPY packages/kal-backend ./packages/kal-backend
COPY tsconfig.json ./

RUN pnpm --filter kal-shared build || true
RUN pnpm --filter kal-backend build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy everything needed from builder (including node_modules)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/kal-backend/dist ./packages/kal-backend/dist
COPY --from=builder /app/packages/kal-backend/package.json ./packages/kal-backend/
COPY --from=builder /app/packages/kal-backend/node_modules ./packages/kal-backend/node_modules
COPY --from=builder /app/packages/kal-backend/scripts ./packages/kal-backend/scripts
COPY --from=builder /app/packages/kal-shared ./packages/kal-shared

# Copy kal-db for migrations
COPY --from=builder /app/packages/kal-db ./packages/kal-db

# Copy entrypoint script
COPY packages/kal-backend/scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

WORKDIR /app/packages/kal-backend
EXPOSE 3000
CMD ["/entrypoint.sh"]

