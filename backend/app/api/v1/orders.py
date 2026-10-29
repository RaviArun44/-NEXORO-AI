import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.order import Order
from app.models.customer import Customer
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse

router = APIRouter()

@router.get("", response_model=List[OrderResponse])
async def list_orders(
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    customer_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    query = select(Order).order_by(desc(Order.created_at))
    if status:
        query = query.where(Order.status == status)
    if payment_status:
        query = query.where(Order.payment_status == payment_status)
    if customer_id:
        query = query.where(Order.customer_id == customer_id)
    query = query.offset(offset).limit(limit)
    res = await db.execute(query)
    return res.scalars().all()

@router.post("", response_model=OrderResponse)
async def create_order(req: OrderCreate, db: AsyncSession = Depends(get_db)):
    order_num = f"ORD-{random.randint(100000, 999999)}"
    
    order = Order(
        customer_id=req.customer_id,
        order_number=order_num,
        items=[item.model_dump() for item in req.items],
        total_amount=req.total_amount,
        currency=req.currency,
        status="CONFIRMED",
        payment_status=req.payment_status,
        payment_method=req.payment_method,
        tracking_number=f"TRK-{random.randint(10000000, 99999999)}",
        courier_name="FedEx Express",
        estimated_delivery=datetime.utcnow() + timedelta(days=3),
        shipping_address=req.shipping_address,
        delivery_notes=req.delivery_notes
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Order).where(Order.id == order_id)
    res = await db.execute(stmt)
    order = res.scalars().first()
    if not order:
        # Also try lookup by order_number
        stmt2 = select(Order).where(Order.order_number == order_id)
        res2 = await db.execute(stmt2)
        order = res2.scalars().first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(order_id: str, req: OrderUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Order).where(Order.id == order_id)
    res = await db.execute(stmt)
    order = res.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    update_data = req.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(order, field, val)

    await db.commit()
    await db.refresh(order)
    return order
