# Deployment Architecture Migration

> **Goal:** Move frontend deployments to Vercel, keep only backend on VPS with pre-built Docker images from GitHub Actions.

**Current State:**

- All services (backend, frontend, frontend-chat, admin) built and run on VPS via Docker Compose
- Coolify orchestrates deployments by pulling repo and building on VPS

**Target State:**

- `kal-frontend` → Vercel
- `kal-admin` → Vercel
- `kal-frontend-chat` → **DELETED**
- `kal-backend` → VPS (Docker image built in CI, pushed to GHCR, pulled on VPS)

---

## Prerequisites

Before starting, gather these values:

| Value                        | Description                               | How to get                                    |
| ---------------------------- | ----------------------------------------- | --------------------------------------------- |
| GitHub org/user              | Your GitHub username or organization name | Check `github.com/<this>`                     |
| `VERCEL_TOKEN`               | Vercel API token                          | Vercel Dashboard → Settings → Tokens → Create |
| `VERCEL_ORG_ID`              | Vercel team/org ID                        | Run `vercel whoami` or check dashboard URL    |
| `VERCEL_PROJECT_ID_FRONTEND` | Vercel project ID for kal-frontend        | Create project first, then get from dashboard |
| `VERCEL_PROJECT_ID_ADMIN`    | Vercel project ID for kal-admin           | Create project first, then get from dashboard |

---

## Phase 1 — Root `.dockerignore`

**File:** `/.dockerignore` (create at monorepo root)

All Dockerfiles use `context: ..` (monorepo root). Without a root `.dockerignore`, Docker sends the entire repo including all `node_modules`, `.next`, and `dist` folders to the build daemon.

**Create file with contents:**

```
.git
.github
**/.env*
!**/.env.example
**/node_modules
**/.next
**/dist
**/baml_client
**/*.log
**/.DS_Store
packages/kal-frontend-chat
```

**Verification:**

```bash
ls -la .dockerignore
```

---

## Phase 2 — Backend: CI builds and pushes to GHCR

**File:** `.github/workflows/ci.yml`

Replace the existing `docker-build` job (validate-only, `push: false`) with `docker-publish` that actually pushes to GitHub Container Registry.

**Replace the `docker-build` job with:**

```yaml
docker-publish:
  name: Build & Push Backend Image
  runs-on: ubuntu-latest
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  needs: build
  permissions:
    contents: read
    packages: write
  steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Login to GitHub Container Registry
      uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Build and push
      uses: docker/build-push-action@v5
      with:
        context: .
        file: ./packages/kal-backend/Dockerfile
        push: true
        tags: |
          ghcr.io/${{ github.repository }}/kal-backend:latest
          ghcr.io/${{ github.repository }}/kal-backend:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
```

**No new secrets needed** — `GITHUB_TOKEN` is automatically provided by GitHub Actions.

**Verification:**

- Push to `main` branch
- Check Actions tab for successful `docker-publish` job
- Verify image at `ghcr.io/<your-org>/kal-monorepo/kal-backend`

---

## Phase 3 — Backend: docker-compose uses pre-built GHCR image

**File:** `docker/docker-compose.yml`

1. Remove `frontend`, `frontend-chat`, `admin` service blocks
2. Replace `backend.build:` with `image:`
3. Remove `profiles: ["apps"]` from backend
4. Remove `CHAT_FRONTEND_URL` from backend environment

**New backend service block:**

```yaml
backend:
  image: ghcr.io/<YOUR_GITHUB_ORG>/kal-monorepo/kal-backend:latest
  container_name: kal-backend
  ports:
    - "${BACKEND_PORT:-4000}:3000"
  environment:
    - NODE_ENV=production
    - MONGODB_URI=mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@mongodb:27017/${MONGODB_DATABASE}?authSource=admin
    - REDIS_URL=redis://redis:6379
    - LOGTO_ENDPOINT=${LOGTO_ENDPOINT}
    - LOGTO_APP_ID=${LOGTO_APP_ID}
    - LOGTO_APP_SECRET=${LOGTO_APP_SECRET}
    - SESSION_SECRET=${SESSION_SECRET}
    - GLM_API_BASE_URL=${GLM_API_BASE_URL}
    - GLM_API_KEY=${GLM_API_KEY}
    - INTERNAL_API_KEY=${INTERNAL_API_KEY}
    - FRONTEND_URL=${FRONTEND_URL}
  depends_on:
    - mongodb
    - logto
    - redis
  networks:
    - kal-network
```

**Remove these service blocks entirely:**

- `frontend`
- `frontend-chat`
- `admin`

**VPS update workflow (manual, after merge to main):**

```bash
docker compose -f docker/docker-compose.yml pull backend
docker compose -f docker/docker-compose.yml up -d backend
```

**Verification:**

```bash
docker compose -f docker/docker-compose.yml config
docker compose -f docker/docker-compose.yml pull backend
```

---

## Phase 4 — Remove `kal-frontend-chat`

Full cleanup of the chat frontend package.

**Steps:**

