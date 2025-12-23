FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS builder
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY packages/kal-shared/package.json ./packages/kal-shared/
COPY packages/kal-backend/package.json ./packages/kal-backend/
RUN pnpm install --frozen-lockfile

COPY packages/kal-shared ./packages/kal-shared
COPY packages/kal-backend ./packages/kal-backend
COPY tsconfig.json ./

RUN pnpm --filter kal-shared build || true
RUN pnpm --filter kal-backend build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy package files and install production deps
COPY packages/kal-backend/package.json ./
RUN npm install --omit=dev

# Copy built files
COPY --from=builder /app/packages/kal-backend/dist ./dist

EXPOSE 4000
CMD ["node", "dist/index.js"]
