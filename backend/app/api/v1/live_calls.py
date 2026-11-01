import os
import uuid
import logging
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, Body, UploadFile, File, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from pydantic import BaseModel

from app.core.config import settings
from app.core.database import get_db, AsyncSessionLocal
from app.models.call import Call
from app.services.conversation_orchestrator import orchestrator
from app.services.speech_service import speech_service
from app.services.vision_service import vision_service
from app.services.human_handoff_service import human_handoff_service
from app.services.ai_engine import ai_engine
from app.services.call_queue_manager import call_queue_manager
from app.schemas.call import CallResponse, TurnRequest

logger = logging.getLogger(__name__)
router = APIRouter()

class VoiceSynthesisRequest(BaseModel):
    text: str
    language: Optional[str] = "en"
    call_id: Optional[str] = None

@router.post("/start")
async def start_live_call(
    caller_number: str = "+91-98401-00199",
    direction: str = "INBOUND",
    language: str = "en",
    db: AsyncSession = Depends(get_db)
):
    """
    Initializes a new live voice call session with concurrency throttle & rate-limiting checks.
    Returns initial greeting tailored to the selected language.
    """
    # 1. Rate Limiting Check
    if not call_queue_manager.check_rate_limit(caller_number):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Too many call requests in a short period."
        )

    # 2. Acquire Concurrency Slot
    acquired = await call_queue_manager.acquire_concurrency_slot(timeout=4.0)
    if not acquired:
        raise HTTPException(
            status_code=503,
            detail="All AI voice agent channels are currently saturated. Please try again shortly."
        )

    greeting = ai_engine.LANGUAGE_GREETINGS.get(language, ai_engine.LANGUAGE_GREETINGS["en"])

    call = Call(
        direction=direction,
        caller_number=caller_number,
        receiver_number="+91-44-6789-0100",
        status="IN_PROGRESS",
        language=language,
        detected_languages=[language],
        start_time=datetime.utcnow(),
        transcript=[{
            "speaker": "ai",
            "text": greeting,
            "timestamp": datetime.utcnow().isoformat(),
            "language": language
        }]
    )
    db.add(call)
    await db.commit()
    await db.refresh(call)

    # Initialize in-memory dialog state
    session = await orchestrator.get_or_create_session(db, call.id, caller_number, direction)
    session.language = language
    session.turns = call.transcript

    tts = await speech_service.synthesize_speech(greeting, language, call_id=call.id)

    return {
        "call_id": call.id,
        "caller_number": call.caller_number,
        "status": call.status,
        "language": language,
        "greeting_text": greeting,
        "tts": tts,
        "started_at": call.start_time.isoformat()
    }

@router.post("/upload-images")
async def upload_images(
    files: List[UploadFile] = File(...)
):
    """
    Accepts 2 or more uploaded images for Multimodal Vision AI.
    Saves to data_storage/uploads/ and runs computer vision inspection.
    Returns uploaded metadata, dominant colors, detected categories, and public URLs.
    """
    uploads_dir = os.path.join(settings.STORAGE_DIR, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)

    results = []
    for file in files:
        file_ext = os.path.splitext(file.filename)[1] or ".jpg"
        unique_name = f"vision_{uuid.uuid4().hex[:10]}{file_ext}"
        saved_path = os.path.join(uploads_dir, unique_name)
        
        contents = await file.read()
        with open(saved_path, "wb") as f:
            f.write(contents)
            
        analysis = vision_service.analyze_image_file(saved_path, original_filename=file.filename)
        results.append(analysis)

    return {
        "status": "SUCCESS",
        "uploaded_count": len(results),
        "images": results
    }

@router.post("/synthesize-voice")
async def synthesize_voice(
    payload: VoiceSynthesisRequest
):
    """
    Synthesizes speech on demand with natural Edge-TTS neural models.
    Supports English, Tamil, Hindi, Telugu, and Malayalam.
    """
    tts = await speech_service.synthesize_speech(
        text=payload.text,
        language=payload.language or "en",
        call_id=payload.call_id
    )
    return tts

