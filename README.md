# Singh & Thakur Associates - CA Practice Platform

A full-stack, enterprise-grade platform for a Chartered Accountancy and financial advisory firm. Built with a modular monolith architecture designed to scale seamlessly across practice management, client portals, document management, compliance tracking, and automated workflows.

---

## 🏛️ Architecture & Technology Stack

The system is structured as a clean **Modular Monolith**:

```text
/
├── frontend/                 # Next.js 16.3.4 (App Router), React 19.2.8, Tailwind CSS v4, TypeScript 5
│   ├── app/                  # Route groups, pages, layouts (Home, About, Services, Team, etc.)
│   ├── components/           # UI primitives and layout components (Navbar, Footer, Cards)
│   ├── config/               # Centralized site & firm configuration
│   ├── data/                 # Structured typed services and leadership profiles
│   └── types/                # TypeScript models and interfaces
├── backend/                  # FastAPI 0.111.0 (Python 3.10+), SQLAlchemy 2.0.30, Alembic 1.13.1
│   ├── alembic/              # Database migration versioning
│   ├── app/
│   │   ├── api/              # API router (/api/v1) & endpoints (health check)
│   │   ├── core/             # Pydantic Settings (v2.7.1), Logging, Exceptions, Handlers
│   │   ├── db/               # Engine, SessionLocal, get_db dependency, Base
│   │   ├── middleware/       # Request logging, performance timing
│   │   ├── models/           # SQLAlchemy ORM models (Role, User)
│   │   ├── schemas/          # Pydantic request/response validation schemas
│   │   ├── services/         # Business logic repository abstraction
│   │   └── main.py           # FastAPI application entry point & lifespan
│   └── tests/                # Pytest automated test suite
├── docker-compose.yml        # Development orchestration (hot-reload, volume mounts)
├── docker-compose.prod.yml   # Production orchestration (multi-worker, pre-built, hardened)
├── .env.example              # Environment variables template
└── README.md
```

### Core Technologies & Actual Versions
- **Frontend**: Next.js `16.3.4`, React `19.2.8`, Tailwind CSS `@tailwindcss/postcss` `v4`, TypeScript `^5`, Lucide React `^1.40.0`
- **Backend**: FastAPI `0.111.0`, Python `3.10+`, SQLAlchemy `2.0.30`, Alembic `1.13.1`, Pydantic `2.7.1`, Uvicorn `0.29.0`, Pytest `8.2.0`
- **Database**: PostgreSQL `15`

---

## ⚙️ Environment Configuration

Copy the template file `.env.example` to `.env`:

```bash
cp .env.example .env
```

### Configuration Variables Reference

| Variable | Description | Development Default | Production Requirement |
| :--- | :--- | :--- | :--- |
| `PROJECT_NAME` | Name of the CA Firm Platform | `Singh & Thakur Associates CA Platform` | Set firm title |
| `ENVIRONMENT` | Application mode (`development`, `production`, `test`) | `development` | `production` |
| `API_V1_STR` | Global API prefix | `/api/v1` | `/api/v1` |
| `SECRET_KEY` | Cryptographic secret for signing tokens | *Placeholder key* | **Must be generated** (`openssl rand -hex 32`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifespan | `30` | `15` - `60` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifespan | `7` | `7` - `30` |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins | `http://localhost:3000,http://127.0.0.1:3000` | `https://yourfirmdomain.com` |
| `NEXT_PUBLIC_API_URL` | Base API URL for browser client | `http://localhost:8000` | `https://api.yourfirmdomain.com` |
| `POSTGRES_SERVER` | Database host | `db` (or `localhost` for bare-metal) | `db` or RDS/Cloud SQL endpoint |
| `POSTGRES_USER` | Database username | `postgres` | Custom DB user |
| `POSTGRES_PASSWORD` | Database password | *Placeholder password* | **Must be a strong, unique password** |
| `POSTGRES_DB` | Database name | `cafirm` | `cafirm_prod` |
| `POSTGRES_PORT` | Database port | `5432` | `5432` |
| `DATABASE_URL` | Optional full connection string override | *(None)* | *(Optional)* |

> [!WARNING]
> Never commit `.env` or production passwords to version control. Always verify that `.env` remains in `.gitignore`.

---

## 🐳 Running with Docker

### 1. Local Development Mode (with Live Reloading)
In development mode, source code directories are bind-mounted into containers and both the backend (Uvicorn `--reload`) and frontend (Next.js Dev Server) hot-reload upon saving files.

```bash
# Start all services in development mode
docker-compose up --build
```

### 2. Production Mode (Hardened & Multi-Worker)
In production mode:
- Code is built statically into immutable Docker images (no live host volume mounts).
- Uvicorn runs multiple worker processes without `--reload`.
- Database ports are private to the internal container network.
- Environment variables are strictly enforced from your production `.env` file without relying on fallback defaults.

```bash
# Run production containers in background
docker-compose -f docker-compose.prod.yml --env-file .env up --build -d
```

### Service Access URLs
- **Public CA Website**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Health Check Endpoint**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 💻 Local Development (Bare-Metal / Without Docker)

### Backend Setup (FastAPI)
1. Navigate to the backend directory and set up a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   # On Windows:
   ./venv/Scripts/activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run database migrations:
   ```bash
   alembic upgrade head
   ```
4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup (Next.js)
1. Navigate to the frontend directory and install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Next.js development server:
   ```bash
   npm run dev
   ```

---

## 🗄️ Database Migrations (Alembic)

Database schema revisions are managed using Alembic under `backend/alembic/versions/`.

- **Apply migrations:**
  ```bash
  cd backend
  alembic upgrade head
  ```
- **Create new migration:**
  ```bash
  cd backend
  alembic revision --autogenerate -m "add_table_name"
  ```
- **Roll back migration:**
  ```bash
  cd backend
  alembic downgrade -1
  ```

---

## 🧪 Testing & Quality Assurance

### Run Backend Tests
Automated tests validate configuration loading, custom domain exception handlers, and the database-connected health check:
```bash
cd backend
./venv/Scripts/python -m pytest -v
```

### Run Frontend Linting & Typecheck
```bash
cd frontend
npx eslint .
npx tsc --noEmit
npm run build
```

---

## 🛡️ Security Best Practices
1. **Sensitive Data Redaction**: Automatic redaction of PAN, Aadhaar, bank accounts, and credentials from application logs via custom logging filters.
2. **Safe Error Handling**: Internal stack traces and database errors are masked in production responses.
3. **CORS Isolation**: Whitelist-based origin validation.
4. **Environment Separation**: Distinct configuration paths for development and production deployments.
