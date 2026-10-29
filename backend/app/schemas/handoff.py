from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class HandoffTicketCreate(BaseModel):
    call_id: str
    customer_id: Optional[str] = None
    target_department: str = "Customer Support"
    reason: str
    ai_summary: str
    context_notes: Dict[str, Any] = {}
    customer_name: Optional[str] = "Caller"
    customer_phone: Optional[str] = ""
    customer_language: Optional[str] = "en"

class HandoffTicketUpdate(BaseModel):
    status: Optional[str] = None # ACCEPTED, REJECTED, RETURNED, RESOLVED
    assigned_user_id: Optional[str] = None
    resolved_at: Optional[datetime] = None

class HandoffTicketResponse(BaseModel):
    id: str
    call_id: str
    customer_id: Optional[str] = None
    assigned_user_id: Optional[str] = None
    target_department: str
    status: str
    reason: str
    ai_summary: str
    context_notes: Dict[str, Any]
    customer_name: str
    customer_phone: str
    customer_language: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True
