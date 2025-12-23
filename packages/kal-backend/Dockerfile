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

# Install dependencies
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/kal-shared/node_modules ./packages/kal-shared/node_modules
COPY --from=deps /app/packages/kal-backend/node_modules ./packages/kal-backend/node_modules

# Copy source
COPY packages/kal-shared ./packages/kal-shared
COPY packages/kal-backend ./packages/kal-backend
COPY tsconfig.json ./

# Build
RUN pnpm --filter kal-shared build || true
RUN pnpm --filter kal-backend build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built files
COPY --from=builder /app/packages/kal-backend/dist ./dist
COPY --from=builder /app/packages/kal-backend/node_modules ./node_modules
COPY --from=builder /app/packages/kal-shared ./packages/kal-shared

EXPOSE 4000

CMD ["node", "dist/index.js"]
