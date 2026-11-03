# Personal Finance Tracker — Development Roadmap

**Duration:** 6 weeks (target, adjustable based on progress)

**Current phase:** Week 3 — PostgreSQL Integration

## Week 1 — JavaScript Fundamentals and Browser Prototype

- [x] Set up the development environment.
- [x] Create the project and GitHub repository.
- [x] Build the expense entry form.
- [x] Display expenses in a table.
- [x] Add expense creation, editing, and deletion.
- [x] Save expenses using LocalStorage.
- [x] Add monthly filtering and financial totals.

**Milestone:** Functional browser-based expense tracker — completed.

## Week 2 — Python and FastAPI Backend

- [x] Install FastAPI and Uvicorn.
- [x] Create the first API endpoint.
- [x] Implement expense CRUD endpoints.
- [x] Add Pydantic input validation.
- [x] Test API endpoints through Swagger UI.
- [x] Add seven automated pytest tests.
- [x] Commit and push the backend to GitHub.

**Milestone:** Working and tested FastAPI backend — completed.

## Week 3 — PostgreSQL and Persistent Storage

- [ ] Install PostgreSQL.
- [ ] Create the application database.
- [ ] Connect FastAPI using SQLAlchemy.
- [ ] Define the Expense database model.
- [ ] Replace in-memory expense storage with database queries.
- [ ] Update automated tests to work with database storage.
- [ ] Verify expenses survive server restarts.

**Milestone:** Persistent expense storage.

## Week 4 — React and TypeScript Frontend

- [ ] Set up React, TypeScript, and Vite.
- [ ] Build reusable UI components.
- [ ] Create expense forms and tables.
- [ ] Connect the frontend to FastAPI.
- [ ] Implement expense CRUD through the API.
- [ ] Add monthly filtering and summary views.
- [ ] Add frontend component tests.

**Milestone:** Functional React frontend connected to FastAPI.

## Week 5 — Authentication and Testing

- [ ] Implement user registration.
- [ ] Implement secure password hashing.
- [ ] Implement login and authentication.
- [ ] Associate expenses with users.
- [ ] Ensure users cannot access other users' expenses.
- [ ] Expand backend and frontend automated tests.
- [ ] Test authentication and authorization failures.

**Milestone:** Secure multi-user application.

## Week 6 — Deployment and Portfolio Preparation

- [ ] Add end-to-end tests using Playwright.
- [ ] Containerize the application using Docker.
- [ ] Set up GitHub Actions for automated testing.
- [ ] Deploy the frontend and backend.
- [ ] Configure production database and environment variables.
- [ ] Update README with screenshots and deployment instructions.
- [ ] Review accessibility, security, and usability.
- [ ] Prepare a portfolio description and interview walkthrough.

**Milestone:** Deployed, documented, portfolio-ready MVP.

## Current Checkpoint

**Last completed work:**
- FastAPI expense CRUD endpoints.
- Pydantic validation.
- Seven passing pytest tests.
- GitHub commit `caf3d19`: Add expense validation and automated API tests.

**Next action:** Install PostgreSQL on Windows and verify the installation with `psql --version`.

**Known issue:** `psql` is not currently recognized in PowerShell. PostgreSQL may be missing or its executable directory may not be on PATH.

## Final Success Criteria

- [ ] Users can register and log in.
- [ ] Users can create, view, update, and delete expenses.
- [ ] Expenses persist after server restarts.
- [ ] Each user can access only their own expenses.
- [ ] Monthly totals and balances are accurate.
- [ ] The frontend works with the backend API.
- [ ] Automated tests pass.
- [ ] The application is deployed.
- [ ] Setup instructions and project documentation are complete.