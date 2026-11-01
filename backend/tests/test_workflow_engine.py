import pytest
import pytest_asyncio
from app.core.database import engine, Base, AsyncSessionLocal
from app.seed import seed_initial_data
from app.services.workflow_engine import workflow_engine
from app.models.customer import Customer
from sqlalchemy import select

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_initial_data()

@pytest.mark.asyncio
async def test_order_status_workflow():
    async with AsyncSessionLocal() as session:
        # Test English order tracking
        res_en = await workflow_engine.execute(
            db=session,
            user_text="Where is my order ORD-849201 right now?",
            language="en",
            session_id="test_sess_order"
        )
        assert res_en is not None
        assert res_en.handled is True
        assert res_en.intent == "ORDER_STATUS"
        assert "ORD-849201" in res_en.reply_text
        assert "SHIPPED" in res_en.reply_text

        # Test Tamil order tracking
        res_ta = await workflow_engine.execute(
            db=session,
            user_text="என் ஆர்டர் ORD-739120 எங்கே உள்ளது?",
            language="ta",
            session_id="test_sess_order_ta"
        )
        assert res_ta is not None
        assert res_ta.handled is True
        assert "ORD-739120" in res_ta.reply_text
        assert "PROCESSING" in res_ta.reply_text

@pytest.mark.asyncio
async def test_complaint_registration_workflow():
    async with AsyncSessionLocal() as session:
        cust = (await session.execute(select(Customer).limit(1))).scalars().first()
        res = await workflow_engine.execute(
            db=session,
            user_text="I have a serious complaint, the device arrived damaged and broken",
            language="en",
            session_id="test_sess_complaint",
            customer=cust
        )
        assert res is not None
        assert res.handled is True
        assert res.intent == "COMPLAINT_REGISTRATION"
        assert "ticket" in res.reply_text.lower()
        assert "TKT-" in res.reply_text

@pytest.mark.asyncio
async def test_appointment_booking_workflow():
    async with AsyncSessionLocal() as session:
        cust = (await session.execute(select(Customer).limit(1))).scalars().first()
        res = await workflow_engine.execute(
            db=session,
            user_text="I want to schedule an appointment for a demo session tomorrow",
            language="en",
            session_id="test_sess_appt",
            customer=cust
        )
        assert res is not None
        assert res.handled is True
        assert res.intent == "APPOINTMENT_INQUIRY"
        assert "APT-" in res.reply_text

@pytest.mark.asyncio
async def test_urgent_emergency_escalation():
    async with AsyncSessionLocal() as session:
        res = await workflow_engine.execute(
            db=session,
            user_text="This is an urgent production emergency, our entire enterprise system is down!",
            language="en",
            session_id="test_sess_urgent"
        )
        assert res is not None
        assert res.handled is True
        assert res.intent == "URGENT_ESCALATION"
        assert "URG-" in res.reply_text or "escalation" in res.reply_text.lower()

@pytest.mark.asyncio
async def test_call_termination_wrap_up():
    async with AsyncSessionLocal() as session:
        res = await workflow_engine.execute(
            db=session,
            user_text="Thank you so much for your help, goodbye!",
            language="en",
            session_id="test_sess_term"
        )
        assert res is not None
        assert res.handled is True
        assert res.intent == "CALL_TERMINATION"
        assert res.is_terminal is True
        assert "Khaira Company" in res.reply_text

