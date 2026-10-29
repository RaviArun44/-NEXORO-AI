import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from app.core.database import Base

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=True)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False)
    employee_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    
    appointment_number = Column(String(50), unique=True, index=True, nullable=False)
    service_name = Column(String(255), default="Product Consultation & Demo")
    scheduled_time = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=30)
    
    status = Column(String(50), default="SCHEDULED") # SCHEDULED, CONFIRMED, COMPLETED, CANCELLED, RESCHEDULED
    location_type = Column(String(50), default="ONLINE_VOICE") # IN_PERSON, ONLINE_VOICE, VIDEO
    location_details = Column(String(255), default="NEXORA Dedicated Virtual Conference Line")
    cancellation_reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

