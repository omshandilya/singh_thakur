from app.core.config import Settings


def test_settings_cors_origins_parsing():
    """
    Verifies that CORS origins provided as comma-separated strings are parsed into clean lists.
    """
    settings = Settings(
        CORS_ORIGINS="http://localhost:3000, http://127.0.0.1:3000, https://cafirm.example.com",
        PROJECT_NAME="Test Platform",
        ENVIRONMENT="test",
        POSTGRES_SERVER="localhost",
        POSTGRES_USER="postgres",
        POSTGRES_PASSWORD="password",
        POSTGRES_DB="testdb",
    )
    origins = settings.cors_origins_list
    assert len(origins) == 3
    assert "http://localhost:3000" in origins
    assert "http://127.0.0.1:3000" in origins
    assert "https://cafirm.example.com" in origins


def test_settings_database_uri_construction():
    """
    Verifies that sync_database_uri is properly constructed from parts or database_url.
    """
    settings = Settings(
        PROJECT_NAME="Test Platform",
        POSTGRES_SERVER="dbhost",
        POSTGRES_USER="myuser",
        POSTGRES_PASSWORD="mypassword",
        POSTGRES_DB="mydb",
        POSTGRES_PORT=5432,
    )
    assert settings.sync_database_uri == "postgresql://myuser:mypassword@dbhost:5432/mydb"

    # With direct override
    settings_override = Settings(
        DATABASE_URL="postgresql://customuser:pass@customhost:5432/customdb",
    )
    assert settings_override.sync_database_uri == "postgresql://customuser:pass@customhost:5432/customdb"
