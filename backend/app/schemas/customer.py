from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class CustomerBase(BaseModel):
    phone: str
    name: str = "Guest Caller"
    email: Optional[EmailStr] = None
    preferred_language: str = "en"
    company_name: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = ["Customer"]
    consent_for_outbound: bool = True
    dnd_opt_out: bool = False

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    phone: Optional[str] = None
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    preferred_language: Optional[str] = None
    company_name: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    consent_for_outbound: Optional[bool] = None
    dnd_opt_out: Optional[bool] = None

class CustomerResponse(CustomerBase):
    id: str
    total_calls_count: int
    last_contacted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

