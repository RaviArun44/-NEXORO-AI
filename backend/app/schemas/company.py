from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class CompanyBase(BaseModel):
    name: str
    industry: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    receptionist_name: str = "Nexora"
    default_language: str = "en"
    supported_languages: List[str] = ["en", "ta", "hi", "te", "ml"]
    greeting_template: str
    operating_hours: Dict[str, Any]
    handoff_phone: Optional[str] = None
    auto_handoff_on_low_confidence: bool = True
    confidence_threshold: str = "0.65"
    telephony_mode: str = "browser_simulated"
    sip_server: Optional[str] = None

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    receptionist_name: Optional[str] = None
    default_language: Optional[str] = None
    supported_languages: Optional[List[str]] = None
    greeting_template: Optional[str] = None
    operating_hours: Optional[Dict[str, Any]] = None
    handoff_phone: Optional[str] = None
    auto_handoff_on_low_confidence: Optional[bool] = None
    confidence_threshold: Optional[str] = None
    telephony_mode: Optional[str] = None
    sip_server: Optional[str] = None

class CompanyResponse(CompanyBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

