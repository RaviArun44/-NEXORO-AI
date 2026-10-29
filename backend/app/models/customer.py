import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, Integer, ForeignKey, JSON
from app.core.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=True)
    phone = Column(String(50), index=True, nullable=False)
    name = Column(String(255), default="Guest Caller")
    email = Column(String(255), nullable=True)
    preferred_language = Column(String(10), default="en") # en, ta, hi, te, ml
    
    # Regulatory Consent & Outbound Settings
    consent_for_outbound = Column(Boolean, default=True)
    dnd_opt_out = Column(Boolean, default=False)
    
    company_name = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    tags = Column(JSON, default=lambda: ["Customer"])
    total_calls_count = Column(Integer, default=0)
    last_contacted_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

