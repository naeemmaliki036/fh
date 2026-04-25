"""Application configuration — Pydantic Settings v2."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Loaded from environment / .env file at startup."""

    # Database (asyncpg)
    database_url: str = "postgresql+asyncpg://fh:fh_dev_password@localhost:5432/fh"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # JWT
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_ttl_min: int = 30
    jwt_refresh_ttl_days: int = 7

    # CORS — accepts a JSON list string or a Python list
    cors_origins: list[str] = ["http://localhost:3000"]

    # AWS S3 (private documents)
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_s3_bucket: str = ""
    aws_region: str = "us-east-1"

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
