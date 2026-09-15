"""
services/storage.py — S3-compatible Storage Abstraction Layer for Phase 2.3.

Provides an abstract BaseStorageService interface, a production-grade
S3CompatibleStorageService (supporting AWS S3, Cloudflare R2, MinIO),
and a LocalStorageService with HMAC time-expiring signed download URLs.
"""
from abc import ABC, abstractmethod
import base64
import hashlib
import hmac
import json
import os
import time
from typing import Optional, Tuple
from pathlib import Path

from app.core.config import settings


class BaseStorageService(ABC):
    @abstractmethod
    def save_file(self, file_data: bytes, storage_key: str, content_type: str) -> str:
        """Save raw bytes to storage using safe storage_key."""
        pass

    @abstractmethod
    def get_file(self, storage_key: str) -> Tuple[bytes, str]:
        """Retrieve file bytes and content type."""
        pass

    @abstractmethod
    def generate_signed_download_url(
        self, storage_key: str, original_filename: str, expires_in: int = 900
    ) -> str:
        """Generate a short-lived signed download URL (valid for expires_in seconds)."""
        pass

    @abstractmethod
    def delete_file(self, storage_key: str) -> bool:
        """Delete file from storage."""
        pass

    @abstractmethod
    def file_exists(self, storage_key: str) -> bool:
        """Check if file exists in storage."""
        pass


