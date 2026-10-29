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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("nexora")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing NEXORA AI platform database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database schema initialized.")
    
    # Run seed to ensure demo company, initial products, knowledge base, and staff exist
    await seed_initial_data()
    logger.info("NEXORA AI Startup Complete. Ready for Multilingual Voice Calls.")
    yield
    logger.info("Shutting down NEXORA AI platform.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent Multilingual AI Receptionist & Business Communication Platform",
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
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "supported_languages": ["en", "ta", "hi", "te", "ml"],
        "telephony_mode": settings.TELEPHONY_MODE
    }

@app.get("/")
async def root():
    return {
        "name": "NEXORA AI Platform",
        "description": "Enterprise Multilingual Virtual Receptionist & Communication Suite",
        "api_docs": "/docs",
        "health": "/health"
    }
