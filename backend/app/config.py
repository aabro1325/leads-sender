from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    gemini_api_key: str = ""
    reoon_api_key: str = ""
    resend_api_key: str = ""
    resend_from: str = "You <you@example.com>"
    redis_url: str = "redis://localhost:6379/0"
    product_md_path: str = "product.md"
    leads_dir: str = "/app/leads"
    scan_interval_seconds: int = 300


settings = Settings()
