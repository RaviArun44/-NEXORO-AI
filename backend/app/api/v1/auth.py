from datetime import timedelta
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User
from app.models.company import Company
from app.models.customer import Customer
from app.schemas.auth import LoginRequest, RegisterRequest, Token
from app.schemas.user import UserResponse
from app.api.deps import get_current_user

router = APIRouter()

class UserPortalLoginRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str

@router.post("/login", response_model=Token)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == req.email)
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled")

    access_token = create_access_token(
        subject=user.id,
        role=user.role
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "role": user.role,
            "department": user.department,
            "status": user.status,
            "extension": user.extension
        }
    }

@router.post("/user-login", response_model=Token)
async def user_portal_login(req: UserPortalLoginRequest, db: AsyncSession = Depends(get_db)):
    cleaned_email = req.email.strip().lower()
    cleaned_phone = req.phone.strip()
    cleaned_name = req.name.strip()

    stmt = select(User).where(User.email == cleaned_email)
    res = await db.execute(stmt)
    user = res.scalars().first()

    comp_stmt = select(Company)
    comp_res = await db.execute(comp_stmt)
    company = comp_res.scalars().first()

    if not user:
        user = User(
            company_id=company.id if company else None,
            email=cleaned_email,
            hashed_password=get_password_hash("User@12345"),
            full_name=cleaned_name,
            phone=cleaned_phone,
            department="Customer Portal",
            role="USER",
            status="AVAILABLE"
        )
        db.add(user)
    else:
        user.full_name = cleaned_name
        user.phone = cleaned_phone

    # Ensure corresponding Customer CRM record is synced
    cust_stmt = select(Customer).where((Customer.email == cleaned_email) | (Customer.phone == cleaned_phone))
    cust_res = await db.execute(cust_stmt)
    customer = cust_res.scalars().first()
    if not customer:
        customer = Customer(
            company_id=company.id if company else None,
            name=cleaned_name,
            email=cleaned_email,
            phone=cleaned_phone,
            preferred_language="en",
            consent_for_outbound=True,
            dnd_opt_out=False
        )
        db.add(customer)
    else:
        customer.name = cleaned_name
        customer.email = cleaned_email

    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "role": user.role,
            "department": user.department,
            "status": user.status,
            "extension": user.extension
        }
    }

@router.post("/user-login", response_model=Token)
async def user_portal_login(req: UserPortalLoginRequest, db: AsyncSession = Depends(get_db)):
    cleaned_email = req.email.strip().lower()
    cleaned_phone = req.phone.strip()
    cleaned_name = req.name.strip()

    stmt = select(User).where(User.email == cleaned_email)
    res = await db.execute(stmt)
    user = res.scalars().first()

    comp_stmt = select(Company)
    comp_res = await db.execute(comp_stmt)
    company = comp_res.scalars().first()

    if not user:
        user = User(
            company_id=company.id if company else None,
            email=cleaned_email,
            hashed_password=get_password_hash("User@12345"),
            full_name=cleaned_name,
            phone=cleaned_phone,
            department="Customer Portal",
            role="USER",
            status="AVAILABLE"
        )
        db.add(user)
    else:
        user.full_name = cleaned_name
        user.phone = cleaned_phone

    # Ensure corresponding Customer CRM record is synced
    cust_stmt = select(Customer).where((Customer.email == cleaned_email) | (Customer.phone == cleaned_phone))
    cust_res = await db.execute(cust_stmt)
    customer = cust_res.scalars().first()
    if not customer:
        customer = Customer(
            company_id=company.id if company else None,
            name=cleaned_name,
            email=cleaned_email,
            phone=cleaned_phone,
            preferred_language="en",
            consent_for_outbound=True,
            dnd_opt_out=False
        )
        db.add(customer)
    else:
        customer.name = cleaned_name
        customer.email = cleaned_email

    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "role": user.role,
            "department": user.department,
            "status": user.status,
            "extension": user.extension
        }
    }

@router.post("/register", response_model=Token)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    stmt = select(User).where(User.email == req.email)
    res = await db.execute(stmt)
    if res.scalars().first():
        raise HTTPException(status_code=400, detail="Email is already registered")

    # Get primary company
    comp_stmt = select(Company)
    comp_res = await db.execute(comp_stmt)
    company = comp_res.scalars().first()

    new_user = User(
        company_id=company.id if company else None,
        email=req.email,
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name,
        phone=req.phone,
        department=req.department or "Customer Support",
        role=req.role or "ADMIN",
        status="AVAILABLE"
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    access_token = create_access_token(subject=new_user.id, role=new_user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role,
            "department": new_user.department,
            "status": new_user.status,
            "extension": new_user.extension
        }
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

