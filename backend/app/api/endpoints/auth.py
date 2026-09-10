"""
api/endpoints/auth.py — Authentication endpoints for Phase 2.1.

Routes:
  POST /auth/register          — Register a new CLIENT user
  POST /auth/login             — Authenticate; returns access + refresh tokens
  POST /auth/logout            — Revoke the supplied refresh token
  POST /auth/refresh           — Rotate refresh token; issue new access token
  GET  /auth/me                — Return profile of the authenticated user
  POST /auth/forgot-password   — Initiate password reset (email stub)
  POST /auth/reset-password    — Complete password reset with token
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.core.config import settings
from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    UnauthorizedException,
)
from app.core.logging import logger
from app.core.security import (
    create_access_token,
    generate_password_reset_token,
    verify_password_reset_token,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    MeResponse,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.services.token_service import token_service
from app.services.user_service import user_service

router = APIRouter()

_ACCESS_EXPIRES_SECONDS = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60


# ---------------------------------------------------------------------------
# Register
# ---------------------------------------------------------------------------

@router.post(
    "/register",
    response_model=MeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def register(data: RegisterRequest, db: Session = Depends(get_db)) -> MeResponse:
    """
    Register a new CLIENT account.

    Returns the newly created user profile (no tokens — user must login).
    """
    existing = user_service.get_by_email(db, data.email)
    if existing is not None:
        raise ConflictException("An account with this email address already exists.")

    user = user_service.create_user(db, data)
    logger.info(f"New user registered: {user.email}")
    return _user_to_me(user)


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate and receive tokens",
)
def login(data: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """
    Validate credentials and return a short-lived access token plus a
    longer-lived refresh token.
    """
    user = user_service.authenticate(db, data.email, data.password)
    if user is None:
        raise UnauthorizedException("Invalid email address or password.")

    if not user.is_active:
        raise UnauthorizedException("This account has been deactivated.")

    access_token = create_access_token(
        subject=str(user.id),
        role=user.role.name.value,
    )
    refresh_token = token_service.create_and_store_refresh_token(db, user)

    logger.info(f"User logged in: {user.email}")
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=_ACCESS_EXPIRES_SECONDS,
        role=user.role.name.value,
    )


# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------

@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke the current refresh token",
)
def logout(
    data: RefreshRequest,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_active_user),
) -> None:
    """
    Revoke the supplied refresh token so it cannot be used again.
    The client should discard its stored access token.
    """
    token_service.revoke_token(db, data.refresh_token)
    logger.info(f"User logged out: {_current_user.email}")


# ---------------------------------------------------------------------------
# Refresh
# ---------------------------------------------------------------------------

@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Rotate refresh token and issue new access token",
)
def refresh_token(data: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """
    Accept a valid refresh token, revoke it, and return a new access token
    paired with a new refresh token (rotation).
    """
    user, new_refresh = token_service.validate_and_rotate(db, data.refresh_token)
    if user is None or new_refresh is None:
        raise UnauthorizedException("Refresh token is invalid, expired, or already used.")

    access_token = create_access_token(
        subject=str(user.id),
        role=user.role.name.value,
    )
    logger.info(f"Tokens rotated for user: {user.email}")
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh,
        expires_in=_ACCESS_EXPIRES_SECONDS,
        role=user.role.name.value,
    )


# ---------------------------------------------------------------------------
# Me
# ---------------------------------------------------------------------------

@router.get(
    "/me",
    response_model=MeResponse,
    summary="Get current authenticated user profile",
)
def get_me(current_user: User = Depends(get_current_active_user)) -> MeResponse:
    """Return the profile of the currently authenticated user."""
    return _user_to_me(current_user)


# ---------------------------------------------------------------------------
# Forgot / Reset Password
# ---------------------------------------------------------------------------

@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
    summary="Initiate password reset",
)
def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
) -> ForgotPasswordResponse:
    """
    Generate a password-reset token for the given email address.

    In **development** mode the token is returned in the response body for
    easy testing without an email server.

    In **production** mode only a generic confirmation message is returned;
    the token would be sent via email (email integration is a future phase).
    """
    user = user_service.get_by_email(db, data.email)

    # Always return the same message regardless of whether the email exists
    # to prevent user enumeration.
    generic_msg = (
        "If an account with that email exists, a password reset link has been sent."
    )

    if user is None:
        return ForgotPasswordResponse(message=generic_msg)

    reset_token = generate_password_reset_token(user.email)
    logger.info(f"Password reset requested for: {user.email}")

    if settings.is_production:
        # TODO: Send reset_token via email service in a future phase.
        return ForgotPasswordResponse(message=generic_msg)

    # Development convenience: return the token directly.
    return ForgotPasswordResponse(message=generic_msg, reset_token=reset_token)


@router.post(
    "/reset-password",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Complete password reset",
)
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> None:
    """
    Validate the password-reset token and update the user's password.
    All existing refresh tokens are revoked so active sessions are invalidated.
    """
    email = verify_password_reset_token(data.token)
    if email is None:
        raise BadRequestException("Password reset token is invalid or has expired.")

    user = user_service.get_by_email(db, email)
    if user is None:
        raise BadRequestException("Password reset token is invalid or has expired.")

    user_service.update_password(db, user, data.new_password)
    token_service.revoke_all_user_tokens(db, user.id)
    logger.info(f"Password reset completed for: {user.email}")


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _user_to_me(user: User) -> MeResponse:
    return MeResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        is_active=user.is_active,
        is_verified=user.is_verified,
        role=user.role.name.value if user.role else "UNKNOWN",
        created_at=user.created_at,
        updated_at=user.updated_at,
    )
