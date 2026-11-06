"""File storage service tests: uploads, mime types, file size validation."""

import pytest
import io
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_avatar_upload_valid_image(client: AsyncClient, test_user: dict):
    """Verify avatar upload with valid image type."""
    file_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
    files = {"file": ("avatar.png", io.BytesIO(file_content), "image/png")}

    response = await client.post(
        "/api/students/me/avatar",
        files=files,
        headers=test_user["headers"],
    )
    assert response.status_code == 200
    assert response.json()["success"] is True


@pytest.mark.asyncio
async def test_avatar_upload_invalid_mime_type(client: AsyncClient, test_user: dict):
    """Verify upload fails with disallowed file type (e.g. .exe / text/plain)."""
    file_content = b"malicious content or script"
    files = {"file": ("script.exe", io.BytesIO(file_content), "application/x-msdownload")}

    response = await client.post(
        "/api/students/me/avatar",
        files=files,
        headers=test_user["headers"],
    )
    assert response.status_code == 400
    assert "not allowed" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_avatar_upload_unauthenticated(client: AsyncClient):
    """Verify upload without token is rejected."""
    files = {"file": ("avatar.png", io.BytesIO(b"data"), "image/png")}
    response = await client.post("/api/students/me/avatar", files=files)
    assert response.status_code == 401

