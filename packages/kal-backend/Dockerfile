FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY packages/kal-shared/package.json ./packages/kal-shared/
COPY packages/kal-backend/package.json ./packages/kal-backend/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app ./
COPY packages/kal-shared ./packages/kal-shared
COPY packages/kal-backend ./packages/kal-backend
COPY tsconfig.json ./
RUN pnpm --filter kal-shared build || true
RUN pnpm --filter kal-backend build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built files and ALL node_modules
COPY --from=builder /app/packages/kal-backend/dist ./dist
COPY --from=builder /app/packages/kal-backend/package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/kal-backend/node_modules ./packages/kal-backend/node_modules

EXPOSE 4000
CMD ["node", "dist/index.js"]
