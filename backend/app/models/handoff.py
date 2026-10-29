import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
from app.core.database import Base

class HandoffTicket(Base):
    __tablename__ = "handoff_tickets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=True)
    call_id = Column(String(36), ForeignKey("calls.id"), nullable=False)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=True)
    assigned_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    
    target_department = Column(String(100), default="Customer Support")
    status = Column(String(30), default="PENDING") # PENDING, ACCEPTED, REJECTED, RETURNED, RESOLVED
    
    reason = Column(String(255), nullable=False) # e.g. "Question outside AI knowledge base", "Caller requested human supervisor"
    ai_summary = Column(Text, nullable=False) # Brief summary for the employee before taking over
    context_notes = Column(JSON, default=dict) # Last 3 turns, current order/complaint/product context
    customer_name = Column(String(255), default="Caller")
    customer_phone = Column(String(50), default="")
    customer_language = Column(String(10), default="en")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

