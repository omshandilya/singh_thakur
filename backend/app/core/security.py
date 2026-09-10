"""
core/security.py — Password hashing and JWT token operations for Phase 2.1.

All secrets are read from `settings`. Passwords are hashed with bcrypt
and never stored or logged in plaintext.
"""
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from jose import JWTError, jwt
import bcrypt

from app.core.config import settings

# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------

def hash_password(plain_password: str) -> str:
    """Return a bcrypt hash of *plain_password*. Never stores the raw value."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain_password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True when *plain_password* matches *hashed_password*."""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Token helpers
# ---------------------------------------------------------------------------

def _build_token(data: dict[str, Any], expires_delta: timedelta) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + expires_delta
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(
    subject: str,
    role: str,
    extra_claims: Optional[dict[str, Any]] = None,
) -> str:
    """
    Return a short-lived JWT access token.

    Args:
        subject: Typically the user UUID as a string.
        role: The user's role name (e.g. "ADMIN").
        extra_claims: Optional additional claims to include.
    """
    data: dict[str, Any] = {"sub": subject, "role": role, "type": "access"}
    if extra_claims:
        data.update(extra_claims)
    return _build_token(data, timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))


def create_refresh_token(subject: str) -> str:
    """
    Return a longer-lived JWT refresh token.

    The raw token string is returned to the caller; only a SHA-256 hash
    is persisted in the database.
    """
    import uuid
    data: dict[str, Any] = {"sub": subject, "type": "refresh", "jti": str(uuid.uuid4())}
    return _build_token(data, timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))


def decode_token(token: str) -> Optional[dict[str, Any]]:
    """
    Decode and validate a JWT token.

    Returns the payload dict on success, or None if the token is invalid
    or expired. Never raises — callers check for None.
    """
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None


# ---------------------------------------------------------------------------
# Password-reset tokens (short-lived, single-use via email)
# ---------------------------------------------------------------------------

def generate_password_reset_token(email: str) -> str:
    """Return a short-lived JWT containing the user's email for password reset."""
    data: dict[str, Any] = {"sub": email, "type": "password_reset"}
    return _build_token(data, timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES))


def verify_password_reset_token(token: str) -> Optional[str]:
    """
    Validate a password-reset token.

    Returns the email address embedded in the token, or None if invalid/expired.
    """
    payload = decode_token(token)
    if payload is None:
        return None
    if payload.get("type") != "password_reset":
        return None
    return payload.get("sub")


# ---------------------------------------------------------------------------
# Utility: hash a raw refresh-token string for DB storage
# ---------------------------------------------------------------------------

def hash_token(raw_token: str) -> str:
    """Return a SHA-256 hex digest of *raw_token* for safe DB persistence."""
    return hashlib.sha256(raw_token.encode()).hexdigest()
