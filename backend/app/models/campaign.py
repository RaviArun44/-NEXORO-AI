import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, JSON, Boolean
from app.core.database import Base

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=True)
    name = Column(String(255), nullable=False)
    campaign_type = Column(String(50), default="APPOINTMENT_REMINDER") 
    # APPOINTMENT_REMINDER, ORDER_UPDATE, PAYMENT_REMINDER, CUSTOMER_FEEDBACK, LEAD_FOLLOWUP, RENEWAL_NOTICE
    
    script_prompt = Column(Text, nullable=False)
    target_language = Column(String(10), default="en") # en, ta, hi, te, ml, auto
    scheduled_at = Column(DateTime, nullable=True)
    status = Column(String(30), default="DRAFT") # DRAFT, SCHEDULED, RUNNING, PAUSED, COMPLETED
    
    total_leads = Column(Integer, default=0)
    completed_calls = Column(Integer, default=0)
    successful_outcomes = Column(Integer, default=0)
    failed_calls = Column(Integer, default=0)
    
    # Regulatory settings
    respect_dnd = Column(Boolean, default=True)
    require_prior_consent = Column(Boolean, default=True)
    max_retries = Column(Integer, default=2)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CampaignLead(Base):
    __tablename__ = "campaign_leads"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String(36), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=True)
    
    phone = Column(String(50), nullable=False)
    customer_name = Column(String(255), default="Valued Customer")
    language = Column(String(10), default="en")
    custom_variables = Column(JSON, default=dict) # e.g. {"order_id": "ORD-123", "amount_due": "$45.00"}
    
    status = Column(String(30), default="PENDING") # PENDING, CALLING, ANSWERED, COMPLETED, OPTED_OUT, FAILED
    attempts = Column(Integer, default=0)
    call_id = Column(String(36), ForeignKey("calls.id"), nullable=True)
    call_outcome = Column(String(100), nullable=True)
    called_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

