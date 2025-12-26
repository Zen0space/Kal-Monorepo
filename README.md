# Kal - Malaysian Food Calorie Tracker 🥗

A simple, fast calorie tracking app focused on Malaysian cuisine. Search our database of 100+ Malaysian foods with accurate nutritional information.

![Kal](https://img.shields.io/badge/Malaysian-Food-green) ![License](https://img.shields.io/badge/license-MIT-blue) ![CI](https://github.com/Zen0space/Kal-Monorepo/actions/workflows/ci.yml/badge.svg)

**🌐 Production:** [https://kalori-api.my](https://kalori-api.my)

---

## 📚 Documentation

| Document                                        | Description                                      |
| ----------------------------------------------- | ------------------------------------------------ |
| [API Documentation](docs/api.md)                | REST API endpoints, authentication, and examples |
| [Contributing Guidelines](docs/contributing.md) | How to contribute, branch strategy, PR process   |
| [GitHub Actions CI/CD](docs/github-actions.md)  | CI/CD pipeline and deployment workflow           |
| [Linting Guide](docs/linting.md)                | ESLint and Prettier configuration                |
| [VPS Setup](docs/vps-setup-selfhosted.md)       | Self-hosted deployment guide                     |

---

## 🚀 Features

- **Instant Search** - Find any food in milliseconds
- **Macro Tracking** - Calories, protein, carbs, and fat
- **Category Filters** - Browse by Rice, Noodles, Roti, Meat, and more
- **No Sign-up Required** - Just search and track
- **Mobile Friendly** - Works on any device

---

## 🛠️ Tech Stack

| Layer        | Technology                      |
| ------------ | ------------------------------- |
| **Frontend** | Next.js 14, React, Tailwind CSS |
| **Backend**  | Node.js, Express, tRPC          |
| **Database** | MongoDB                         |
| **Monorepo** | Turborepo, pnpm                 |

---

## 📁 Project Structure

```
Kal-Monorepo/
├── packages/
│   ├── kal-frontend/     # Next.js frontend app
│   ├── kal-backend/      # tRPC backend API
│   ├── kal-db/           # Database migrations & seeds
│   └── kal-shared/       # Shared types & schemas
├── docker/               # Docker compose for local dev
├── docs/                 # Documentation
├── .env.example          # Environment variables template
├── pnpm-workspace.yaml   # pnpm workspace config
└── turbo.json            # Turborepo config
```

---

## 🏁 Getting Started

### Prerequisites

- **Node.js** >= 18
- **pnpm** >= 8 (`npm install -g pnpm`)
- **Docker** (for local MongoDB)

### 1. Clone the repository

```bash
git clone https://github.com/Zen0space/Kal-Monorepo.git
cd Kal-Monorepo
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration (defaults work for local dev).

### 4. Start MongoDB (local)

```bash
cd docker
docker-compose up -d
```

### 5. Run database migrations & seed

```bash
cd packages/kal-db
pnpm migrate:up  # Run migrations
pnpm seed        # Seed Malaysian foods
```

### 6. Start development servers

```bash
# Terminal 1: Backend
cd packages/kal-backend
pnpm dev

# Terminal 2: Frontend
cd packages/kal-frontend
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌿 Branch Strategy

> [!IMPORTANT] > **Always create your branch from `dev`, not `main`!**

| Branch | Purpose                             |
| ------ | ----------------------------------- |
| `main` | Production - deployed automatically |
| `dev`  | Development - merge PRs here first  |

### Workflow

1. **Create feature branch from `dev`:**

   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes and commit:**

   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

3. **Push and create PR to `dev`:**

   ```bash
   git push origin feature/your-feature-name
   ```

4. **After PR is approved and merged to `dev`**, it will be tested before merging to `main`.

---

## 📊 Adding Foods to the Database

Want to add more Malaysian foods? Edit the seed file:

```bash
packages/kal-db/scripts/seed.ts
```

Each food entry requires:

```typescript
{
  name: "Food Name",
  calories: 300,
  protein: 10,
  carbs: 40,
  fat: 8,
  serving: "1 plate",
  category: "Rice" // Rice, Noodles, Roti, Meat, Seafood, Vegetables, Soups, Snacks, Desserts, Drinks, Basics
}
```

After adding, run:

```bash
pnpm seed  # Force reseed (clears existing data)
```

---

## 🔌 API Endpoints

The backend uses tRPC. Key endpoints:

| Endpoint            | Description                              |
| ------------------- | ---------------------------------------- |
| `food.search`       | Search foods by name                     |
| `food.allPaginated` | Get paginated foods with category filter |
| `food.categories`   | Get all food categories                  |
| `food.create`       | Add food entry (requires auth)           |
| `food.list`         | List user's food entries (requires auth) |

---

## 🧪 Running Tests

```bash
# Type check all packages
pnpm typecheck

# Lint
pnpm lint
```

---

## 🚢 Deployment

The app is deployed using [Coolify](https://coolify.io/) to a self-hosted server.

🌐 **Production URL:** [https://kalori-api.my](https://kalori-api.my)

| Environment | Trigger         | URL                                    |
| ----------- | --------------- | -------------------------------------- |
| Production  | Merge to `main` | [kalori-api.my](https://kalori-api.my) |
| Preview     | PR to `dev`     | CI runs only                           |

- **CI/CD:** GitHub Actions - see [docs/github-actions.md](docs/github-actions.md)
- **Backend:** Docker container with entrypoint running migrations
- **Frontend:** Static build via Next.js

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](docs/contributing.md) for detailed instructions.

### Quick Start

1. Fork the repository
2. Create branch from `dev` (not `main`)
3. Make your changes
4. **Run `pnpm lint:fix` to auto-fix issues**
5. Run `pnpm typecheck` to verify types
6. Submit PR to `dev` branch
7. Wait for review

> [!TIP]
> See [docs/contributing.md](docs/contributing.md) for the full guide including issue templates and PR process.

> [!TIP]
> See [docs/linting.md](docs/linting.md) for the linting guide.

### Commit Convention

```
feat: add new feature
fix: bug fix
docs: documentation update
style: code formatting
refactor: code refactoring
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 👥 Contributors

- [Kai](https://github.com/Zen0space) - Creator & Maintainer

---

**Made with ❤️ in Malaysia**
