"""Application configuration — Pydantic Settings v2."""

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Loaded from environment / .env file at startup."""

    # Database (asyncpg)
    database_url: str = "postgresql+asyncpg://fh:fh_dev_password@localhost:5432/fh"

    @field_validator("database_url", mode="before")
    @classmethod
    def _ensure_asyncpg_driver(cls, v: str) -> str:
        # Railway and most managed Postgres hand out plain postgresql://...
        # SQLAlchemy needs the asyncpg driver tag for our async engine.
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        return v

    # Redis
    redis_url: str = "redis://localhost:6379"

    # JWT
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_ttl_min: int = 30
    jwt_refresh_ttl_days: int = 7

    # CORS — accepts a JSON list string or a Python list
    cors_origins: list[str] = ["http://localhost:3000"]

    # AWS S3 (private documents) — also accepts any S3-compatible provider (e.g. R2)
    # via aws_s3_endpoint_url. When empty, boto3 defaults to AWS S3.
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_s3_bucket: str = ""
    aws_region: str = "us-east-1"
    aws_s3_endpoint_url: str = ""

    # Cloudflare R2 (public media)
    cf_r2_access_key_id: str = ""
    cf_r2_secret_access_key: str = ""
    cf_r2_bucket: str = ""
    cf_r2_endpoint: str = ""
    cf_r2_public_base_url: str = ""  # e.g. https://cdn.fhplatform.com

    # Local dev uploads root (used when cloud creds are absent)
    local_uploads_root: str = "./uploads"

    # Frontend base URL — used to build doc-request share links
    frontend_base_url: str = "http://localhost:3000"

    # Transactional email via Resend
    resend_api_key: str = ""
    email_from: str = "fh <onboarding@resend.dev>"

    # Seeding
    seed_superadmin_email: str = "admin@fhplatform.com"
    seed_superadmin_password: str = "change-me"
    seed_superadmin_name: str = "Super Admin"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
