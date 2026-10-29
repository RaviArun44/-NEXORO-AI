import logging
from typing import Optional
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.core.database import get_db, AsyncSessionLocal
from app.models.call import Call
from app.models.company import Company
from app.services.conversation_orchestrator import orchestrator
from app.services.speech_service import speech_service
from app.services.human_handoff_service import human_handoff_service
from app.services.ai_engine import ai_engine
from app.schemas.call import CallResponse

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/start")
async def start_live_call(
    caller_number: str = "+1-800-BROWSER-TEST",
    direction: str = "INBOUND",
    language: str = "en",
    db: AsyncSession = Depends(get_db)
):
    """
    Initializes a new live voice call session.
    Returns initial greeting tailored to the selected language.
    """
    greeting = ai_engine.LANGUAGE_GREETINGS.get(language, ai_engine.LANGUAGE_GREETINGS["en"])

    call = Call(
        direction=direction,
        caller_number=caller_number,
        receiver_number="+1-800-555-6396",
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

    tts = await speech_service.synthesize_speech(greeting, language)

    return {
        "call_id": call.id,
        "caller_number": call.caller_number,
        "status": call.status,
        "language": language,
        "greeting_text": greeting,
        "tts": tts,
        "started_at": call.start_time.isoformat()
    }

@router.post("/turn")
async def process_call_turn(
    call_id: str,
    user_text: str,
    language: Optional[str] = "auto",
    db: AsyncSession = Depends(get_db)
):
    """
    Processes a conversational turn for the call.
    Executes grounded RAG, checks business entities, performs handoff if unknown.
    """
    stmt = select(Call).where(Call.id == call_id)
    res = await db.execute(stmt)
    call = res.scalars().first()
    if not call:
        raise HTTPException(status_code=404, detail="Call session not found")

    result = await orchestrator.process_user_turn(
        db=db,
        call_id=call_id,
        user_text=user_text,
        forced_language=language
    )

    # If AI requested handoff, create transfer ticket
    handoff_ticket = None
    if result.get("trigger_handoff"):
        handoff_ticket = await human_handoff_service.create_handoff_request(
            db=db,
            call_id=call_id,
            reason=result.get("handoff_reason", "Caller needs human specialist"),
            ai_summary=f"Caller asked: '{user_text}'. Transferred for specialized human support.",
            context_notes={"last_query": user_text, "language": result.get("language", "en")},
            target_department="Customer Support"
        )
        call.status = "TRANSFERRED"
        call.outcome = "HANDOFF_TO_HUMAN"
        await db.commit()

    return {
        "call_id": call_id,
        "reply_text": result["reply_text"],
        "language": result["language"],
        "intent": result["intent"],
        "grounded": result["grounded"],
        "trigger_handoff": result["trigger_handoff"],
        "handoff_ticket_id": handoff_ticket.id if handoff_ticket else None,
        "sources": result["sources"],
        "tts": result["tts"],
        "transcript": result["turn_history"]
    }

@router.post("/barge-in")
async def trigger_barge_in(call_id: str):
    """
    Handles caller interruption: immediately cancels active speech playback.
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
    Ends active call and stores final transcripts and summaries.
    """
    call = await orchestrator.finalize_call(db, call_id, outcome=outcome)
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
                    "grounded": result["grounded"],
                    "trigger_handoff": result["trigger_handoff"],
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
