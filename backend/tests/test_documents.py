import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.models.document import DocumentStatusEnum
from app.models.role import RoleEnum
from app.schemas.auth import RegisterRequest
from app.services.client_service import client_service
from app.services.user_service import user_service


@pytest.fixture
def ca_user(db_session: Session) -> dict:
    email = "ca.advisor@example.com"
    password = "CAPassword123"
    existing = user_service.get_by_email(db_session, email)
    if not existing:
        req = RegisterRequest(
            email=email,
            password=password,
            full_name="Senior CA Advisor",
        )
        existing = user_service.create_user(db_session, req, role_name=RoleEnum.CA)
    return {"user": existing, "email": email}


@pytest.fixture
def ca_auth_headers(ca_user: dict) -> dict:
    user = ca_user["user"]
    token = create_access_token(subject=str(user.id), role=user.role.name.value)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def client_one(db_session: Session, test_user: dict) -> dict:
    # Ensure client profile is created for test_user
    client_rec = client_service.get_or_create_for_user(db_session, test_user["user"])
    return {"user": test_user["user"], "client": client_rec}


@pytest.fixture
def client_two(db_session: Session) -> dict:
    email = "client2.doc@example.com"
    password = "ClientPassword456"
    existing = user_service.get_by_email(db_session, email)
    if not existing:
        req = RegisterRequest(
            email=email,
            password=password,
            full_name="Client Two",
        )
        existing = user_service.create_user(db_session, req, role_name=RoleEnum.CLIENT)
    client_rec = client_service.get_or_create_for_user(db_session, existing)
    token = create_access_token(subject=str(existing.id), role=existing.role.name.value)
    return {
        "user": existing,
        "client": client_rec,
        "headers": {"Authorization": f"Bearer {token}"},
    }


def test_ca_create_document_request(
    client: TestClient, ca_auth_headers: dict, client_one: dict
):
    """CA can create a document request for a client."""
    payload = {
        "client_id": str(client_one["client"].id),
        "title": "FY 2025-26 Form 16 Part A & B",
        "description": "Please upload signed Form 16 from all employers for the tax year.",
    }
    res = client.post(
        "/api/v1/document-requests", json=payload, headers=ca_auth_headers
    )
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == payload["title"]
    assert data["status"] == "REQUESTED"
    assert data["client_id"] == str(client_one["client"].id)
    assert "id" in data


def test_client_cannot_create_document_request(
    client: TestClient, auth_headers: dict, client_one: dict
):
    """Clients are forbidden from creating document requests."""
    payload = {
        "client_id": str(client_one["client"].id),
        "title": "Unauthorized Request",
    }
    res = client.post("/api/v1/document-requests", json=payload, headers=auth_headers)
    assert res.status_code == 403


def test_client_views_own_document_requests(
    client: TestClient, auth_headers: dict, ca_auth_headers: dict, client_one: dict
):
    """Client can list and retrieve their own document requests."""
    # Create request as CA
    res_req = client.post(
        "/api/v1/document-requests",
        json={
            "client_id": str(client_one["client"].id),
            "title": "Bank Statements Q4",
        },
        headers=ca_auth_headers,
    )
    req_id = res_req.json()["id"]

    # Client lists requests
    res_list = client.get("/api/v1/document-requests", headers=auth_headers)
    assert res_list.status_code == 200
    items = res_list.json()
    assert any(item["id"] == req_id for item in items)

    # Client gets single request
    res_single = client.get(f"/api/v1/document-requests/{req_id}", headers=auth_headers)
    assert res_single.status_code == 200
    assert res_single.json()["title"] == "Bank Statements Q4"


def test_client_isolation_document_requests(
    client: TestClient, ca_auth_headers: dict, client_one: dict, client_two: dict
):
    """Client 2 must be forbidden from accessing Client 1's document request."""
    # Create request for Client 1
    res_req = client.post(
        "/api/v1/document-requests",
        json={
            "client_id": str(client_one["client"].id),
            "title": "Private Audit Trail Client 1",
        },
        headers=ca_auth_headers,
    )
    req_id = res_req.json()["id"]

    # Client 2 tries to view Client 1's request
    res_denied = client.get(
        f"/api/v1/document-requests/{req_id}", headers=client_two["headers"]
    )
    assert res_denied.status_code == 403


def test_client_upload_valid_document(
    client: TestClient, auth_headers: dict, ca_auth_headers: dict, client_one: dict
):
    """Client uploads a valid document linked to a request."""
    # Create request
    res_req = client.post(
        "/api/v1/document-requests",
        json={
            "client_id": str(client_one["client"].id),
            "title": "GST Invoices Oct-Dec",
        },
        headers=ca_auth_headers,
    )
    req_id = res_req.json()["id"]

    # Upload document
    dummy_pdf = b"%PDF-1.4 mock pdf content for unit testing"
    files = {"file": ("gst_invoices.pdf", dummy_pdf, "application/pdf")}
    data = {"document_request_id": req_id}

    res_upload = client.post(
        "/api/v1/documents/upload",
        files=files,
        data=data,
        headers=auth_headers,
    )
    assert res_upload.status_code == 201
    doc_data = res_upload.json()
    assert doc_data["original_filename"] == "gst_invoices.pdf"
    assert doc_data["status"] == "UPLOADED"
    assert doc_data["document_request_id"] == req_id
    assert "storage_key" not in doc_data  # Internal storage key never leaked!

    # Check request status transitioned to UPLOADED
    res_req_updated = client.get(
        f"/api/v1/document-requests/{req_id}", headers=auth_headers
    )
    assert res_req_updated.json()["status"] == "UPLOADED"


