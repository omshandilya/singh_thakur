from fastapi import APIRouter
from app.api.endpoints import health
from app.api.endpoints import auth
from app.api.endpoints import clients
from app.api.endpoints import document_requests
from app.api.endpoints import documents

api_router = APIRouter()

# Health check router
api_router.include_router(health.router, tags=["Health"])

# Phase 2.1 — Authentication & RBAC
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])

# Phase 2.2 — Client Profiles & Client Portal
api_router.include_router(clients.router, prefix="/clients", tags=["Clients"])

# Phase 2.3 — Secure Client Document Management
api_router.include_router(
    document_requests.router, prefix="/document-requests", tags=["Document Requests"]
)
api_router.include_router(
    documents.router, prefix="/documents", tags=["Documents"]
)

# Future Phase routers will be cleanly mounted here:
# api_router.include_router(users.router, prefix="/users", tags=["Users"])
# api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
# api_router.include_router(compliance.router, prefix="/compliance", tags=["Compliance"])
# api_router.include_router(invoices.router, prefix="/invoices", tags=["Invoices"])