1. Delete `packages/kal-frontend-chat/` directory
2. No changes needed to `pnpm-workspace.yaml` (uses `packages/*` glob)
3. No changes needed to `turbo.json` (no package-specific overrides)

**Commands:**

```bash
rm -rf packages/kal-frontend-chat
```

**Verification:**

```bash
ls packages/  # Should NOT show kal-frontend-chat
pnpm install  # Should succeed without errors
```

---

## Phase 5 — Prepare `kal-frontend` for Vercel

**File:** `packages/kal-frontend/vercel.json` (create)

This configures Vercel to build from monorepo root with correct dependency order.

**Create file with contents:**

```json
{
  "framework": "nextjs",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm turbo build --filter=kal-frontend",
  "outputDirectory": ".next"
}
```

**Note:** `kal-frontend/next.config.mjs` requires NO changes — it's already using default Next.js output mode (compatible with Vercel).

**Verification:**

```bash
cat packages/kal-frontend/vercel.json
```

---

## Phase 6 — Prepare `kal-admin` for Vercel

**File:** `packages/kal-admin/next.config.ts` (modify)

Remove `output: "standalone"` and `outputFileTracingRoot` — these are for Docker self-hosted deployments and conflict with Vercel's build system.

**Change FROM:**

```typescript
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
```

**Change TO:**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
};

export default nextConfig;
```

**File:** `packages/kal-admin/vercel.json` (create)

**Create file with contents:**

```json
{
  "framework": "nextjs",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm turbo build --filter=kal-admin",
  "outputDirectory": ".next"
}
```

**Verification:**

```bash
cat packages/kal-admin/next.config.ts
cat packages/kal-admin/vercel.json
```

---

## Phase 7 — Vercel Auto-Deploy (no CI needed)

Vercel deploys are handled automatically by connecting the repo directly in the Vercel dashboard.
No CI changes are needed — no Vercel secrets in GitHub required.

**How it works:**

- Push to `dev` → Vercel builds a **preview deployment**
- Push/merge to `main` → Vercel builds a **production deployment**
- Vercel reads `vercel.json` in each package automatically and runs the correct build command

**CI pipeline (final state):**

```
lint-and-typecheck
       │
     build
       │
  docker-publish
  (GHCR — backend only)
```

Vercel watches the GitHub repo independently and deploys `kal-frontend` and `kal-admin` on its own.

---

## Phase 8 — Vercel Project Setup (Manual — Dashboard Only)

### 8.1 Create Project for `kal-frontend`

1. Go to [vercel.com](https://vercel.com) → Add New → Project
2. Import `Kal-Monorepo` from GitHub
3. Set **Root Directory** to `packages/kal-frontend`
4. Framework Preset: Next.js (auto-detected)
5. Leave Build Command and Output Directory as default — `vercel.json` overrides them
6. Click Deploy

### 8.2 Create Project for `kal-admin`

1. Go to [vercel.com](https://vercel.com) → Add New → Project
2. Import the **same** `Kal-Monorepo` repo
3. Set **Root Directory** to `packages/kal-admin`
4. Framework Preset: Next.js (auto-detected)
5. Click Deploy

### 8.3 Add Environment Variables

In each Vercel project: Project → Settings → Environment Variables

**kal-frontend:**

| Variable                     | Description                                        |
| ---------------------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_LOGTO_ENDPOINT` | Logto endpoint URL                                 |
| `NEXT_PUBLIC_LOGTO_APP_ID`   | Logto app ID                                       |
| `NEXT_PUBLIC_APP_URL`        | Frontend production URL                            |
| `NEXT_PUBLIC_API_URL`        | Backend API URL (e.g. `https://kalori-api.my/api`) |
| `LOGTO_APP_SECRET`           | Logto app secret (server-side only)                |
| `SESSION_SECRET`             | Session secret                                     |

**kal-admin:**

| Variable              | Description                                        |
| --------------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Backend API URL (e.g. `https://kalori-api.my/api`) |
| `ADMIN_SECRET`        | Admin auth secret                                  |
| `ADMIN_USERNAME`      | Admin username                                     |
| `ADMIN_PASSWORD`      | Admin password                                     |

### 8.4 Branch Behaviour

Vercel will automatically:

- Deploy `main` → **Production**
- Deploy `dev` and any other branch → **Preview**

No GitHub secrets needed. No additional CI configuration needed.

---

## Phase 9 — VPS: Coolify + GHCR (Manual — VPS Dashboard)

This replaces the old Coolify Git-based backend (which built the image on the VPS) with a new
Docker image resource that pulls directly from GHCR.

> **Do this after merging to `main`** so the image already exists in GHCR before Coolify tries to pull it.

### 9.1 Merge to Main (Trigger First Image Push)

1. Merge `chore/deployment-migration` PR → `dev`
2. Merge `dev` → `main`
3. Wait for `Backend / Build & Push Docker Image` GitHub Actions job to succeed
4. Verify the image exists at:
   `https://github.com/Zen0space/Kal-Monorepo/pkgs/container/kal-monorepo%2Fkal-backend`

### 9.2 Create New Coolify Resource (Docker Image)

In Coolify dashboard → your Project → **Add New Resource**:

