from typing import List, Optional, Union
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator, ConfigDict
import os

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "Khaira AI Voice Automation Platform"
    COMPANY_NAME: str = "Khaira Company"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENV: str = Field(default="development")
    DEBUG: bool = Field(default=True)

    @field_validator("DEBUG", mode="before")
    def parse_debug(cls, v):
        if isinstance(v, str):
            return v.lower() in ("true", "1", "t", "yes", "y", "dev", "development")
        return bool(v)

    SECRET_KEY: str = Field(default="khaira-enterprise-voice-secret-key-prod-2026")
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
    
    # High-Volume Concurrency & Scalable Call Queue Architecture
    MAX_CONCURRENT_CALLS: int = Field(default=1000, description="Maximum simultaneous active voice calls handled")
    CALL_WORKER_POOL_SIZE: int = Field(default=32, description="Asynchronous worker tasks for parallel call processing")
    CALL_QUEUE_CAPACITY: int = Field(default=5000, description="Max backlog in call waiting queue")
    RATE_LIMIT_PER_MINUTE: int = Field(default=120, description="Max API requests per minute per caller IP/phone")
    CALL_SESSION_TTL_SECONDS: int = Field(default=1800, description="Active call session timeout (30 mins)")
    
    # Storage
    STORAGE_DIR: str = Field(default="./data_storage")
    UPLOAD_MAX_SIZE_MB: int = 25
    
    # Telephony Gateway Configuration
    SIP_HOST: str = "127.0.0.1"
    SIP_PORT: int = 5060
    SIP_USER: str = "khaira_voice_agent"
    SIP_PASSWORD: str = "khaira_sip_secret"
    TELEPHONY_MODE: str = Field(default="browser_simulated")
    
    # Voice & Speech Settings
    DEFAULT_LANGUAGE: str = "en"
    SUPPORTED_LANGUAGES: List[str] = ["en", "ta", "hi", "te", "ml"]
    EXTENSIBLE_LANGUAGES: List[str] = ["kn", "mr", "bn", "gu", "es", "fr", "ar"]
    TTS_PROVIDER: str = Field(default="edge_tts", description="edge_tts, browser_native, or cloud_api")
    STT_PROVIDER: str = Field(default="faster_whisper", description="faster_whisper, browser_native, or cloud_api")
    
    # Compliance & Data Protection
    DPDPA_COMPLIANCE_ENABLED: bool = Field(default=True, description="Digital Personal Data Protection Act compliance")
    CALL_RECORDING_CONSENT_REQUIRED: bool = Field(default=True, description="Strict consent required before recording")
    DND_SCRUBBING_ENABLED: bool = Field(default=True, description="TRAI National Do-Not-Disturb registry check")

settings = Settings()

os.makedirs(settings.STORAGE_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "uploads"), exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "recordings"), exist_ok=True)
