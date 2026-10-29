from pydantic import BaseModel
from typing import List, Dict, Any

class DashboardKPIs(BaseModel):
    total_calls: int
    incoming_calls: int
    outgoing_calls: int
    answered_calls: int
    missed_calls: int
    active_calls: int
    avg_duration_seconds: float
    avg_latency_ms: float
    csat_score: float # 1.0 to 5.0
    handoff_rate_percent: float
    resolved_by_ai_percent: float

class LanguageDistribution(BaseModel):
    language: str
    code: str
    count: int
    percentage: float

class CallTrendPoint(BaseModel):
    time_label: str
    inbound: int
    outbound: int
    total: int

class EmployeePerformance(BaseModel):
    id: str
    name: str
    department: str
    status: str
    calls_handled: int
    transfers_accepted: int
    avg_resolution_minutes: float
    rating: float
