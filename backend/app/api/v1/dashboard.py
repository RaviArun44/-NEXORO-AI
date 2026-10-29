from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.analytics import DashboardKPIs
from app.services.analytics_service import analytics_service
from app.services.telephony_adapter import telephony_adapter

router = APIRouter()

@router.get("/kpis", response_model=DashboardKPIs)
async def get_kpis(db: AsyncSession = Depends(get_db)):
    data = await analytics_service.get_dashboard_kpis(db)
    return data

@router.get("/telephony-status")
async def get_telephony_status():
    return telephony_adapter.get_gateway_status()