def test_upload_invalid_file_extension(client: TestClient, auth_headers: dict):
    """Uploading disallowed file type (e.g. .exe) must be rejected with 400."""
    fake_exe = b"MZ\x90\x00executable binary"
    files = {"file": ("malicious_file.exe", fake_exe, "application/octet-stream")}
    res = client.post("/api/v1/documents/upload", files=files, headers=auth_headers)
    assert res.status_code == 400
    assert "not permitted" in res.json()["error"]["message"]


def test_client_cannot_upload_to_another_client_request(
    client: TestClient, ca_auth_headers: dict, client_one: dict, client_two: dict
):
    """Client 2 cannot upload a document against Client 1's request."""
    res_req = client.post(
        "/api/v1/document-requests",
        json={
            "client_id": str(client_one["client"].id),
            "title": "Confidential Tax Report",
        },
        headers=ca_auth_headers,
    )
    req_id = res_req.json()["id"]

    dummy_pdf = b"%PDF-1.4 mock pdf"
    files = {"file": ("intruder.pdf", dummy_pdf, "application/pdf")}
    data = {"document_request_id": req_id}

    res = client.post(
        "/api/v1/documents/upload",
        files=files,
        data=data,
        headers=client_two["headers"],
    )
    assert res.status_code == 404


def test_ca_review_document_approval_and_rejection(
    client: TestClient, auth_headers: dict, ca_auth_headers: dict, client_one: dict
):
    """CA reviews document: rejection with reason, and subsequent re-upload and approval."""
    # 1. Upload document
    dummy_pdf = b"%PDF-1.4 draft return"
    res_up = client.post(
        "/api/v1/documents/upload",
        files={"file": ("draft_itr.pdf", dummy_pdf, "application/pdf")},
        headers=auth_headers,
    )
    doc_id = res_up.json()["id"]

    # 2. CA rejects with reason
    reject_payload = {
        "status": "REJECTED",
        "rejection_reason": "Missing auditor signature on page 3.",
    }
    res_rej = client.post(
        f"/api/v1/documents/{doc_id}/review",
        json=reject_payload,
        headers=ca_auth_headers,
    )
    assert res_rej.status_code == 200
    rej_data = res_rej.json()
    assert rej_data["status"] == "REJECTED"
    assert rej_data["rejection_reason"] == "Missing auditor signature on page 3."

    # 3. Client replaces / re-uploads the rejected document
    corrected_pdf = b"%PDF-1.4 signed return by chartered accountant"
    res_rep = client.post(
        f"/api/v1/documents/{doc_id}/replace",
        files={"file": ("signed_itr.pdf", corrected_pdf, "application/pdf")},
        headers=auth_headers,
    )
    assert res_rep.status_code == 200
    rep_data = res_rep.json()
    assert rep_data["status"] == "UPLOADED"
    assert rep_data["original_filename"] == "signed_itr.pdf"
    assert rep_data["rejection_reason"] is None

    # 4. CA approves the re-uploaded document
    approve_payload = {"status": "APPROVED"}
    res_app = client.post(
        f"/api/v1/documents/{doc_id}/review",
        json=approve_payload,
        headers=ca_auth_headers,
    )
    assert res_app.status_code == 200
    assert res_app.json()["status"] == "APPROVED"


def test_signed_download_url_and_stream(client: TestClient, auth_headers: dict):
    """Test generating a signed URL and streaming the document content."""
    dummy_content = b"PDF binary test stream content with special characters: 123456789"
    res_up = client.post(
        "/api/v1/documents/upload",
        files={"file": ("download_test.pdf", dummy_content, "application/pdf")},
        headers=auth_headers,
    )
    doc_id = res_up.json()["id"]

    # Generate signed download URL
    res_url = client.get(
        f"/api/v1/documents/{doc_id}/download-url", headers=auth_headers
    )
    assert res_url.status_code == 200
    download_url = res_url.json()["download_url"]
    assert "token=" in download_url

    # Stream the file using the signed download URL
    res_stream = client.get(download_url)
    assert res_stream.status_code == 200
    assert res_stream.content == dummy_content
    assert "download_test.pdf" in res_stream.headers.get("content-disposition", "")


def test_tampered_download_token_rejected(client: TestClient):
    """Tampered download token must be rejected with 401."""
    res = client.get("/api/v1/documents/download-stream?token=invalid.tampered.token")
    assert res.status_code == 401
