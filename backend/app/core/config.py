from typing import List, Optional, Union
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "NEXORA AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENV: str = Field(default="development")
    DEBUG: bool = Field(default=True)

    @field_validator("DEBUG", mode="before")
    def parse_debug(cls, v):
        if isinstance(v, str):
            return v.lower() in ("true", "1", "t", "yes", "y", "dev", "development")
        return bool(v)

    SECRET_KEY: str = Field(default="nexora-secret-super-key-change-in-production-2026")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"
    
    # Database (PostgreSQL with fallback to SQLite for local development)
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./nexora.db",
        description="Async database connection string"
    )
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # AI Engine & Local LLM
    OLLAMA_BASE_URL: str = Field(default="http://localhost:11434")
    DEFAULT_LLM_MODEL: str = Field(default="llama3.2:latest")
    FALLBACK_LLM_PROVIDER: str = Field(default="mock_local")
    CONFIDENCE_THRESHOLD: float = 0.65
    
    # Storage
    STORAGE_DIR: str = Field(default="./data_storage")
    UPLOAD_MAX_SIZE_MB: int = 25
    
    # Telephony Gateway Configuration
    SIP_HOST: str = "127.0.0.1"
    SIP_PORT: int = 5060
    SIP_USER: str = "nexora_agent"
    SIP_PASSWORD: str = "nexora_sip_secret"
    TELEPHONY_MODE: str = Field(default="browser_simulated")
    
    # Voice Settings
    DEFAULT_LANGUAGE: str = "en"
    SUPPORTED_LANGUAGES: List[str] = ["en", "ta", "hi", "te", "ml"]
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

os.makedirs(settings.STORAGE_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "uploads"), exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "recordings"), exist_ok=True)
