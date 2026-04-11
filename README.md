# Finance Dashboard — API

NestJS 11 backend for the Finance Dashboard application. Handles transaction CRUD, AI-powered categorization, CSV import and natural language finance queries via Claude.

## Stack

- **NestJS 11** — modules, providers, guards, interceptors, pipes
- **Prisma 7 + PostgreSQL** — ORM with schema migrations
- **Anthropic Claude** — `claude-haiku-4-5` for categorization and AI queries
- **Passport + JWT** — stateless authentication
- **Swagger** — auto-generated API docs at `/api/docs`
- **class-validator** — DTO validation via global pipes

## Endpoints

```
POST   /api/auth/register
POST   /api/auth/login

GET    /api/transactions
POST   /api/transactions
PATCH  /api/transactions/:id
DELETE /api/transactions/:id
POST   /api/transactions/categorize
POST   /api/transactions/import
GET    /api/transactions/analytics/summary

POST   /api/ai/query
```

## Getting started

```bash
npm install
cp .env.example .env
# Set DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY in .env
npx prisma migrate dev
npm run start:dev
```

Swagger UI available at `http://localhost:3001/api/docs`.

## Frontend

Pairs with [finance-dashboard-frontend](https://github.com/K1ngp1nDev/finance-dashboard-frontend) (Angular 21).
