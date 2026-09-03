from fastapi import APIRouter

router = APIRouter()

@router.get("/health", response_model=dict)
def health_check():
    """
    Health check endpoint to ensure the API is running.
    """
    return {"status": "ok", "message": "API is running"}
