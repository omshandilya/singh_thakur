from fastapi import APIRouter
from app.api.endpoints import health

api_router = APIRouter()

# Health check router
api_router.include_router(health.router, tags=["Health"])

# Future Phase routers will be cleanly mounted here:
# api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
# api_router.include_router(users.router, prefix="/users", tags=["Users"])
# api_router.include_router(clients.router, prefix="/clients", tags=["Clients"])
# api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
# api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
# api_router.include_router(compliance.router, prefix="/compliance", tags=["Compliance"])
# api_router.include_router(invoices.router, prefix="/invoices", tags=["Invoices"])
