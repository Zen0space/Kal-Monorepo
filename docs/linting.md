# Linting & Code Formatting

This monorepo uses **ESLint** for linting and **Prettier** for code formatting.

## Quick Commands

```bash
# Check for lint issues
pnpm lint

# Auto-fix lint issues
pnpm lint:fix

# Format all files with Prettier
pnpm format

# Check formatting without fixing
pnpm format:check
```

## Before Pushing Code

> [!IMPORTANT]
> **Always run `pnpm lint:fix` before pushing your changes!**

```bash
# 1. Auto-fix lint issues
pnpm lint:fix

# 2. Format code
pnpm format

# 3. Verify build
pnpm build
```

## What Gets Auto-Fixed

| Issue                   | Auto-fixable  |
| ----------------------- | ------------- |
| Import ordering         | ✅ Yes        |
| Duplicate imports       | ✅ Yes        |
| Consistent type imports | ✅ Yes        |
| Code formatting         | ✅ Yes        |
| Unused variables        | ❌ Manual fix |
| Type errors             | ❌ Manual fix |

## Configuration Files

| File                | Purpose                     |
| ------------------- | --------------------------- |
| `eslint.config.mjs` | ESLint rules (flat config)  |
| `.prettierrc`       | Prettier formatting options |
| `.prettierignore`   | Files to skip formatting    |

## VS Code Integration

For auto-fix on save, add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

Recommended extensions:

- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`)

## Package-Specific Linting

```bash
# Lint a specific package
pnpm --filter kal-frontend lint
pnpm --filter kal-backend lint:fix
```
