# Contributing Guidelines

Thank you for your interest in contributing to Kal! This document provides guidelines and steps for contributing.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Creating an Issue](#creating-an-issue)
- [Branch Strategy](#branch-strategy)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Convention](#commit-convention)

---

## Code of Conduct

Please be respectful and constructive in all interactions. We welcome contributors of all skill levels.

---

## Getting Started

1. **Fork the repository** to your GitHub account

2. **Clone your fork:**

   ```bash
   git clone https://github.com/YOUR_USERNAME/Kal-Monorepo.git
   cd Kal-Monorepo
   ```

3. **Add upstream remote:**

   ```bash
   git remote add upstream https://github.com/Zen0space/Kal-Monorepo.git
   ```

4. **Install dependencies:**

   ```bash
   pnpm install
   ```

5. **Set up environment:**
   ```bash
   cp .env.example .env
   ```

---

## Creating an Issue

Before starting work, check if an issue already exists. If not, create one:

### Issue Templates

**🐛 Bug Report:**

```markdown
## Bug Description

A clear description of the bug.

## Steps to Reproduce

1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior

What you expected to happen.

## Screenshots

If applicable, add screenshots.

## Environment

- OS: [e.g., macOS 14.0]
- Browser: [e.g., Chrome 120]
- Node.js: [e.g., 18.19.0]
```

**✨ Feature Request:**

```markdown
## Feature Description

A clear description of the feature.

## Use Case

Why this feature would be useful.

## Proposed Solution

How you think it could be implemented.

## Alternatives Considered

Other solutions you've considered.
```

### Issue Labels

| Label              | Description                |
| ------------------ | -------------------------- |
| `bug`              | Something isn't working    |
| `feature`          | New feature request        |
| `docs`             | Documentation improvements |
| `good first issue` | Good for newcomers         |
| `help wanted`      | Extra attention needed     |

---

## Branch Strategy

> ⚠️ **IMPORTANT:** Always create your branch from `dev`, NOT from `main`!

| Branch | Purpose                             |
| ------ | ----------------------------------- |
| `main` | Production - deployed automatically |
| `dev`  | Development - merge PRs here first  |

### Creating a Branch

1. **Sync with upstream:**

   ```bash
   git checkout dev
   git fetch upstream
   git merge upstream/dev
   ```

2. **Create your feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Branch Naming Convention

Use descriptive prefixes:

| Prefix      | Use Case         | Example                 |
| ----------- | ---------------- | ----------------------- |
| `feature/`  | New features     | `feature/halal-filter`  |
| `fix/`      | Bug fixes        | `fix/search-pagination` |
| `docs/`     | Documentation    | `docs/api-examples`     |
| `refactor/` | Code refactoring | `refactor/db-queries`   |
| `chore/`    | Maintenance      | `chore/update-deps`     |

---

## Pull Request Process

### Before Creating a PR

1. **Run lint and fix issues:**

   ```bash
   pnpm lint:fix
   ```

2. **Run type check:**

   ```bash
   pnpm typecheck
   ```

3. **Ensure build passes:**

   ```bash
   pnpm build
   ```

4. **Commit your changes:**

   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

5. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

### Creating the PR

1. Go to [Kal-Monorepo](https://github.com/Zen0space/Kal-Monorepo)
2. Click **"Compare & pull request"**
3. **Set base branch to `dev`** (NOT `main`)
4. Fill in the PR template

### PR Template

```markdown
## Description

Brief description of changes.

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issue

Fixes #(issue number)

## Checklist

- [ ] I've read the contributing guidelines
- [ ] My branch is created from `dev`
- [ ] I've run `pnpm lint:fix`
- [ ] I've run `pnpm typecheck`
- [ ] I've tested my changes locally
```

### After PR Submission

- Wait for CI checks to pass
- Respond to review comments
- Make requested changes if needed
- Once approved, maintainers will merge to `dev`

---

## Coding Standards

### TypeScript

- Use strict TypeScript (no `any` unless necessary)
- Define interfaces for data structures
- Use proper type imports

### React/Next.js

- Use functional components with hooks
- Keep components focused and reusable
- Use Server Components where possible

### Styling

- Use Tailwind CSS for styling
- Follow existing design patterns
- Maintain dark theme consistency

### File Organization

```
packages/
├── kal-frontend/
│   └── src/
│       ├── app/          # Next.js app router
│       ├── components/   # Reusable components
│       └── lib/          # Utilities
├── kal-backend/
│   └── src/
│       ├── routers/      # API routes
│       ├── lib/          # Utilities
│       └── middleware/   # Express middleware
└── kal-shared/           # Shared types
```

---

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

| Type       | Description                  | Example                             |
| ---------- | ---------------------------- | ----------------------------------- |
| `feat`     | New feature                  | `feat: add halal food filter`       |
| `fix`      | Bug fix                      | `fix: search not returning results` |
| `docs`     | Documentation                | `docs: update API examples`         |
| `style`    | Formatting                   | `style: fix indentation`            |
| `refactor` | Code change (no feature/fix) | `refactor: simplify query logic`    |
| `test`     | Adding tests                 | `test: add search endpoint tests`   |
| `chore`    | Maintenance                  | `chore: update dependencies`        |

### Good Commit Messages

✅ Good:

```
feat: add category filter to food search
fix: pagination offset calculation
docs: add contributing guidelines
```

❌ Bad:

```
update stuff
fix bug
WIP
```

---

## Need Help?

- 📖 Check the [documentation](./README.md)
- 💬 Open a [discussion](https://github.com/Zen0space/Kal-Monorepo/discussions)
- 🐛 Report a [bug](https://github.com/Zen0space/Kal-Monorepo/issues/new)

---

## Recognition

Contributors will be added to the README! Thank you for helping make Kal better. 🙏

---

**Happy contributing! 🎉**
