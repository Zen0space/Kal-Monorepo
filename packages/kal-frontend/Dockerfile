FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY packages/kal-shared/package.json ./packages/kal-shared/
COPY packages/kal-baml/package.json ./packages/kal-baml/
COPY packages/kal-backend/package.json ./packages/kal-backend/
COPY packages/kal-frontend/package.json ./packages/kal-frontend/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY packages/kal-shared ./packages/kal-shared
COPY packages/kal-baml ./packages/kal-baml
COPY packages/kal-backend ./packages/kal-backend
COPY packages/kal-frontend ./packages/kal-frontend
COPY tsconfig.json ./

# Build kal-baml first (required by kal-backend)
RUN pnpm --filter kal-baml build || true
RUN pnpm --filter kal-shared build || true

# Build arguments for Next.js (NEXT_PUBLIC_* are embedded at build time)
ARG NEXT_PUBLIC_LOGTO_ENDPOINT
ARG NEXT_PUBLIC_LOGTO_APP_ID
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_URL
# Server-side secrets also needed at build time for Next.js server components
ARG LOGTO_APP_SECRET
ARG SESSION_SECRET

ENV NEXT_PUBLIC_LOGTO_ENDPOINT=$NEXT_PUBLIC_LOGTO_ENDPOINT
ENV NEXT_PUBLIC_LOGTO_APP_ID=$NEXT_PUBLIC_LOGTO_APP_ID
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV LOGTO_APP_SECRET=$LOGTO_APP_SECRET
ENV SESSION_SECRET=$SESSION_SECRET

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter kal-frontend build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone build output
COPY --from=builder /app/packages/kal-frontend/.next/standalone ./
COPY --from=builder /app/packages/kal-frontend/.next/static ./packages/kal-frontend/.next/static
COPY --from=builder /app/packages/kal-frontend/public ./packages/kal-frontend/public

WORKDIR /app/packages/kal-frontend

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
