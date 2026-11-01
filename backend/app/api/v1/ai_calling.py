from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, or_
from datetime import datetime

from app.core.database import get_db
from app.models.call import Call
from app.models.order import Order
from app.models.customer import Customer
from app.services.ai_calling_agent import ai_calling_agent

router = APIRouter()

class AICallLogItem(BaseModel):
    id: str
    order_id: Optional[str] = None
    order_number: Optional[str] = None
    customer_id: Optional[str] = None
    customer_code: Optional[str] = None
    customer_name: Optional[str] = None
    phone_number: str
    preferred_language: str
    call_initiation_time: str
    duration_seconds: int
    call_status: str
    confirmation_status: Optional[str] = None
    summary: Optional[str] = None
    transcript: List[Dict[str, Any]] = []
    recording_url: Optional[str] = None
    retry_count: int = 0

class AICallingStats(BaseModel):
    total_calls: int
    completed_calls: int
    confirmed_orders: int
    cancelled_orders: int
    unanswered_calls: int
    failed_calls: int
    avg_duration_seconds: float
    language_distribution: Dict[str, int]

@router.get("/logs", response_model=List[AICallLogItem])
async def list_ai_call_logs(
    status: Optional[str] = None,
    language: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    query = select(Call).where(
        or_(
            Call.call_type == "OUTBOUND_ORDER_CONFIRMATION",
            Call.intent == "Order Confirmation"
        )
    ).order_by(desc(Call.start_time))

    if status and status.upper() != "ALL":
        query = query.where(Call.status == status.upper())
    if language and language.lower() != "all":
        query = query.where(Call.language == language.lower())
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.where(
            or_(
                Call.caller_number.contains(search_pattern),
                Call.receiver_number.contains(search_pattern),
                Call.summary.contains(search_pattern)
            )
        )

    query = query.offset(offset).limit(limit)
    res = await db.execute(query)
    calls = res.scalars().all()

    items = []
    for call in calls:
        # Fetch associated customer and order details if present
        cust_code = None
        cust_name = None
        ord_number = None

        if call.customer_id:
            c_stmt = select(Customer).where(Customer.id == call.customer_id)
            c_res = await db.execute(c_stmt)
            cust = c_res.scalars().first()
            if cust:
                cust_code = cust.customer_code
                cust_name = cust.name

        if call.order_id:
            o_stmt = select(Order).where(Order.id == call.order_id)
            o_res = await db.execute(o_stmt)
            ord_obj = o_res.scalars().first()
            if ord_obj:
                ord_number = ord_obj.order_number

        items.append(
            AICallLogItem(
                id=call.id,
                order_id=call.order_id,
                order_number=ord_number or ("ORD-REF" if call.order_id else None),
                customer_id=call.customer_id,
                customer_code=cust_code or ("CUST-GUEST"),
                customer_name=cust_name or "Valued Customer",
                phone_number=call.receiver_number,
                preferred_language=call.language,
                call_initiation_time=call.start_time.isoformat() if call.start_time else datetime.utcnow().isoformat(),
                duration_seconds=call.duration_seconds or 0,
                call_status=call.status,
                confirmation_status=call.confirmation_status,
                summary=call.summary,
                transcript=call.transcript or [],
                recording_url=call.recording_url,
                retry_count=call.retry_count or 0
            )
        )

    return items

@router.post("/retry/{call_id}")
async def retry_ai_call(call_id: str, db: AsyncSession = Depends(get_db)):
    """
    Retries an outbound order confirmation call for an eligible call record.
    """
    stmt = select(Call).where(Call.id == call_id)
    res = await db.execute(stmt)
    call = res.scalars().first()
    if not call:
        raise HTTPException(status_code=404, detail="Call record not found")

    if not call.order_id or not call.customer_id:
        raise HTTPException(status_code=400, detail="Cannot retry call without linked order and customer")

    o_stmt = select(Order).where(Order.id == call.order_id)
    o_res = await db.execute(o_stmt)
    order = o_res.scalars().first()

    c_stmt = select(Customer).where(Customer.id == call.customer_id)
    c_res = await db.execute(c_stmt)
    customer = c_res.scalars().first()

    if not order or not customer:
        raise HTTPException(status_code=404, detail="Associated customer or order not found")

    call.retry_count = (call.retry_count or 0) + 1
    call_result = await ai_calling_agent.initiate_order_confirmation_call(
        order=order,
        customer=customer,
        db=db,
        simulate_outcome="CONFIRMED"
    )
    return {
        "status": "RETRY_TRIGGERED",
        "message": f"Retry #{call.retry_count} triggered for Order {order.order_number}",
        "call_result": call_result
    }

@router.get("/stats", response_model=AICallingStats)
async def get_ai_calling_stats(db: AsyncSession = Depends(get_db)):
    stmt = select(Call).where(
        or_(
            Call.call_type == "OUTBOUND_ORDER_CONFIRMATION",
            Call.intent == "Order Confirmation"
        )
    )
    res = await db.execute(stmt)
    calls = res.scalars().all()

    total = len(calls)
    completed = sum(1 for c in calls if c.status == "COMPLETED")
    confirmed = sum(1 for c in calls if c.confirmation_status == "CONFIRMED")
    cancelled = sum(1 for c in calls if c.confirmation_status == "CANCEL_REQUESTED")
    unanswered = sum(1 for c in calls if c.status == "NOT_ANSWERED")
    failed = sum(1 for c in calls if c.status in ["FAILED", "RETRY_SCHEDULED"])
    avg_dur = sum(c.duration_seconds or 0 for c in calls) / max(1, total)

    lang_dist: Dict[str, int] = {"en": 0, "ta": 0, "te": 0, "ml": 0, "kn": 0}
    for c in calls:
        l = (c.language or "en").lower()
        lang_dist[l] = lang_dist.get(l, 0) + 1

    return AICallingStats(
        total_calls=total,
        completed_calls=completed,
        confirmed_orders=confirmed,
        cancelled_orders=cancelled,
        unanswered_calls=unanswered,
        failed_calls=failed,
        avg_duration_seconds=round(avg_dur, 1),
        language_distribution=lang_dist
    )
