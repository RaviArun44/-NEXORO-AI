import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.customer import Customer
from app.models.company import Company
from app.schemas.customer_auth import (
    CustomerRegisterRequest,
    CustomerLoginRequest,
    CustomerAuthResponse,
    CustomerProfileResponse,
    CustomerUpdateProfileRequest
)
from app.api.deps import get_current_customer

logger = logging.getLogger(__name__)

router = APIRouter()

async def generate_unique_customer_code(db: AsyncSession) -> str:
    """Generates sequential unique Customer Code: CUST-2026-00001, CUST-2026-00002..."""
    count_stmt = select(func.count(Customer.id))
    res = await db.execute(count_stmt)
    total_count = res.scalar() or 0
    
    candidate = f"CUST-2026-{total_count + 1:05d}"
    # Verify uniqueness
    while True:
        exists_stmt = select(Customer).where(Customer.customer_code == candidate)
        exists_res = await db.execute(exists_stmt)
        if not exists_res.scalars().first():
            return candidate
        total_count += 1
        candidate = f"CUST-2026-{total_count + 1:05d}"

def serialize_customer(customer: Customer) -> CustomerProfileResponse:
    return CustomerProfileResponse(
        id=customer.id,
        customer_code=customer.customer_code,
        name=customer.name,
        phone=customer.phone,
        email=customer.email,
        address_line1=customer.address_line1,
        address_line2=customer.address_line2,
        city=customer.city,
        state=customer.state,
        pincode=customer.pincode,
        landmark=customer.landmark,
        preferred_language=customer.preferred_language or "en",
        total_orders_count=customer.total_orders_count or 0,
        created_at=customer.created_at.isoformat() if customer.created_at else datetime.utcnow().isoformat()
    )

@router.post("/register", response_model=CustomerAuthResponse)
async def register_customer(req: CustomerRegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if phone already registered
    phone_stmt = select(Customer).where(Customer.phone == req.phone)
    phone_res = await db.execute(phone_stmt)
    if phone_res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A customer with this mobile number is already registered. Please log in."
        )

    # Check if email already registered (if provided)
    if req.email:
        email_stmt = select(Customer).where(Customer.email == req.email)
        email_res = await db.execute(email_stmt)
        if email_res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A customer with this email address is already registered. Please log in."
            )

    # Get primary company ID
    comp_stmt = select(Company)
    comp_res = await db.execute(comp_stmt)
    company = comp_res.scalars().first()

    customer_code = await generate_unique_customer_code(db)

    new_customer = Customer(
        company_id=company.id if company else None,
        customer_code=customer_code,
        name=req.name.strip(),
        phone=req.phone.strip(),
        email=req.email.strip().lower() if req.email else None,
        hashed_password=get_password_hash(req.password),
        address_line1=req.address_line1,
        address_line2=req.address_line2,
        city=req.city or "Chennai",
        state=req.state or "Tamil Nadu",
        pincode=req.pincode or "600001",
        landmark=req.landmark,
        preferred_language=req.preferred_language or "en",
        role="CUSTOMER",
        is_active=True,
        consent_for_outbound=True,
        dnd_opt_out=False
    )
    db.add(new_customer)
    await db.commit()
    await db.refresh(new_customer)

    # Generate token
    token = create_access_token(subject=new_customer.id, role="CUSTOMER")
    return CustomerAuthResponse(
        access_token=token,
        token_type="bearer",
        customer=serialize_customer(new_customer)
    )

@router.post("/login", response_model=CustomerAuthResponse)
async def login_customer(req: CustomerLoginRequest, db: AsyncSession = Depends(get_db)):
    identifier = req.identifier.strip().lower()
    
    # Query customer by email or phone
    stmt = select(Customer).where(
        or_(
            Customer.email == identifier,
            Customer.phone == req.identifier.strip()
        )
    )
    res = await db.execute(stmt)
    customer = res.scalars().first()

    if not customer or not customer.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid mobile number/email or password."
        )

    if not verify_password(req.password, customer.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid mobile number/email or password."
        )

    if not customer.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This customer account has been deactivated. Please contact support."
        )

    token = create_access_token(subject=customer.id, role="CUSTOMER")
    return CustomerAuthResponse(
        access_token=token,
        token_type="bearer",
        customer=serialize_customer(customer)
    )

@router.get("/me", response_model=CustomerProfileResponse)
async def get_my_profile(customer: Customer = Depends(get_current_customer)):
    return serialize_customer(customer)

@router.put("/profile", response_model=CustomerProfileResponse)
async def update_my_profile(
    req: CustomerUpdateProfileRequest,
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db)
):
    update_data = req.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None:
            setattr(customer, field, val)

    await db.commit()
    await db.refresh(customer)
    return serialize_customer(customer)

