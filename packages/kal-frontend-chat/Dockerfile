FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY packages/kal-shared/package.json ./packages/kal-shared/
COPY packages/kal-db/package.json ./packages/kal-db/
COPY packages/kal-baml/package.json ./packages/kal-baml/
COPY packages/kal-backend/package.json ./packages/kal-backend/
COPY packages/kal-frontend-chat/package.json ./packages/kal-frontend-chat/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY packages/kal-shared ./packages/kal-shared
COPY packages/kal-db ./packages/kal-db
COPY packages/kal-baml ./packages/kal-baml
COPY packages/kal-backend ./packages/kal-backend
COPY packages/kal-frontend-chat ./packages/kal-frontend-chat
COPY tsconfig.json ./

RUN pnpm --filter kal-shared build || true
RUN pnpm --filter kal-baml build || true

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
RUN pnpm --filter kal-frontend-chat build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone build output
COPY --from=builder /app/packages/kal-frontend-chat/.next/standalone ./
COPY --from=builder /app/packages/kal-frontend-chat/.next/static ./packages/kal-frontend-chat/.next/static
COPY --from=builder /app/packages/kal-frontend-chat/public ./packages/kal-frontend-chat/public

WORKDIR /app/packages/kal-frontend-chat

EXPOSE 3003

ENV PORT=3003
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
