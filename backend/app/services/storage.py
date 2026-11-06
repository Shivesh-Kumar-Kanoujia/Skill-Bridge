"""File storage service — local filesystem for dev, Azure Blob Storage for production."""

from __future__ import annotations

import os
import uuid
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings


# Local uploads directory for development
UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


async def upload_file(file: UploadFile, user_id: int, subfolder: str = "avatars") -> str:
    """Upload a file and return its storage URL/path.

    Uses Azure Blob Storage when configured, falls back to local filesystem.
    """
    # Validate file type
    if file.content_type not in settings.allowed_file_types_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{file.content_type}' not allowed. "
                   f"Allowed: {', '.join(settings.allowed_file_types_list)}",
        )

    # Read file content and validate size
    content = await file.read()
    if len(content) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE_MB}MB.",
        )

    # Generate unique filename
    ext = Path(file.filename).suffix if file.filename else ".bin"
    unique_name = f"{subfolder}/{user_id}/{uuid.uuid4().hex}{ext}"

    if settings.AZURE_STORAGE_CONNECTION_STRING:
        return await _upload_azure(content, unique_name, file.content_type)
    else:
        return await _upload_local(content, unique_name)


async def _upload_azure(content: bytes, blob_name: str, content_type: str) -> str:
    """Upload to Azure Blob Storage."""
    try:
        from azure.storage.blob import BlobServiceClient, ContentSettings

        blob_service = BlobServiceClient.from_connection_string(
            settings.AZURE_STORAGE_CONNECTION_STRING
        )
        container_client = blob_service.get_container_client(
            settings.AZURE_STORAGE_CONTAINER_NAME
        )
        # Create container if not exists
        try:
            container_client.create_container()
        except Exception:
            pass  # Already exists

        blob_client = container_client.get_blob_client(blob_name)
        blob_client.upload_blob(
            content,
            overwrite=True,
            content_settings=ContentSettings(content_type=content_type),
        )
        return blob_client.url
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="Azure Storage SDK not installed.",
        )


async def _upload_local(content: bytes, relative_path: str) -> str:
    """Save file locally (development fallback)."""
    file_path = UPLOAD_DIR / relative_path
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(content)
    return f"/uploads/{relative_path}"


async def delete_file(file_url: str) -> None:
    """Delete a file from storage."""
    if not file_url:
        return

    if settings.AZURE_STORAGE_CONNECTION_STRING and "blob.core.windows.net" in file_url:
        try:
            from azure.storage.blob import BlobServiceClient

            blob_service = BlobServiceClient.from_connection_string(
                settings.AZURE_STORAGE_CONNECTION_STRING
            )
            # Extract blob name from URL
            blob_name = file_url.split(settings.AZURE_STORAGE_CONTAINER_NAME + "/")[-1]
            container_client = blob_service.get_container_client(
                settings.AZURE_STORAGE_CONTAINER_NAME
            )
            container_client.delete_blob(blob_name)
        except Exception:
            pass  # Best-effort deletion
    elif file_url.startswith("/uploads/"):
        local_path = UPLOAD_DIR / file_url.replace("/uploads/", "")
        if local_path.exists():
            local_path.unlink()
