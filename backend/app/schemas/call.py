from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class CallTurn(BaseModel):
    speaker: str # customer, ai, agent
    text: str
    timestamp: str
    language: Optional[str] = "en"
    audio_url: Optional[str] = None
    images: Optional[List[str]] = None

class TurnRequest(BaseModel):
    call_id: Optional[str] = None
    user_text: str
    language: Optional[str] = "auto"
    image_urls: Optional[List[str]] = None
    caller_number: Optional[str] = "+91 (44) 6789-0199"

class CallCreate(BaseModel):
    caller_number: str
    receiver_number: Optional[str] = "+1-800-555-6396"
    direction: str = "INBOUND" # INBOUND, OUTBOUND
    customer_id: Optional[str] = None
    language: str = "en"

class CallUpdate(BaseModel):
    status: Optional[str] = None
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    latency_ms: Optional[float] = None
    transcript: Optional[List[Dict[str, Any]]] = None
    summary: Optional[str] = None
    intent: Optional[str] = None
    sentiment: Optional[str] = None
    outcome: Optional[str] = None
    transferred_to_user_id: Optional[str] = None
    recording_url: Optional[str] = None

class CallResponse(BaseModel):
    id: str
    caller_number: str
    receiver_number: str
    direction: str
    status: str
    language: str
    detected_languages: List[str]
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: int
    latency_ms: float
    transcript: List[Dict[str, Any]]
    summary: Optional[str] = None
    intent: Optional[str] = None
    sentiment: Optional[str] = None
    outcome: Optional[str] = None
    transferred_to_user_id: Optional[str] = None
    recording_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class VoiceStreamMessage(BaseModel):
    event: str # "start", "audio_chunk", "text_input", "interruption", "handoff_trigger", "end"
    call_id: Optional[str] = None
    payload: Optional[str] = None
    language: Optional[str] = "auto"

