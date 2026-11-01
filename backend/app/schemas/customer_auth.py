from typing import Optional, List
from pydantic import BaseModel, EmailStr

class CustomerRegisterRequest(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    password: str
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = "Chennai"
    state: Optional[str] = "Tamil Nadu"
    pincode: Optional[str] = "600001"
    landmark: Optional[str] = None
    preferred_language: Optional[str] = "en"

class CustomerLoginRequest(BaseModel):
    identifier: str # Email or Phone
    password: str

class CustomerProfileResponse(BaseModel):
    id: str
    customer_code: str
    name: str
    phone: str
    email: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    landmark: Optional[str] = None
    preferred_language: str
    total_orders_count: int
    created_at: str

class CustomerAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    customer: CustomerProfileResponse

class CustomerUpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    landmark: Optional[str] = None
    preferred_language: Optional[str] = None
