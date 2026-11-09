# Personal Finance Tracker

A deployed full-stack web application for tracking income, expenses, and monthly financial activity, built with **React, TypeScript, Python, FastAPI, SQLAlchemy, and PostgreSQL**.

**[Open the live application](https://personal-finance-tracker-ac7w.onrender.com)** · **[Explore the API documentation](https://personal-finance-api-m6we.onrender.com/docs)**

> **Try it without registering:** Open the live application and select **Try Demo — No Account Needed**. A temporary account is created with fictional sample transactions so you can explore the dashboard and transaction management features. Demo sessions expire after **30 minutes**; expired demo data is automatically cleaned up while the backend is running.
>
> **Hosting note:** The application runs on Render's free hosting tier, so the first request after inactivity may take a little longer.

## Application Preview

### Financial Dashboard

![Dashboard with monthly income, expenses, balance, and spending by category](docs/screenshots/dashboard.png)

_Monthly financial overview with income, expenses, balance, and category breakdown. All financial data shown is fictional._

### Expense Management

![Expense management interface with form and edit/delete actions](docs/screenshots/expenses.png)

_Create, view, edit, and delete expenses with categories, amounts, and dates._

### Income Management

![Income management interface with income form and saved records](docs/screenshots/incomes.png)

_Track income sources and manage income records._

## Features

- **Authentication and authorization:** User registration, JWT-based login, protected API endpoints, and user-specific access controls.
- **Income and expense tracking:** Create, view, update, and delete transactions; categorize expenses; validate names, amounts, and dates; reject future-dated transactions.
- **Financial dashboard:** Monthly income, expenses, balance, and spending by category.
- **Responsive interface:** React and TypeScript forms, transaction lists, edit/delete actions, and client-side validation.
- **No-registration demo:** A temporary account with sample income and expenses, a 30-minute session, and automated cleanup of expired demo accounts and old rate-limit records.
- **Automated quality checks:** Backend tests with pytest, frontend tests with Vitest/React Testing Library, Playwright end-to-end tests, and a Docker build in GitHub Actions.

## Technology Stack

| Area               | Technologies                                             |
| ------------------ | -------------------------------------------------------- |
| Frontend           | React, TypeScript, Vite, CSS                             |
| Backend            | Python 3.11, FastAPI, Pydantic, SQLAlchemy               |
| Database           | PostgreSQL (Neon production), SQLite (local development) |
| Authentication     | JWT                                                      |
| Backend testing    | pytest, FastAPI TestClient                               |
| Frontend testing   | Vitest, React Testing Library                            |
| End-to-end testing | Playwright                                               |
| CI                 | GitHub Actions                                           |
| Deployment         | Docker, Render, Neon PostgreSQL                          |

## Architecture

```text
React + TypeScript (Render)
          |
          | HTTPS / REST API
          v
FastAPI + SQLAlchemy (Render / Docker)
          |
          v
PostgreSQL (Neon, production)
SQLite (optional local development)
```

The backend handles authentication, validation, business logic, and database access. Database queries enforce user ownership so users cannot access each other's financial records.

## Local Development

### Prerequisites

- Python 3.11
- Node.js and npm
- Git

### 1. Clone the repository

```powershell
git clone https://github.com/MadalinaRVeliche/PersonalFinanceTracker.git
cd PersonalFinanceTracker
```

### 2. Set up the backend

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.txt
```

Configure **local-only** environment variables in the same PowerShell terminal. The database URL below deliberately points to a SQLite file inside the project; do not reuse a production database URL.

```powershell
$dbFile = (Join-Path (Get-Location).Path "backend\finance.db").Replace("\", "/")
$env:DATABASE_URL = "sqlite:///$dbFile"
$env:JWT_SECRET_KEY = "replace-with-a-long-random-local-development-secret"
$env:DEMO_RATE_LIMIT_SECRET = "replace-with-another-long-random-local-secret"
```

Initialize the local demo database schema and start the API:

```powershell
python -m backend.add_demo_column
python -m uvicorn backend.main:app --reload
```

Backend: http://127.0.0.1:8000  
API documentation: http://127.0.0.1:8000/docs

> **Database safety:** Check your `DATABASE_URL` before running migrations or cleanup commands. The application's environment configuration can override the local SQLite setting; never run development commands against the production Neon database unintentionally.

### 3. Set up the frontend

In a second PowerShell terminal:

```powershell
cd frontend
npm install
```

Create `frontend/.env.local` containing:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Start the frontend:

```powershell
npm run dev
```

Open the local URL displayed by Vite.

**Security:** Do not commit `.env` files, passwords, JWT signing secrets, or database credentials.

## Automated Testing

The latest verified local run passed **33 backend tests** and **13 frontend tests**. GitHub Actions also runs end-to-end checks and a Docker build.

### Backend

From the project root, with the virtual environment activated and local-only environment variables set as above:

```powershell
python -m pytest -v
```

Tests cover authentication, authorization, transaction CRUD, validation, demo behavior, and cleanup scheduling.

### Frontend

From the `frontend` directory:

```powershell
npm test
npm run build
```

Frontend tests use Vitest and React Testing Library. The production build validates TypeScript and generates deployable assets.

### CI

The workflow at [`.github/workflows/tests.yml`](.github/workflows/tests.yml) includes:

- Backend tests
- Frontend tests
- Playwright end-to-end tests
- Docker build

## Deployment

- **Frontend:** Render — [Live application](https://personal-finance-tracker-ac7w.onrender.com)
- **Backend:** Render, deployed with Docker — [Interactive API docs](https://personal-finance-api-m6we.onrender.com/docs)
- **Database:** Neon PostgreSQL

The backend container runs the demo schema migration at startup. Automatic cleanup runs on startup and periodically while the backend is active. On Render's free tier, sleeping services do not run background tasks until they restart.

## Project Development

The project began as an HTML, CSS, and JavaScript expense tracker using browser LocalStorage. It evolved into a full-stack application with a React/TypeScript frontend, FastAPI REST API, relational database persistence, JWT authentication, user-specific data isolation, automated tests, and cloud deployment.

The original browser-based prototype remains in the repository as part of the development history.

## Engineering Challenges and Solutions

### Moving from LocalStorage to a full-stack architecture

**Challenge:** Browser-only storage did not provide server-side persistence or user-specific access.  
**Solution:** Rebuilt the application around React, FastAPI, SQLAlchemy, and PostgreSQL.  
**Lesson:** Designing and connecting a frontend, REST API, and relational database.

### Enforcing user-specific data access

**Challenge:** Financial records must be accessible only to their owners.  
**Solution:** Added authenticated endpoints, user-scoped database queries, and authorization tests.  
**Lesson:** Authorization must be enforced by the backend, not just the UI.

### Validating transaction dates

**Challenge:** Users could submit future-dated income or expenses.  
**Solution:** Added backend Pydantic validation, frontend date restrictions, and tests for create/update operations.  
**Lesson:** Important validation belongs on both client and server.

### Keeping tests isolated from production

**Challenge:** Frontend test configuration initially pointed requests toward a deployed API.  
**Solution:** Set a predictable test API URL and separated environment-specific configuration.  
**Lesson:** Automated tests should be deterministic and isolated from production services.

### Deploying and maintaining a public demo

**Challenge:** The deployed app needed a hosted database, separate frontend/backend services, and a safe way for visitors to explore features without registering.  
**Solution:** Deployed the services on Render, used Neon PostgreSQL, added temporary seeded demo accounts, expiration, rate limiting, and automatic cleanup.  
**Lesson:** Production-ready demos require attention to data lifecycle, resource limits, and operational configuration.

## Potential Future Improvements

- Monthly category budgets
- Transaction search, filtering, and sorting
- Financial reports and CSV export
- Recurring income and expenses
- More detailed inline validation messages
- Further hardening of visitor-aware demo rate limiting behind the hosting proxy

## Author

Built as a full-stack software engineering portfolio project demonstrating API development, frontend engineering, database integration, authentication, automated testing, and deployment.
