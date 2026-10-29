from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AppointmentBase(BaseModel):
    customer_id: str
    employee_id: Optional[str] = None
    service_name: str = "Product Consultation & Demo"
    scheduled_time: datetime
    duration_minutes: int = 30
    location_type: str = "ONLINE_VOICE"
    location_details: Optional[str] = "NEXORA Dedicated Virtual Conference Line"
    notes: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    scheduled_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    status: Optional[str] = None
    employee_id: Optional[str] = None
    location_type: Optional[str] = None
    location_details: Optional[str] = None
    cancellation_reason: Optional[str] = None
    notes: Optional[str] = None

class AppointmentResponse(AppointmentBase):
    id: str
    appointment_number: str
    status: str
    cancellation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SlotCheckRequest(BaseModel):
    date: str # YYYY-MM-DD
    service_name: Optional[str] = None
