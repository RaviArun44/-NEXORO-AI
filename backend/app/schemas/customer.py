from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class CustomerBase(BaseModel):
    phone: str
    name: str = "Guest Customer"
    email: Optional[EmailStr] = None
    preferred_language: str = "en"
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = "Chennai"
    state: Optional[str] = "Tamil Nadu"
    pincode: Optional[str] = "600001"
    landmark: Optional[str] = None
    company_name: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = ["Customer"]
    consent_for_outbound: bool = True
    dnd_opt_out: bool = False
    is_active: bool = True

class CustomerCreate(CustomerBase):
    customer_code: Optional[str] = None

class CustomerUpdate(BaseModel):
    phone: Optional[str] = None
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    preferred_language: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    landmark: Optional[str] = None
    company_name: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    consent_for_outbound: Optional[bool] = None
    dnd_opt_out: Optional[bool] = None
    is_active: Optional[bool] = None

class CustomerResponse(CustomerBase):
    id: str
    customer_code: str
    total_calls_count: int = 0
    total_orders_count: int = 0
    last_contacted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
