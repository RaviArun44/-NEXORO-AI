from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.live_calls import router as live_calls_router
from app.api.v1.calls import router as calls_router
from app.api.v1.customers import router as customers_router
from app.api.v1.products import router as products_router
from app.api.v1.orders import router as orders_router
from app.api.v1.appointments import router as appointments_router
from app.api.v1.complaints import router as complaints_router
from app.api.v1.handoffs import router as handoffs_router
from app.api.v1.knowledge import router as knowledge_router
from app.api.v1.campaigns import router as campaigns_router
from app.api.v1.employees import router as employees_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.settings import router as settings_router
from app.api.v1.ai_config import router as ai_config_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(live_calls_router, prefix="/live-calls", tags=["Live Calls & Voice Stream"])
api_router.include_router(calls_router, prefix="/calls", tags=["Call History & Recordings"])
api_router.include_router(customers_router, prefix="/customers", tags=["Customer CRM"])
api_router.include_router(products_router, prefix="/products", tags=["Products & Inventory"])
api_router.include_router(orders_router, prefix="/orders", tags=["Order Management"])
api_router.include_router(appointments_router, prefix="/appointments", tags=["Appointment Booking"])
api_router.include_router(complaints_router, prefix="/complaints", tags=["Complaints & Escalations"])
api_router.include_router(handoffs_router, prefix="/handoffs", tags=["Human Handoff Desk"])
api_router.include_router(knowledge_router, prefix="/knowledge", tags=["Company Knowledge Base"])
api_router.include_router(campaigns_router, prefix="/campaigns", tags=["Outbound Campaigns"])
api_router.include_router(employees_router, prefix="/employees", tags=["Staff Management"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics & Reports"])
api_router.include_router(settings_router, prefix="/settings", tags=["Company Settings"])
api_router.include_router(ai_config_router, prefix="/ai-config", tags=["AI Configuration"])