@router.post("/turn")
async def process_call_turn(
    request: Request,
    call_id: Optional[str] = Query(None),
    user_text: Optional[str] = Query(None),
    language: Optional[str] = Query("auto"),
    image_urls: Optional[List[str]] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Processes a conversational turn for the call.
    Accepts JSON body or query parameters.
    Executes multimodal Vision AI (if images provided), business workflows, grounded RAG,
    sentiment analysis, and neural speech synthesis.
    """
    body_data: Dict[str, Any] = {}
    try:
        body_data = await request.json()
    except Exception:
        body_data = {}

    c_id = body_data.get("call_id") or call_id
    text = body_data.get("user_text") or body_data.get("text") or user_text or ""
    lang = body_data.get("language") or language or "auto"
    imgs = body_data.get("image_urls") or image_urls or []

    # Ensure call session exists, or auto-create one seamlessly
    call = None
    if c_id:
        stmt = select(Call).where(Call.id == c_id)
        res = await db.execute(stmt)
        call = res.scalars().first()

    if not call:
        c_id = c_id or str(uuid.uuid4())
        initial_lang = lang if lang != "auto" else "en"
        greeting = ai_engine.LANGUAGE_GREETINGS.get(initial_lang, ai_engine.LANGUAGE_GREETINGS["en"])
        call = Call(
            id=c_id,
            direction="INBOUND",
            caller_number="+91-98401-00199",
            receiver_number="+91-44-6789-0100",
            status="IN_PROGRESS",
            language=initial_lang,
            detected_languages=[initial_lang],
            start_time=datetime.utcnow(),
            transcript=[{
                "speaker": "ai",
                "text": greeting,
                "timestamp": datetime.utcnow().isoformat(),
                "language": initial_lang
            }]
        )
        db.add(call)
        await db.commit()
        await db.refresh(call)

    result = await orchestrator.process_user_turn(
        db=db,
        call_id=c_id,
        user_text=text,
        forced_language=lang,
        image_urls=imgs
    )

    # If AI requested handoff, create transfer ticket
    handoff_ticket = None
    if result.get("trigger_handoff"):
        handoff_ticket = await human_handoff_service.create_handoff_request(
            db=db,
            call_id=c_id,
            reason=result.get("handoff_reason", "Caller needs human specialist"),
            ai_summary=f"Caller asked: '{text}'. Transferred for specialized human support.",
            context_notes={"last_query": text, "language": result.get("language", "en")},
            target_department="Customer Support"
        )
        call.status = "TRANSFERRED"
        call.outcome = "HANDOFF_TO_HUMAN"
        await db.commit()

    return {
        "call_id": c_id,
        "reply_text": result["reply_text"],
        "language": result["language"],
        "intent": result["intent"],
        "sentiment": result.get("sentiment", "NEUTRAL"),
        "grounded": result["grounded"],
        "trigger_handoff": result["trigger_handoff"],
        "is_terminal": result.get("is_terminal", False),
        "handoff_ticket_id": handoff_ticket.id if handoff_ticket else None,
        "sources": result["sources"],
        "tts": result["tts"],
        "transcript": result["turn_history"]
    }

@router.post("/audio-turn")
async def process_audio_turn(
    call_id: str,
    audio_base64: str = Body(..., embed=True),
    language: Optional[str] = "auto",
    db: AsyncSession = Depends(get_db)
):
    """
    Direct Speech-to-Text audio turn endpoint.
    Accepts base64 audio from client, transcribes, processes through workflows/RAG, and synthesizes neural audio.
    """
    stmt = select(Call).where(Call.id == call_id)
    res = await db.execute(stmt)
    call = res.scalars().first()
    if not call:
        raise HTTPException(status_code=404, detail="Call session not found")

    # Transcribe audio chunk
    stt_result = await speech_service.transcribe_audio_chunk(audio_base64, language=language)
    transcribed_text = stt_result.get("text", "").strip()

    if not transcribed_text:
        # Default fallback prompt if speech was inaudible
        transcribed_text = "Hello, can you hear me?"

    # Execute conversational turn
    return await process_call_turn(
        call_id=call_id,
        user_text=transcribed_text,
        language=stt_result.get("detected_language", language),
        db=db
    )

@router.post("/barge-in")
async def trigger_barge_in(call_id: str):
    """
    Handles caller interruption: immediately cancels active speech synthesis and playback.
    """
    orchestrator.handle_barge_in(call_id)
    return {"status": "INTERRUPTED", "call_id": call_id}

@router.post("/end")
async def end_live_call(
    call_id: str,
    outcome: str = "RESOLVED_BY_AI",
    db: AsyncSession = Depends(get_db)
):
    """
    Ends active call, releases concurrency slot, and stores final transcripts and summaries.
    """
    call = await orchestrator.finalize_call(db, call_id, outcome=outcome)
    call_queue_manager.release_concurrency_slot()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return {
        "call_id": call.id,
        "status": call.status,
        "duration_seconds": call.duration_seconds,
        "summary": call.summary,
        "outcome": call.outcome
    }

@router.websocket("/ws/{call_id}")
async def call_websocket_endpoint(websocket: WebSocket, call_id: str):
    """
    Bidirectional WebSocket stream for real-time audio/text conversations and interruptions.
    """
    await websocket.accept()
    logger.info(f"WebSocket client connected for call {call_id}")

    try:
        while True:
            data = await websocket.receive_json()
            event = data.get("event")

            if event == "user_message":
                text = data.get("text", "")
                lang = data.get("language", "auto")

                async with AsyncSessionLocal() as session:
                    result = await orchestrator.process_user_turn(
                        db=session,
                        call_id=call_id,
                        user_text=text,
                        forced_language=lang
                    )
                    await session.commit()

                await websocket.send_json({
                    "event": "ai_response",
                    "reply_text": result["reply_text"],
                    "language": result["language"],
                    "sentiment": result.get("sentiment", "NEUTRAL"),
                    "grounded": result["grounded"],
                    "trigger_handoff": result["trigger_handoff"],
                    "is_terminal": result.get("is_terminal", False),
                    "tts": result["tts"],
                    "sources": result["sources"]
                })

            elif event == "interruption":
                orchestrator.handle_barge_in(call_id)
                await websocket.send_json({
                    "event": "playback_halted",
                    "call_id": call_id
                })

            elif event == "ping":
                await websocket.send_json({"event": "pong"})

    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected for call {call_id}")
    except Exception as e:
        logger.error(f"Error in call websocket: {e}")
        try:
            await websocket.close()
        except Exception:
            pass