1. Select **Docker Image** (not Git Repository)
2. Image: `ghcr.io/zen0space/kal-monorepo/kal-backend:latest`
3. Name: `kal-backend`
4. No registry credentials needed — image is public

### 9.3 Configure Environment Variables

In the new resource settings, add all environment variables:

| Variable           | Value                                                                    |
| ------------------ | ------------------------------------------------------------------------ |
| `NODE_ENV`         | `production`                                                             |
| `MONGODB_URI`      | `mongodb://<user>:<password>@<mongodb-host>:27017/<db>?authSource=admin` |
| `REDIS_URL`        | `redis://<redis-host>:6379`                                              |
| `LOGTO_ENDPOINT`   | Your Logto URL                                                           |
| `LOGTO_APP_ID`     | Your Logto app ID                                                        |
| `LOGTO_APP_SECRET` | Your Logto app secret                                                    |
| `SESSION_SECRET`   | Your session secret                                                      |
| `GLM_API_BASE_URL` | `https://api.z.ai/api/paas/v4`                                           |
| `GLM_API_KEY`      | Your GLM API key                                                         |
| `INTERNAL_API_KEY` | Your internal API key                                                    |
| `FRONTEND_URL`     | Your Vercel frontend URL                                                 |

> **Note:** Use the Coolify container hostnames (not `localhost`) for `MONGODB_URI` and `REDIS_URL`
> since all services run on the same Docker network in Coolify.

### 9.4 Configure Port

- Container port: `3000`
- Exposed port: `4000` (or whatever your current backend port is)

### 9.5 Deploy

Click **Deploy** — Coolify will pull `ghcr.io/zen0space/kal-monorepo/kal-backend:latest` and start the container.

### 9.6 Verify

```bash
# SSH into VPS and check the container is running
docker ps | grep kal-backend

# Check logs for startup errors
docker logs <container_id> --tail 50

# Quick API health check
curl http://localhost:4000
```

### 9.7 Remove Old Resources

Once the new backend is confirmed working:

1. In Coolify → delete the old Git-based `kal-backend` resource
2. Delete old `kal-frontend`, `kal-frontend-chat`, `kal-admin` resources (moving to Vercel)
3. Clean up dangling images on VPS:

```bash
docker image prune -f
```

### 9.8 Redeployment Workflow (Going Forward)

When you want to deploy a new backend version:

1. Merge to `main`
2. Wait for `Backend / Build & Push Docker Image` to succeed in GitHub Actions
3. Go to Coolify dashboard → `kal-backend` resource → click **Redeploy**
4. Coolify pulls the new `:latest` image and restarts the container

---

## Final Architecture

```
  GitHub push to dev/main
         │
         ├─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
  GitHub Actions                      Vercel (auto)
  ┌──────────────┐                  ┌──────────────────┐
  │ lint &       │                  │  kal-frontend    │
  │ typecheck    │                  │  (preview/prod)  │
  └──────┬───────┘                  └──────────────────┘
         │                          ┌──────────────────┐
       build                        │  kal-admin       │
         │                          │  (preview/prod)  │
  docker-publish                    └──────────────────┘
  (kal-backend → GHCR)                      │
         │                                  │ API calls
         ▼                                  │
        VPS ◄──────────────────────────────┘
  ┌──────────────┐
  │   backend    │ ◄── docker pull from GHCR
  │   mongodb    │
  │   logto      │
  │   redis      │
  │   postgres   │
  └──────────────┘
```

---

## Rollback Plan

If anything goes wrong:

| Phase | Rollback                                                                  |
| ----- | ------------------------------------------------------------------------- |
| 1     | Delete `.dockerignore`                                                    |
| 2     | Revert CI workflow, restore `docker-build` job                            |
| 3     | Revert `docker-compose.yml`, restore `build:` blocks                      |
| 4     | Cannot rollback (files deleted) — restore from git                        |
| 5-6   | Delete `vercel.json` files, revert `kal-admin/next.config.ts`             |
| 7-8   | Delete Vercel projects                                                    |
| 9     | In Coolify, delete new Docker Image resource, keep old Git-based resource |

---

## Checklist

- [x] Phase 1: Create root `.dockerignore`
- [x] Phase 2: Update CI to push backend image to GHCR
- [x] Phase 3: Update docker-compose to use GHCR image
- [x] Phase 4: Delete `kal-frontend-chat` package
- [x] Phase 5: Create `kal-frontend/vercel.json`
- [x] Phase 6: Update `kal-admin/next.config.ts`, create `kal-admin/vercel.json`
- [x] Phase 7: Vercel auto-deploy (no CI jobs needed)
- [ ] Phase 8: Create Vercel projects and add env vars in dashboard
- [ ] Phase 9: Create new Coolify Docker Image resource pointing to GHCR
- [ ] Verify: Merge to main, check `Backend / Build & Push Docker Image` passes
- [ ] Verify: New backend container running on VPS via Coolify
- [ ] Verify: Old Coolify Git-based resources removed (backend, frontend-chat, frontend, admin)
- [ ] Verify: Frontend and admin deploy to Vercel
