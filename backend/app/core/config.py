"""Application configuration — env-driven, no hardcoded values."""
from functools import lru_cache
from pathlib import Path
import os
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / ".env")


class Settings:
    mongo_url: str = os.environ["MONGO_URL"]
    db_name: str = os.environ["DB_NAME"]
    cors_origins: list[str] = os.environ.get("CORS_ORIGINS", "*").split(",")
    resume_url: str = os.environ.get("RESUME_URL", "")
    admin_email: str = os.environ.get("ADMIN_EMAIL", "")
    admin_password: str = os.environ.get("ADMIN_PASSWORD", "")
    emergent_llm_key: str = os.environ.get("EMERGENT_LLM_KEY", "")
    app_version: str = "0.4.0"
    app_name: str = "manas-portfolio-api"


@lru_cache
def get_settings() -> Settings:
    return Settings()
