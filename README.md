# Singh & Thakur Associates - CA Practice Platform

A full-stack, enterprise-grade platform for a Chartered Accountancy and financial advisory firm. Built with a modular monolith architecture designed to scale seamlessly across practice management, client portals, document management, compliance tracking, and automated workflow phases.

---

## 🏛️ Architecture Overview

The system is structured as a scalable **Modular Monolith**:

```text
/
├── frontend/                 # Next.js 14 (App Router), TypeScript, Tailwind CSS
│   ├── app/                  # Route groups, pages, layout
│   ├── components/           # Reusable UI, Layout, Sections
│   ├── config/               # Centralized site & firm configuration
│   ├── data/                 # Structured typed services, team data
│   └── types/                # TypeScript models
├── backend/                  # FastAPI (Python 3.10+), SQLAlchemy 2.0, Alembic
│   ├── alembic/              # Database migration versioning
│   ├── app/
│   │   ├── api/              # API router (/api/v1) & endpoints (health, etc.)
│   │   ├── core/             # Config (Pydantic), Logging, Exceptions, Handlers
│   │   ├── db/               # Engine, SessionLocal, get_db dependency, Base
│   │   ├── middleware/       # Request logging, performance timing
│   │   ├── models/           # SQLAlchemy ORM models (Role, User)
│   │   ├── schemas/          # Pydantic request/response validation schemas
│   │   ├── services/         # Business logic repository abstraction
│   │   └── main.py           # FastAPI entry point & lifespan
│   └── tests/                # Pytest automated test suite
├── docker-compose.yml        # Multi-container orchestration (Postgres, API, Web)
├── .env.example              # Environment variables template
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/)
- [Node.js](https://nodejs.org/) (v18+) & `npm` (for local frontend development)
- [Python](https://www.python.org/) (3.10+) (for local backend development)

### 1. Environment Setup
Copy the environment template:
```bash
cp .env.example .env
```

Review and adjust variables in `.env` as needed:
- `PROJECT_NAME`: Firm title
- `ENVIRONMENT`: `development`, `production`, or `test`
- `SECRET_KEY`: Cryptographic signing key
- `CORS_ORIGINS`: Comma-separated allowed frontend origins
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`: Database connection details

---

## 🐳 Running with Docker Compose

To start the entire application stack (PostgreSQL, FastAPI Backend, Next.js Frontend) with automatic migrations:

```bash
docker-compose up --build
```

### Services Endpoints:
- **Public Website (Frontend)**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Interactive API Docs (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc API Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check Endpoint**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
- **PostgreSQL Database**: `localhost:5432`

---

## 💻 Local Development (Without Docker)

### Backend (FastAPI)
1. Navigate to backend and create virtual environment:
   ```bash
   cd backend
   python -m venv venv
   # On Windows:
   ./venv/Scripts/activate
   # On Linux/macOS:
   source venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run migrations:
   ```bash
   alembic upgrade head
   ```
4. Start development server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend (Next.js)
1. Navigate to frontend and install packages:
   ```bash
   cd frontend
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```

---

## 🗄️ Database Migrations (Alembic)

Migrations are tracked in `backend/alembic/versions/`.

- **Apply all migrations:**
  ```bash
  cd backend && alembic upgrade head
  ```
- **Create a new auto-generated migration:**
  ```bash
  cd backend && alembic revision --autogenerate -m "describe_migration"
  ```
- **Rollback last migration:**
  ```bash
  cd backend && alembic downgrade -1
  ```

---

## 🧪 Testing & Quality Assurance

### Backend Automated Tests
The backend includes automated tests covering configuration, error handlers, and health check with database connection validation:
```bash
cd backend
./venv/Scripts/python -m pytest -v
```

### Frontend Linting & Production Build
```bash
cd frontend
npm run lint
npm run build
```

---

## 🛡️ Security & Privacy Compliance
- Structured logging automatically redacts sensitive data (passwords, tokens, PAN, Aadhaar, bank numbers).
- Production exception handlers prevent exposing stack traces to external clients.
- Environment-driven CORS configuration avoids hardcoded origin leaks.
