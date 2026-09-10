import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base_class import Base
from app.db.session import get_db
from app.main import app
from app.models.role import Role, RoleEnum

# In-memory SQLite engine for fast isolated unit/integration tests
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """
    Creates all database tables once for the test session.
    """
    Base.metadata.create_all(bind=test_engine)
    
    # Pre-seed base roles
    db = TestingSessionLocal()
    for role_name in RoleEnum:
        existing = db.query(Role).filter(Role.name == role_name).first()
        if not existing:
            db.add(Role(name=role_name, description=f"{role_name.value} role"))
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    """
    Yields an isolated database session per test with automatic rollback.
    """
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


from app.core.security import create_access_token
from app.services.user_service import user_service
from app.schemas.auth import RegisterRequest


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """
    Yields a FastAPI TestClient with the get_db dependency overridden by the test session.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session: Session) -> dict:
    """
    Creates and returns a test user with CLIENT role.
    """
    email = "test.client@example.com"
    password = "SecurePassword123"
    
    existing = user_service.get_by_email(db_session, email)
    if not existing:
        req = RegisterRequest(
            email=email,
            password=password,
            full_name="Test Client",
        )
        existing = user_service.create_user(db_session, req, role_name=RoleEnum.CLIENT)
        
    return {
        "user": existing,
        "email": email,
        "password": password
    }


@pytest.fixture
def auth_headers(test_user: dict) -> dict:
    """
    Returns HTTP authorization headers for the test_user.
    """
    user = test_user["user"]
    token = create_access_token(
        subject=str(user.id),
        role=user.role.name.value
    )
    return {"Authorization": f"Bearer {token}"}
