import uuid
from typing import Optional
from sqlalchemy.orm import Session, joinedload

from app.models.client import Client, ClientTypeEnum
from app.models.user import User
from app.schemas.client import ClientUpdate


class ClientService:
    def get_by_user_id(self, db: Session, user_id: uuid.UUID) -> Optional[Client]:
        """Fetch client profile associated with a given user ID."""
        return (
            db.query(Client)
            .options(joinedload(Client.assigned_employee))
            .filter(Client.user_id == user_id)
            .first()
        )

    def get_or_create_for_user(self, db: Session, user: User) -> Client:
        """
        Fetch the client profile for the user. If none exists (e.g. newly registered
        user accessing dashboard for the first time), automatically initialize one.
        """
        client = self.get_by_user_id(db, user.id)
        if client is not None:
            return client

        # Derive an initial name from full_name or email handle
        default_name = user.full_name
        if not default_name:
            email_handle = user.email.split("@")[0]
            default_name = email_handle.replace(".", " ").replace("_", " ").title()

        new_client = Client(
            user_id=user.id,
            name=default_name or "Client",
            client_type=ClientTypeEnum.INDIVIDUAL,
            email=user.email,
            phone=user.phone,
        )
        db.add(new_client)
        db.commit()
        db.refresh(new_client)

        return self.get_by_user_id(db, user.id) or new_client

    def update_client_for_user(
        self, db: Session, user: User, data: ClientUpdate
    ) -> Client:
        """Update client profile for authenticated user using validated payload."""
        client = self.get_or_create_for_user(db, user)

        update_fields = data.model_dump(exclude_unset=True)
        for field, value in update_fields.items():
            setattr(client, field, value)

        db.add(client)
        db.commit()
        db.refresh(client)

        return self.get_by_user_id(db, user.id) or client


client_service = ClientService()
