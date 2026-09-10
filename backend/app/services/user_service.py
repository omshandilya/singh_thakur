"""
services/user_service.py — User retrieval, creation, and authentication logic.

Business rules live here; the API layer stays thin.
"""
from typing import Optional
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.schemas.auth import RegisterRequest


class UserService:
    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        """Return a User by email (case-insensitive), or None."""
        return db.query(User).filter(User.email == email.lower()).first()

    def get_by_id(self, db: Session, user_id) -> Optional[User]:
        """Return a User by UUID primary key, or None."""
        return db.query(User).filter(User.id == user_id).first()

    def get_role_by_name(self, db: Session, name: RoleEnum) -> Optional[Role]:
        """Return a Role by its enum value, or None."""
        return db.query(Role).filter(Role.name == name).first()

    # ------------------------------------------------------------------
    # Mutations
    # ------------------------------------------------------------------

    def create_user(
        self,
        db: Session,
        data: RegisterRequest,
        role_name: RoleEnum = RoleEnum.CLIENT,
    ) -> User:
        """
        Create and persist a new User with a hashed password.

        The plaintext password is never stored or logged.
        """
        role = self.get_role_by_name(db, role_name)
        if role is None:
            raise ValueError(f"Role '{role_name}' not found. Seed roles first.")

        user = User(
            email=data.email.lower(),
            full_name=data.full_name,
            phone=data.phone,
            hashed_password=hash_password(data.password),
            role_id=role.id,
            is_active=True,
            is_verified=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def authenticate(self, db: Session, email: str, password: str) -> Optional[User]:
        """
        Validate credentials and return the User if correct, or None.

        A timing-safe bcrypt comparison is used so that both "user not found"
        and "wrong password" take similar time (mitigates timing attacks).
        """
        user = self.get_by_email(db, email)
        if user is None:
            # Perform a dummy verify to consume similar time as a real check
            verify_password("dummy", "$2b$12$dummyhashfordummyuserpassword1234")
            return None
        if not user.hashed_password:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def update_password(self, db: Session, user: User, new_password: str) -> User:
        """Hash *new_password* and persist it on *user*."""
        user.hashed_password = hash_password(new_password)
        db.commit()
        db.refresh(user)
        return user


user_service = UserService()
