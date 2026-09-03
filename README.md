# CA Firm Platform

This is the platform for the CA firm, consisting of a public website and (eventually) a client portal, dashboard, and management system.

## Phase 1
Currently, the project contains the foundation for Phase 1:
- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python, SQLAlchemy, Alembic
- **Database**: PostgreSQL
- **Infrastructure**: Docker & Docker Compose

## Getting Started

### Prerequisites
- Docker
- Docker Compose

### Running Locally

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Start the services using Docker Compose:
   ```bash
   docker-compose up --build
   ```

### Services

- **Frontend (Next.js)**: http://localhost:3000
- **Backend (FastAPI)**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: `localhost:5432`

## Development

### Backend Migrations
Migrations are managed with Alembic. They will run automatically when starting the backend via Docker Compose.
To create a new migration:
```bash
docker-compose exec backend alembic revision --autogenerate -m "migration_name"
```
