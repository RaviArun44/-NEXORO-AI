from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.analytics import DashboardKPIs, LanguageDistribution, CallTrendPoint, EmployeePerformance
from app.services.analytics_service import analytics_service

router = APIRouter()

@router.get("/summary", response_model=DashboardKPIs)
async def get_summary_kpis(db: AsyncSession = Depends(get_db)):
    return await analytics_service.get_dashboard_kpis(db)

@router.get("/languages", response_model=List[LanguageDistribution])
async def get_languages_chart(db: AsyncSession = Depends(get_db)):
    return await analytics_service.get_language_distribution(db)

@router.get("/trends", response_model=List[CallTrendPoint])
async def get_call_trends(db: AsyncSession = Depends(get_db)):
    return await analytics_service.get_call_trends(db)

@router.get("/employees", response_model=List[EmployeePerformance])
async def get_employees_performance(db: AsyncSession = Depends(get_db)):
    return await analytics_service.get_employee_performance(db)
