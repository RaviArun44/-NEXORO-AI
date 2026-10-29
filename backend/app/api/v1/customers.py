from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.models.customer import Customer
from app.models.call import Call
from app.models.order import Order
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse

router = APIRouter()

@router.get("", response_model=List[CustomerResponse])
async def list_customers(
    search: Optional[str] = None,
    language: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    query = select(Customer).order_by(desc(Customer.updated_at))
    if search:
        query = query.where(Customer.name.contains(search) | Customer.phone.contains(search))
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

    customer = Customer(**req.model_dump())
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer

@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Customer).where(Customer.id == customer_id)
    res = await db.execute(stmt)
    customer = res.scalars().first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: str, req: CustomerUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Customer).where(Customer.id == customer_id)
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
    stmt = select(Customer).where(Customer.id == customer_id)
    res = await db.execute(stmt)
    customer = res.scalars().first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    await db.delete(customer)
    await db.commit()
    return {"status": "DELETED", "customer_id": customer_id}

