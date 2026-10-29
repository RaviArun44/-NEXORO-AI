from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[UserResponse])
async def list_employees(
    department: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(User).order_by(User.full_name.asc())
    if department:
        query = query.where(User.department == department)
    if status:
        query = query.where(User.status == status)
    res = await db.execute(query)
    return res.scalars().all()

@router.put("/{user_id}/status", response_model=UserResponse)
async def update_presence_status(
    user_id: str,
    status: str, # AVAILABLE, BUSY, OFFLINE
    db: AsyncSession = Depends(get_db)
):
    if status not in ["AVAILABLE", "BUSY", "OFFLINE"]:
        raise HTTPException(status_code=400, detail="Invalid status. Allowed: AVAILABLE, BUSY, OFFLINE")

    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")

    user.status = status
    await db.commit()
    await db.refresh(user)
    return user
