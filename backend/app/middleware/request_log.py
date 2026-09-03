import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.core.logging import logger


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that assigns a unique request ID, measures request duration,
    and logs request/response metadata.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid.uuid4())
        start_time = time.time()

        # Log incoming request
        logger.info(f"--> {request.method} {request.url.path} (request_id={request_id})")

        response = await call_next(request)

        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = f"{process_time:.4f}s"
        response.headers["X-Request-ID"] = request_id

        # Log completion
        logger.info(
            f"<-- {request.method} {request.url.path} {response.status_code} "
            f"completed in {process_time * 1000:.2f}ms (request_id={request_id})"
        )

        return response
