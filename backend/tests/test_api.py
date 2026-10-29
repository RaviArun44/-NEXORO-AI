import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import engine, Base
from app.seed import seed_initial_data

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_initial_data()

@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["service"] == "NEXORA AI"
        assert "ta" in data["supported_languages"]

@pytest.mark.asyncio
async def test_auth_login():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/v1/auth/login", json={
            "email": "admin@nexora.ai",
            "password": "Admin@123"
        })
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["user"]["role"] == "ADMIN"

@pytest.mark.asyncio
async def test_dashboard_kpis():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/dashboard/kpis")
        assert res.status_code == 200
        data = res.json()
        assert data["total_calls"] >= 3
        assert "avg_latency_ms" in data

@pytest.mark.asyncio
async def test_live_call_cycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Start Call
        start_res = await ac.post("/api/v1/live-calls/start?caller_number=+1-800-TEST-99&language=en")
        assert start_res.status_code == 200
        start_data = start_res.json()
        call_id = start_data["call_id"]
        assert call_id is not None
        assert "greeting_text" in start_data

        # Turn: Ask about product
        turn_res = await ac.post(f"/api/v1/live-calls/turn?call_id={call_id}&user_text=What is the price of NEXORA Pro AI Voice Gateway?")
        assert turn_res.status_code == 200
        turn_data = turn_res.json()
        assert "899" in turn_data["reply_text"]
        assert turn_data["grounded"] is True

        # End Call
        end_res = await ac.post(f"/api/v1/live-calls/end?call_id={call_id}&outcome=RESOLVED_BY_AI")
        assert end_res.status_code == 200
        assert end_res.json()["status"] == "COMPLETED"

