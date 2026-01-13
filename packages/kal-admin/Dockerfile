FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY packages/kal-shared/package.json ./packages/kal-shared/
COPY packages/kal-baml/package.json ./packages/kal-baml/
COPY packages/kal-backend/package.json ./packages/kal-backend/
COPY packages/kal-admin/package.json ./packages/kal-admin/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY packages/kal-shared ./packages/kal-shared
COPY packages/kal-baml ./packages/kal-baml
COPY packages/kal-backend ./packages/kal-backend
COPY packages/kal-admin ./packages/kal-admin
COPY tsconfig.json ./

# Build shared packages
RUN pnpm --filter kal-baml build || true
RUN pnpm --filter kal-shared build || true

# Build arguments for Next.js
ARG NEXT_PUBLIC_API_URL
ARG ADMIN_SECRET
ARG ADMIN_USERNAME
ARG ADMIN_PASSWORD

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV ADMIN_SECRET=$ADMIN_SECRET
ENV ADMIN_USERNAME=$ADMIN_USERNAME
ENV ADMIN_PASSWORD=$ADMIN_PASSWORD

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter kal-admin build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone build output
COPY --from=builder /app/packages/kal-admin/.next/standalone ./
COPY --from=builder /app/packages/kal-admin/.next/static ./packages/kal-admin/.next/static
COPY --from=builder /app/packages/kal-admin/public ./packages/kal-admin/public

WORKDIR /app/packages/kal-admin

EXPOSE 3005

ENV PORT=3005
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
