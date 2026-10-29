from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ComplaintBase(BaseModel):
    customer_id: str
    order_id: Optional[str] = None
    title: str
    description: str
    category: str = "Product Issue"
    priority: str = "MEDIUM"

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    assigned_to_id: Optional[str] = None
    resolution_notes: Optional[str] = None

class ComplaintResponse(ComplaintBase):
    id: str
    ticket_number: str
    status: str
    assigned_to_id: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

