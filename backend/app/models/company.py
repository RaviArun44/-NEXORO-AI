import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, Integer, JSON
from app.core.database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, default="NEXORA Tech Enterprises")
    industry = Column(String(100), default="Technology & Retail Solutions")
    phone = Column(String(50), default="+1-800-555-6396")
    email = Column(String(100), default="contact@nexoratech.example")
    address = Column(Text, default="100 Innovation Boulevard, Suite 400, Tech City")
    
    # Receptionist AI configurations
    receptionist_name = Column(String(100), default="Nexora")
    default_language = Column(String(10), default="en") # en, ta, hi, te, ml
    supported_languages = Column(JSON, default=lambda: ["en", "ta", "hi", "te", "ml"])
    greeting_template = Column(
        Text, 
        default="Welcome to NEXORA Tech Enterprises! My name is Nexora, your AI virtual receptionist. How may I assist you today?"
    )
    operating_hours = Column(
        JSON, 
        default=lambda: {
            "monday": {"open": "09:00", "close": "18:00", "closed": False},
            "tuesday": {"open": "09:00", "close": "18:00", "closed": False},
            "wednesday": {"open": "09:00", "close": "18:00", "closed": False},
            "thursday": {"open": "09:00", "close": "18:00", "closed": False},
            "friday": {"open": "09:00", "close": "18:00", "closed": False},
            "saturday": {"open": "10:00", "close": "16:00", "closed": False},
            "sunday": {"open": "00:00", "close": "00:00", "closed": True}
        }
    )
    handoff_phone = Column(String(50), default="+1-800-555-0199")
    auto_handoff_on_low_confidence = Column(Boolean, default=True)
    confidence_threshold = Column(String(10), default="0.65")
    
    # Telephony Gateway settings
    telephony_mode = Column(String(50), default="browser_simulated") # browser_simulated, asterisk, freeswitch, sip_trunk
    sip_server = Column(String(100), default="127.0.0.1:5060")
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
