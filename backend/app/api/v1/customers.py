from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, or_

from app.core.database import get_db
from app.models.customer import Customer
from app.models.order import Order
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.schemas.order import OrderResponse

router = APIRouter()

async def generate_customer_code(db: AsyncSession) -> str:
    count_stmt = select(func.count(Customer.id))
    res = await db.execute(count_stmt)
    total_count = res.scalar() or 0
    candidate = f"CUST-2026-{total_count + 1:05d}"
    while True:
        exists_stmt = select(Customer).where(Customer.customer_code == candidate)
        exists_res = await db.execute(exists_stmt)
        if not exists_res.scalars().first():
            return candidate
        total_count += 1
        candidate = f"CUST-2026-{total_count + 1:05d}"

@router.get("", response_model=List[CustomerResponse])
async def list_customers(
    search: Optional[str] = None,
    language: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    query = select(Customer).order_by(desc(Customer.created_at))
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.where(
            or_(
                Customer.name.ilike(search_pattern),
                Customer.phone.ilike(search_pattern),
                Customer.email.ilike(search_pattern),
                Customer.customer_code.ilike(search_pattern)
            )
        )
    if language:
        query = query.where(Customer.preferred_language == language)
    query = query.offset(offset).limit(limit)
    res = await db.execute(query)
    return res.scalars().all()

@router.post("", response_model=CustomerResponse)
async def create_customer(req: CustomerCreate, db: AsyncSession = Depends(get_db)):
    # Check if phone already registered
    stmt = select(Customer).where(Customer.phone == req.phone)
    res = await db.execute(stmt)
    if res.scalars().first():
        raise HTTPException(status_code=400, detail="Customer with this phone number already exists")

    customer_code = req.customer_code or await generate_customer_code(db)
    customer_data = req.model_dump()
    customer_data["customer_code"] = customer_code

    customer = Customer(**customer_data)
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer

@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Customer).where(
        or_(
            Customer.id == customer_id,
            Customer.customer_code == customer_id
        )
    )
    res = await db.execute(stmt)
    customer = res.scalars().first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.get("/{customer_id}/orders", response_model=List[OrderResponse])
async def get_customer_orders(customer_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Order).where(Order.customer_id == customer_id).order_by(desc(Order.created_at))
    res = await db.execute(stmt)
    return res.scalars().all()

@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: str, req: CustomerUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Customer).where(
        or_(
            Customer.id == customer_id,
            Customer.customer_code == customer_id
        )
    )
    res = await db.execute(stmt)
    customer = res.scalars().first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    update_data = req.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(customer, field, val)

    await db.commit()
    await db.refresh(customer)
    return customer

@router.delete("/{customer_id}")
async def delete_customer(customer_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Customer).where(
        or_(
            Customer.id == customer_id,
            Customer.customer_code == customer_id
        )
    )
    res = await db.execute(stmt)
    customer = res.scalars().first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    await db.delete(customer)
    await db.commit()
    return {"status": "DELETED", "customer_id": customer_id}
