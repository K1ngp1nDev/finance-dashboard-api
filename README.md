# AI Finance Dashboard & Reporting API

NestJS API for a portfolio-ready finance dashboard. It powers JWT auth, transaction CRUD, CSV imports, reporting analytics, seeded demo data, and AI-assisted finance queries that can run safely without paid API keys.

## Portfolio Value

This project demonstrates full-stack dashboard development: API-backed data flows, transaction analytics, charts, CSV import, JWT auth, AI-assisted categorization, and clean reporting UX.

## Stack

- **NestJS 11** for modular REST API structure
- **Prisma 7 + PostgreSQL** for typed persistence and migrations
- **Passport + JWT** for stateless authentication
- **Anthropic Claude** for production AI mode
- **Deterministic demo AI mode** for local demos without API keys
- **Swagger** for API documentation at `http://localhost:3001/api/docs`

## Features

- Register/login with JWT authentication
- Transaction CRUD with category filters
- CSV import using `date,description,amount` rows
- AI category suggestions with demo fallback
- Natural-language finance assistant endpoint with demo fallback
- Analytics summary for KPI cards, monthly trends, category breakdown, recent transactions, and largest expenses
- Seed command that creates a realistic demo user and 96 transactions across 6 months

## Setup

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run start:dev
```

The API runs on `http://localhost:3001/api` by default.

## Environment Variables

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/finance_dashboard"
JWT_SECRET="change-me-in-production"
AI_DEMO_MODE=true
ANTHROPIC_API_KEY=""
PORT=3001
```

Set `AI_DEMO_MODE=true` or leave `ANTHROPIC_API_KEY` empty for a keyless portfolio demo. In demo mode, categorization and finance answers are deterministic and do not call Anthropic.

## Demo Credentials

- Email: `demo@example.com`
- Password: `demo12345`

## API Docs

Swagger UI is available at:

```text
http://localhost:3001/api/docs
```

## Main Endpoints

```text
POST   /api/auth/register
POST   /api/auth/login

GET    /api/transactions
POST   /api/transactions
PATCH  /api/transactions/:id
DELETE /api/transactions/:id
POST   /api/transactions/categorize
POST   /api/transactions/import
GET    /api/transactions/analytics/summary

GET    /api/insights/budgets          # budget targets vs avg monthly spend
GET    /api/insights/subscriptions    # recurring payments detected from transactions
GET    /api/insights/goals            # savings goals with progress + forecast
GET    /api/insights/categories       # category stats + demo categorization rules

POST   /api/ai/query
```

All `/api/insights/*` values are derived from the user's transactions (no extra
tables) so the new Reports, Budgets, Subscriptions, Goals and Categories pages
run entirely on the seeded demo data.

## Frontend

Pairs with [finance-dashboard-frontend](https://github.com/K1ngp1nDev/finance-dashboard-frontend) (Angular 21).
