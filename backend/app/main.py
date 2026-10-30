import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import api_router
from app.seed import seed_initial_data
from app.services.call_queue_manager import call_queue_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("khaira")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Khaira AI Voice Automation Platform database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database schema initialized.")
    
    # Run seed to ensure Khaira Company profile, products, knowledge base, and staff exist
    await seed_initial_data()
    logger.info("Khaira AI Startup Complete. High-Volume Multilingual Voice Engine Ready.")
    yield
    logger.info("Shutting down Khaira AI Voice Automation Platform.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise Multilingual AI Voice Automation Platform for Khaira Company",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploaded documents and recordings directory
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
app.mount("/storage", StaticFiles(directory=settings.STORAGE_DIR), name="storage")

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    metrics = call_queue_manager.get_queue_metrics()
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "company": settings.COMPANY_NAME,
        "version": settings.VERSION,
        "supported_languages": settings.SUPPORTED_LANGUAGES,
        "extensible_languages": settings.EXTENSIBLE_LANGUAGES,
        "telephony_mode": settings.TELEPHONY_MODE,
        "concurrency": {
            "active_calls": metrics["active_concurrent_calls"],
            "max_capacity": metrics["max_concurrent_capacity"],
            "queued_calls": metrics["queued_calls"],
            "health": metrics["system_health"]
        }
    }

@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "company": settings.COMPANY_NAME,
        "description": "Enterprise-Level Multilingual AI Voice Automation Platform",
        "api_docs": "/docs",
        "health": "/health"
    }
