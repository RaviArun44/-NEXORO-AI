from typing import Dict, Any, List
from fastapi import APIRouter
from app.services.speech_service import speech_service
from app.services.ai_engine import ai_engine
from app.core.config import settings

router = APIRouter()

@router.get("")
async def get_ai_configuration():
    return {
        "engine_version": "NEXORA-v1.0-Multilingual",
        "supported_languages": [
            {"code": "en", "name": "English", "native_name": "English", "voice": "en-US-JennyNeural"},
            {"code": "ta", "name": "Tamil", "native_name": "தமிழ்", "voice": "ta-IN-PallaviNeural"},
            {"code": "hi", "name": "Hindi", "native_name": "हिन्दी", "voice": "hi-IN-SwaraNeural"},
            {"code": "te", "name": "Telugu", "native_name": "తెలుగు", "voice": "te-IN-ShrutiNeural"},
            {"code": "ml", "name": "Malayalam", "native_name": "മലയാളം", "voice": "ml-IN-SobhanaNeural"}
        ],
        "default_language": settings.DEFAULT_LANGUAGE,
        "confidence_threshold": settings.CONFIDENCE_THRESHOLD,
        "anti_hallucination_mode": "STRICT_GROUNDED",
        "voices": speech_service.VOICE_CONFIGS,
        "greetings": ai_engine.LANGUAGE_GREETINGS,
        "refusals": ai_engine.LANGUAGE_POLITE_REFUSALS,
        "ollama_base_url": settings.OLLAMA_BASE_URL,
        "default_model": settings.DEFAULT_LLM_MODEL
    }

