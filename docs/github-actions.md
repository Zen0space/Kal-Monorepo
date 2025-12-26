# GitHub Actions CI/CD

This project uses GitHub Actions for continuous integration and deployment.

---

## Workflow Overview

The CI workflow is located at `.github/workflows/ci.yml` and runs automatically on:

- **Push** to `main` or `dev` branches
- **Pull requests** targeting `main` or `dev` branches

---

## Pipeline Stages

### 1. Lint & Type Check

The first stage validates code quality:

```yaml
steps:
  - pnpm install --frozen-lockfile
  - pnpm lint
  - pnpm typecheck
```

**What it checks:**

- ESLint rules compliance
- TypeScript type errors
- Import ordering and consistency

### 2. Build

After linting passes, the build stage compiles all packages:

```yaml
steps:
  - pnpm install --frozen-lockfile
  - pnpm build
```

This ensures:

- All TypeScript compiles successfully
- Next.js builds without errors
- No missing dependencies

### 3. Docker Build Validation (Main Branch Only)

On pushes to `main`, the workflow also validates Docker builds:

```yaml
- Build Backend Docker Image
  - context: ./packages/kal-backend
```

---

## Deployment

Deployment is handled automatically by [Coolify](https://coolify.io/) when changes are merged to `main`:

| Branch | Action                              |
| ------ | ----------------------------------- |
| `dev`  | CI runs (lint, typecheck, build)    |
| `main` | CI runs + Auto-deploy to production |

### Deployment URL

🌐 **Production:** [https://kalori-api.my](https://kalori-api.my)

---

## Workflow Configuration

### Environment Variables

The workflow uses these environment variables:

| Variable       | Value | Description          |
| -------------- | ----- | -------------------- |
| `NODE_VERSION` | 18    | Node.js version      |
| `PNPM_VERSION` | 8     | pnpm package manager |

### Concurrency

The workflow uses concurrency groups to prevent duplicate runs:

```yaml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

This means:

- Only one CI run per branch at a time
- New pushes cancel in-progress runs

---

## Running CI Locally

Before pushing, you can run the same checks locally:

```bash
# Install dependencies
pnpm install

# Lint check
pnpm lint

# Auto-fix lint issues
pnpm lint:fix

# Type check
pnpm typecheck

# Build all packages
pnpm build
```

---

## Troubleshooting

### Common CI Failures

| Error                | Solution                                                       |
| -------------------- | -------------------------------------------------------------- |
| `pnpm install` fails | Run `pnpm install --frozen-lockfile` locally to check lockfile |
| Lint errors          | Run `pnpm lint:fix` to auto-fix                                |
| Type errors          | Check TypeScript errors with `pnpm typecheck`                  |
| Build fails          | Check for missing environment variables                        |

### Viewing Logs

1. Go to the repository on GitHub
2. Click on **Actions** tab
3. Select the failed workflow run
4. Click on the failed job to view logs

---

## Adding New Workflows

To add new workflows:

1. Create a new file in `.github/workflows/`
2. Use YAML format with the workflow definition
3. Push to trigger the workflow

### Example: Adding a Test Workflow

```yaml
# .github/workflows/test.yml
name: Test

on:
  pull_request:
    branches: [dev]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - run: pnpm install
      - run: pnpm test
```

---

## Related Documentation

- [Contributing Guidelines](./contributing.md)
- [Linting Guide](./linting.md)
- [VPS Setup](./vps-setup-selfhosted.md)