class LocalStorageService(BaseStorageService):
    """
    Local filesystem storage provider for development and testing.
    Generates HMAC-signed expiring tokens for secure download streaming.
    """

    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = Path(base_dir or settings.STORAGE_LOCAL_DIR).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _resolve_path(self, storage_key: str) -> Path:
        # Sanitize storage_key to prevent directory traversal
        clean_key = storage_key.lstrip("/\\")
        target_path = (self.base_dir / clean_key).resolve()
        if not str(target_path).startswith(str(self.base_dir)):
            raise ValueError("Invalid storage key path traversal detected.")
        return target_path

    def save_file(self, file_data: bytes, storage_key: str, content_type: str) -> str:
        target_path = self._resolve_path(storage_key)
        target_path.parent.mkdir(parents=True, exist_ok=True)
        with open(target_path, "wb") as f:
            f.write(file_data)
        return storage_key

    def get_file(self, storage_key: str) -> Tuple[bytes, str]:
        target_path = self._resolve_path(storage_key)
        if not target_path.exists() or not target_path.is_file():
            raise FileNotFoundError(f"Stored file '{storage_key}' not found.")
        with open(target_path, "rb") as f:
            data = f.read()
        return data, "application/octet-stream"

    def generate_signed_download_url(
        self, storage_key: str, original_filename: str, expires_in: int = 900
    ) -> str:
        expires_at = int(time.time()) + expires_in
        payload = {
            "key": storage_key,
            "filename": original_filename,
            "exp": expires_at,
        }
        payload_bytes = json.dumps(payload, sort_keys=True).encode("utf-8")
        payload_b64 = base64.urlsafe_b64encode(payload_bytes).decode("utf-8").rstrip("=")

        sig = hmac.new(
            settings.SECRET_KEY.encode("utf-8"),
            payload_b64.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        token = f"{payload_b64}.{sig}"
        # Return download endpoint with signature token
        return f"{settings.API_V1_STR}/documents/download-stream?token={token}"

    @classmethod
    def verify_download_token(cls, token: str) -> Tuple[str, str]:
        """
        Verify HMAC download token. Returns (storage_key, original_filename).
        Raises ValueError if invalid or expired.
        """
        try:
            parts = token.split(".")
            if len(parts) != 2:
                raise ValueError("Invalid token format.")
            payload_b64, provided_sig = parts

            expected_sig = hmac.new(
                settings.SECRET_KEY.encode("utf-8"),
                payload_b64.encode("utf-8"),
                hashlib.sha256,
            ).hexdigest()

            if not hmac.compare_digest(provided_sig, expected_sig):
                raise ValueError("Invalid token signature.")

            # Add padding back if necessary
            padding = len(payload_b64) % 4
            if padding:
                payload_b64 += "=" * (4 - padding)

            payload_bytes = base64.urlsafe_b64decode(payload_b64)
            data = json.loads(payload_bytes.decode("utf-8"))

            if data.get("exp", 0) < int(time.time()):
                raise ValueError("Download URL has expired.")

            storage_key = data.get("key")
            filename = data.get("filename", "document")
            if not storage_key:
                raise ValueError("Missing storage key in token.")

            return storage_key, filename
        except Exception as e:
            if isinstance(e, ValueError):
                raise
            raise ValueError("Token verification failed.") from e

    def delete_file(self, storage_key: str) -> bool:
        try:
            target_path = self._resolve_path(storage_key)
            if target_path.exists():
                os.remove(target_path)
                return True
            return False
        except Exception:
            return False

    def file_exists(self, storage_key: str) -> bool:
        try:
            target_path = self._resolve_path(storage_key)
            return target_path.exists() and target_path.is_file()
        except Exception:
            return False


class S3CompatibleStorageService(BaseStorageService):
    """
    S3-compatible storage service for AWS S3, Cloudflare R2, and MinIO.
    """

    def __init__(self):
        try:
            import boto3
            from botocore.config import Config
        except ImportError:
            raise ImportError(
                "boto3 is required for S3CompatibleStorageService. Run `pip install boto3`."
            )

        client_kwargs = {
            "service_name": "s3",
            "region_name": settings.S3_REGION,
        }
        if settings.S3_ENDPOINT_URL:
            client_kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL
        if settings.S3_ACCESS_KEY and settings.S3_SECRET_KEY:
            client_kwargs["aws_access_key_id"] = settings.S3_ACCESS_KEY
            client_kwargs["aws_secret_access_key"] = settings.S3_SECRET_KEY

        self.bucket = settings.S3_BUCKET_NAME
        self.s3_client = boto3.client(
            **client_kwargs,
            config=Config(signature_version="s3v4"),
        )

    def save_file(self, file_data: bytes, storage_key: str, content_type: str) -> str:
        self.s3_client.put_object(
            Bucket=self.bucket,
            Key=storage_key,
            Body=file_data,
            ContentType=content_type,
        )
        return storage_key

    def get_file(self, storage_key: str) -> Tuple[bytes, str]:
        res = self.s3_client.get_object(Bucket=self.bucket, Key=storage_key)
        data = res["Body"].read()
        content_type = res.get("ContentType", "application/octet-stream")
        return data, content_type

    def generate_signed_download_url(
        self, storage_key: str, original_filename: str, expires_in: int = 900
    ) -> str:
        # Generate presigned GET url with Content-Disposition attachment
        disposition = f'attachment; filename="{original_filename}"'
        url = self.s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": self.bucket,
                "Key": storage_key,
                "ResponseContentDisposition": disposition,
            },
            ExpiresIn=expires_in,
        )
        return url

    def delete_file(self, storage_key: str) -> bool:
        try:
            self.s3_client.delete_object(Bucket=self.bucket, Key=storage_key)
            return True
        except Exception:
            return False

    def file_exists(self, storage_key: str) -> bool:
        try:
            self.s3_client.head_object(Bucket=self.bucket, Key=storage_key)
            return True
        except Exception:
            return False


_storage_instance: Optional[BaseStorageService] = None


def get_storage_service() -> BaseStorageService:
    """
    Factory to return the active storage service instance based on configuration.
    Falls back gracefully to LocalStorageService if S3 credentials are not configured.
    """
    global _storage_instance
    if _storage_instance is not None:
        return _storage_instance

    backend = settings.STORAGE_BACKEND.lower().strip()
    if backend in ("s3", "minio", "r2") and settings.S3_ACCESS_KEY:
        try:
            _storage_instance = S3CompatibleStorageService()
            return _storage_instance
        except Exception:
            # Fallback to local storage if S3 initialization fails
            _storage_instance = LocalStorageService()
            return _storage_instance

    _storage_instance = LocalStorageService()
    return _storage_instance
