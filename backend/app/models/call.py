import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey, JSON
from app.core.database import Base

class Call(Base):
    __tablename__ = "calls"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=True)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=True)
    
    direction = Column(String(20), default="INBOUND") # INBOUND, OUTBOUND
    caller_number = Column(String(50), nullable=False)
    receiver_number = Column(String(50), default="+1-800-555-6396")
    
    status = Column(String(30), default="IN_PROGRESS") # RINGING, IN_PROGRESS, COMPLETED, TRANSFERRED, MISSED, FAILED
    language = Column(String(10), default="en") # en, ta, hi, te, ml
    detected_languages = Column(JSON, default=lambda: ["en"])
    
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)
    latency_ms = Column(Float, default=320.0) # Average voice roundtrip response time
    
    # Transcripts & AI Analysis
    # transcript: list of {"speaker": "customer"|"ai"|"agent", "text": "...", "timestamp": "...", "language": "..."}
    transcript = Column(JSON, default=list)
    summary = Column(Text, nullable=True)
    intent = Column(String(100), default="General Inquiry")
    sentiment = Column(String(50), default="NEUTRAL") # POSITIVE, NEUTRAL, FRUSTRATED, NEGATIVE
    outcome = Column(String(100), default="RESOLVED_BY_AI") # RESOLVED_BY_AI, HANDOFF_TO_HUMAN, DROPPED, CALLBACK_REQUESTED
    
    # Handoff linkage if transferred
    transferred_to_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    recording_url = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

