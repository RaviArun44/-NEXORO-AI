from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.models.call import Call
from app.schemas.call import CallResponse
from app.services.call_queue_manager import call_queue_manager

router = APIRouter()

@router.get("", response_model=List[CallResponse])
async def list_calls(
    direction: Optional[str] = None,
    status: Optional[str] = None,
    language: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    query = select(Call).order_by(desc(Call.created_at))
    if direction:
        query = query.where(Call.direction == direction)
    if status:
        query = query.where(Call.status == status)
    if language:
        query = query.where(Call.language == language)
    if search:
        query = query.where(Call.caller_number.contains(search) | Call.summary.contains(search))
        
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    calls = result.scalars().all()
    return calls

@router.get("/queue-metrics")
async def get_queue_telemetry():
    """
    Returns real-time queue size, concurrent active calls, utilization %, and wait time.
    """
    return call_queue_manager.get_queue_metrics()

@router.post("/simulate-load")
async def run_high_volume_load_simulation(
    num_calls: int = Query(default=250, ge=10, le=5000),
    turn_duration_ms: int = Query(default=15, ge=1, le=1000)
):
    """
    Simulates high-volume concurrent incoming calls for Khaira Company.
    Benchmarks queue processing, semaphore throttling, and throughput.
    """
    return await call_queue_manager.simulate_concurrent_load(
        num_calls=num_calls,
        turn_duration_ms=turn_duration_ms
    )

@router.get("/{call_id}", response_model=CallResponse)
async def get_call(call_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Call).where(Call.id == call_id)
    result = await db.execute(stmt)
    call = result.scalars().first()
    if not call:
        raise HTTPException(status_code=404, detail="Call record not found")
    return call
