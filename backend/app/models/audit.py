import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    
    action = Column(String(100), nullable=False) # e.g. USER_LOGIN, KNOWLEDGE_UPLOAD, CALL_HANDOFF_ACCEPTED, CAMPAIGN_LAUNCH
    entity_type = Column(String(50), nullable=False) # e.g. CALL, HANDOFF, CUSTOMER, PRODUCT, KNOWLEDGE
    entity_id = Column(String(50), nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    details = Column(JSON, default=dict)
    
    timestamp = Column(DateTime, default=datetime.utcnow)

