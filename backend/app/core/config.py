from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    app_name: str = "Skillora API"
    api_prefix: str = "/api"
    frontend_origin: str = "http://localhost:5173"
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_jwt_issuer: str = ""
    supabase_jwt_jwks_url: str = ""
    supabase_jwt_algorithms: str = "ES256,RS256"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    mentor_rate_limit_per_minute: int = 20
    mentor_request_timeout_seconds: float = 20.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()

