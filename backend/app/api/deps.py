"""
api/deps.py — Reusable FastAPI dependency factories for authentication and
role-based access control (RBAC).

Usage examples:
    # Require any authenticated user
    user: User = Depends(get_current_active_user)

    # Require specific roles
    user: User = Depends(require_roles(RoleEnum.ADMIN))
    user: User = Depends(require_roles(RoleEnum.CA, RoleEnum.ADMIN))
"""
from typing import Callable
import uuid

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.security import decode_token
from app.db.session import get_db
from app.models.role import RoleEnum
from app.models.user import User
from app.services.user_service import user_service

# Bearer token extractor — returns None instead of raising when token is absent
_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    """
    Decode the JWT access token from the Authorization header and return the
    corresponding User record.

    Raises UnauthorizedException on any failure (missing token, invalid token,
    user not found).
    """
    if credentials is None:
        raise UnauthorizedException("Authentication credentials were not provided.")

    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != "access":
        raise UnauthorizedException("Invalid or expired access token.")

    user_id_str: str | None = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedException("Malformed token: missing subject.")

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise UnauthorizedException("Malformed token: invalid subject format.")

    user = user_service.get_by_id(db, user_id)
    if user is None:
        raise UnauthorizedException("User account not found.")

    return user


def get_current_active_user(
    user: User = Depends(get_current_user),
) -> User:
    """
    Extend get_current_user by additionally verifying the account is active.
    """
    if not user.is_active:
        raise ForbiddenException("User account is disabled.")
    return user


def require_roles(*roles: RoleEnum) -> Callable:
    """
    Dependency factory that enforces role-based access control.

    Returns a FastAPI dependency function that:
    1. Authenticates the user via JWT.
    2. Checks whether the user's role is in *roles*.
    3. Raises ForbiddenException if the role is insufficient.

    Example:
        @router.get("/admin-only")
        def admin_route(user = Depends(require_roles(RoleEnum.ADMIN))):
            ...
    """
    allowed = {r.value for r in roles}

    def _dependency(user: User = Depends(get_current_active_user)) -> User:
        # Load the role relationship if not already loaded
        role_name = user.role.name.value if user.role else None
        if role_name not in allowed:
            raise ForbiddenException(
                f"Access denied. Required role(s): {', '.join(allowed)}."
            )
        return user

    return _dependency
