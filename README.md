# Personal Finance Tracker

A full-stack web application for tracking personal expenses, managing categories, and understanding monthly spending.

**Project status:** In development — Week 3: Database Integration

## Project Goal

Build a portfolio-ready Personal Finance Tracker while learning full-stack development and preparing for junior full-stack developer roles.

The finished application will allow users to:

- Register and log in securely.
- Create, view, edit, and delete expenses.
- Organize expenses by category.
- Filter expenses by month.
- View monthly income, expenses, and balance.
- Store their data persistently in PostgreSQL.
- Access only their own financial records.
- Use a responsive React frontend connected to a FastAPI backend.

## Technology Stack

| Area | Technology |
|---|---|
| Frontend prototype | HTML, CSS, JavaScript |
| Final frontend | React, TypeScript, Vite |
| Backend | Python, FastAPI, Pydantic |
| Database | PostgreSQL, SQLAlchemy |
| Testing | pytest, Vitest, React Testing Library, Playwright |
| Development | VS Code, Git, GitHub |
| Deployment and automation | Docker, GitHub Actions |

Technologies listed for later phases are planned, not yet implemented.

## Current Progress

### Completed

- Browser-based expense tracker using HTML, CSS, and JavaScript.
- Expense creation, editing, and deletion in the browser.
- LocalStorage persistence for the frontend prototype.
- Monthly expense filtering and financial totals.
- FastAPI backend with CRUD endpoints.
- Pydantic validation for expense names, amounts, categories, and dates.
- Seven passing automated backend tests.
- Git version control and GitHub repository.

### In Progress

- PostgreSQL installation and database integration.

### Not Yet Implemented

- Persistent backend database storage.
- React and TypeScript frontend.
- User registration, login, and authentication.
- Per-user data isolation.
- End-to-end testing.
- Docker, CI/CD, and deployment.

## API Endpoints

Base URL when running locally: `http://127.0.0.1:8000`

Interactive API documentation: `http://127.0.0.1:8000/docs`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API welcome message |
| GET | `/expenses` | List all expenses |
| GET | `/expenses/{expense_id}` | Retrieve one expense |
| POST | `/expenses` | Create an expense |
| PUT | `/expenses/{expense_id}` | Update an expense |
| DELETE | `/expenses/{expense_id}` | Delete an expense |

**Current limitation:** The backend uses an in-memory Python list. Data is lost when the server restarts. Authentication and user-specific access controls have not yet been implemented.

## Local Development

### Requirements

- Python 3.11 or compatible version
- Git
- VS Code or another code editor

### Setup (Windows PowerShell)

Clone the repository:

```powershell
git clone https://github.com/MadalinaRVeliche/PersonalFinanceTracker.git
cd PersonalFinanceTracker
```

Create and activate a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
python -m pip install -r requirements.txt
```

Start the backend:

```powershell
python -m uvicorn backend.main:app --reload
```

Open the API documentation at:

`http://127.0.0.1:8000/docs`

To run automated tests:

```powershell
python -m pytest -v
```

The browser-based prototype can be opened using `index.html`. It currently stores expenses separately from the FastAPI backend.

## Project Structure

```text
PersonalFinanceTracker/
├── backend/
│   ├── main.py
│   └── tests/
│       └── test_expenses.py
├── index.html
├── script.js
├── style.css
├── requirements.txt
├── README.md
├── ROADMAP.md
└── .gitignore
```

## Final Definition of Done

The MVP is complete when a user can register, log in, create and manage expenses, filter by month, view accurate financial totals, and return later to find their data saved securely in PostgreSQL.

The application must also have automated tests, clear documentation, and a working deployed version.

## Learning Approach

This project is developed incrementally, with each feature implemented, tested, understood, and committed to GitHub.