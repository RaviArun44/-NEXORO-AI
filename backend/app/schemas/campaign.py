from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class CampaignCreate(BaseModel):
    name: str
    campaign_type: str = "APPOINTMENT_REMINDER"
    script_prompt: str
    target_language: str = "en"
    scheduled_at: Optional[datetime] = None
    respect_dnd: bool = True
    require_prior_consent: bool = True
    lead_customer_ids: Optional[List[str]] = None

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    script_prompt: Optional[str] = None
    status: Optional[str] = None # DRAFT, SCHEDULED, RUNNING, PAUSED, COMPLETED
    scheduled_at: Optional[datetime] = None

class CampaignLeadResponse(BaseModel):
    id: str
    campaign_id: str
    customer_id: Optional[str] = None
    phone: str
    customer_name: str
    language: str
    custom_variables: Dict[str, Any]
    status: str
    attempts: int
    call_id: Optional[str] = None
    call_outcome: Optional[str] = None
    called_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CampaignResponse(BaseModel):
    id: str
    name: str
    campaign_type: str
    script_prompt: str
    target_language: str
    scheduled_at: Optional[datetime] = None
    status: str
    total_leads: int
    completed_calls: int
    successful_outcomes: int
    failed_calls: int
    respect_dnd: bool
    require_prior_consent: bool
    created_at: datetime

    class Config:
        from_attributes = True

