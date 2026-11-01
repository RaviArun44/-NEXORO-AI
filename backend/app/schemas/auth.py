from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    # Supports username or email login
    username_or_email: Optional[str] = None
    email: Optional[str] = None
    username: Optional[str] = None
    password: str
    role: Optional[str] = None # CUSTOMER, AGENT, ADMIN
    remember_me: Optional[bool] = False

class RegisterRequest(BaseModel):
    full_name: str
    username: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    password: str
    confirm_password: Optional[str] = None
    department: Optional[str] = "Customer Support"
    role: Optional[str] = "CUSTOMER" # CUSTOMER, AGENT, ADMIN
    admin_key: Optional[str] = None # Required if role is ADMIN to ensure secure setup

class ForgotPasswordRequest(BaseModel):
    email_or_username: str

class ResetPasswordRequest(BaseModel):
    email_or_username: str
    new_password: str
    confirm_new_password: str
    reset_code: Optional[str] = None
