"""Application configuration loaded from environment variables."""

from __future__ import annotations

import json
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    # ── App ──
    APP_ENV: str = "development"
    SECRET_KEY: str = "CHANGE-ME"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24h

    # ── Database ──
    DATABASE_URL: str = "sqlite+aiosqlite:///./skillbridge.db"

    # ── Azure Blob Storage ──
    AZURE_STORAGE_CONNECTION_STRING: str = ""
    AZURE_STORAGE_CONTAINER_NAME: str = "skillbridge-uploads"

    # ── CORS ──
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # ── File Uploads ──
    MAX_FILE_SIZE_MB: int = 5
    ALLOWED_FILE_TYPES: str = "image/jpeg,image/png,image/webp,application/pdf"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [origin.strip() for origin in v.split(",")]
        return v

    @property
    def allowed_file_types_list(self) -> List[str]:
        return [t.strip() for t in self.ALLOWED_FILE_TYPES.split(",")]

    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    @property
    def is_sqlite(self) -> bool:
        return "sqlite" in self.DATABASE_URL

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
