from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: Optional[str] = None
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    extension: Optional[str] = "101"
    department: str = "Customer Support"
    role: str = "AGENT"
    status: str = "AVAILABLE"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    extension: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: str
    is_active: bool
    is_superuser: bool
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

