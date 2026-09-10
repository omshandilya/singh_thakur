"""
services/token_service.py — Refresh-token lifecycle management.

Responsibilities:
- Store a SHA-256 hash of a newly issued refresh token.
- Validate an incoming refresh token against the DB record.
- Rotate (revoke old, issue new) on each refresh request.
- Revoke all tokens for a user on logout.
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_refresh_token, decode_token, hash_token
from app.models.refresh_token import RefreshToken
from app.models.user import User


class TokenService:
    def _token_expiry(self) -> datetime:
        return datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    def create_and_store_refresh_token(self, db: Session, user: User) -> str:
        """
        Generate a new refresh JWT, persist its hash, and return the raw token.

        The raw token is given to the client. Only the SHA-256 hash lives in DB.
        """
        raw_token = create_refresh_token(str(user.id))
        token_hash = hash_token(raw_token)

        db_token = RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=self._token_expiry(),
            revoked=False,
        )
        db.add(db_token)
        db.commit()
        return raw_token

    def validate_and_rotate(
        self, db: Session, raw_token: str
    ) -> tuple[Optional[User], Optional[str]]:
        """
        Validate *raw_token*, revoke it, issue a new token, and return
        ``(user, new_raw_token)``. Returns ``(None, None)`` on any failure.

        Token rotation: the old token is immediately revoked so it cannot
        be replayed even if intercepted.
        """
        payload = decode_token(raw_token)
        if payload is None or payload.get("type") != "refresh":
            return None, None

        token_hash = hash_token(raw_token)
        db_token = (
            db.query(RefreshToken)
            .filter(RefreshToken.token_hash == token_hash)
            .first()
        )

        if db_token is None or not db_token.is_valid:
            return None, None

        user: Optional[User] = db.query(User).filter(User.id == db_token.user_id).first()
        if user is None or not user.is_active:
            return None, None

        # Revoke the consumed token
        db_token.revoked = True
        db.flush()

        # Issue a fresh token
        new_raw = self.create_and_store_refresh_token(db, user)
        return user, new_raw

    def revoke_token(self, db: Session, raw_token: str) -> bool:
        """
        Revoke a single refresh token. Returns True if found and revoked.
        """
        token_hash = hash_token(raw_token)
        db_token = (
            db.query(RefreshToken)
            .filter(RefreshToken.token_hash == token_hash)
            .first()
        )
        if db_token is None:
            return False
        db_token.revoked = True
        db.commit()
        return True

    def revoke_all_user_tokens(self, db: Session, user_id: uuid.UUID) -> int:
        """
        Revoke all active refresh tokens for *user_id* (used on password change
        or explicit full logout). Returns the count of revoked records.
        """
        updated = (
            db.query(RefreshToken)
            .filter(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked == False,  # noqa: E712
            )
            .all()
        )
        for token in updated:
            token.revoked = True
        db.commit()
        return len(updated)


token_service = TokenService()
