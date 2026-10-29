from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.company import Company
from app.schemas.company import CompanyResponse, CompanyUpdate

router = APIRouter()

@router.get("", response_model=CompanyResponse)
async def get_company_settings(db: AsyncSession = Depends(get_db)):
    stmt = select(Company)
    res = await db.execute(stmt)
    comp = res.scalars().first()
    if not comp:
        # Create default company
        comp = Company()
        db.add(comp)
        await db.commit()
        await db.refresh(comp)
    return comp

@router.put("", response_model=CompanyResponse)
async def update_company_settings(req: CompanyUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Company)
    res = await db.execute(stmt)
    comp = res.scalars().first()
    if not comp:
        comp = Company()
        db.add(comp)

    update_data = req.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(comp, field, val)

    await db.commit()
    await db.refresh(comp)
    return comp

