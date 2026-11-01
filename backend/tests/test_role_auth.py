import uuid
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
async def test_customer_registration_and_login():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        uid = uuid.uuid4().hex[:6]
        # 1. Register customer with full fields
        reg_payload = {
            "full_name": "Rohan Patel",
            "username": f"rohan_{uid}",
            "email": f"rohan_{uid}@testcorp.com",
            "phone": "+91-98765-43210",
            "password": "SecurePassword@123",
            "confirm_password": "SecurePassword@123",
            "role": "CUSTOMER"
        }
        res = await ac.post("/api/v1/auth/register", json=reg_payload)
        assert res.status_code == 200, f"Registration failed: {res.text}"
        data = res.json()
        assert "access_token" in data
        assert data["user"]["username"] == f"rohan_{uid}"
        assert data["user"]["role"] == "CUSTOMER"

        # 2. Login using Username
        login_user = await ac.post("/api/v1/auth/login", json={
            "username_or_email": f"rohan_{uid}",
            "password": "SecurePassword@123",
            "role": "CUSTOMER"
        })
        assert login_user.status_code == 200
        assert login_user.json()["user"]["username"] == f"rohan_{uid}"

        # 3. Login using Email
        login_email = await ac.post("/api/v1/auth/login", json={
            "username_or_email": f"rohan_{uid}@testcorp.com",
            "password": "SecurePassword@123",
            "role": "CUSTOMER"
        })
        assert login_email.status_code == 200
        assert login_email.json()["user"]["email"] == f"rohan_{uid}@testcorp.com"

@pytest.mark.asyncio
async def test_registration_validation_rules():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Password mismatch
        bad_pw = await ac.post("/api/v1/auth/register", json={
            "full_name": "Test User",
            "username": "test_mismatch",
            "email": "mismatch@test.com",
            "phone": "+91-98765-00001",
            "password": "Password123",
            "confirm_password": "PasswordDifferent",
            "role": "CUSTOMER"
        })
        assert bad_pw.status_code == 400
        assert "do not match" in bad_pw.text

        # Invalid Phone Number (too short)
        bad_phone = await ac.post("/api/v1/auth/register", json={
            "full_name": "Test User",
            "username": "test_phone",
            "email": "phone@test.com",
            "phone": "123",
            "password": "Password123",
            "confirm_password": "Password123",
            "role": "CUSTOMER"
        })
        assert bad_phone.status_code == 400
        assert "phone number" in bad_phone.text

@pytest.mark.asyncio
async def test_role_based_login_enforcement():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        uid = uuid.uuid4().hex[:6]
        # Register a customer
        await ac.post("/api/v1/auth/register", json={
            "full_name": "Customer User",
            "username": f"regular_cust_{uid}",
            "email": f"cust_{uid}@test.com",
            "phone": "+91-98765-11111",
            "password": "Password123",
            "confirm_password": "Password123",
            "role": "CUSTOMER"
        })

        # Try to login as ADMIN with customer credentials -> Must be rejected with 403
        admin_attempt = await ac.post("/api/v1/auth/login", json={
            "username_or_email": f"regular_cust_{uid}",
            "password": "Password123",
            "role": "ADMIN"
        })
        assert admin_attempt.status_code == 403
        assert "Administrator privileges" in admin_attempt.text

        # Legitimate Admin login succeeds
        admin_login = await ac.post("/api/v1/auth/login", json={
            "username_or_email": "admin@nexora.ai",
            "password": "Admin@123",
            "role": "ADMIN"
        })
        assert admin_login.status_code == 200
        assert admin_login.json()["user"]["role"] == "ADMIN"

@pytest.mark.asyncio
async def test_forgot_and_reset_password_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        uid = uuid.uuid4().hex[:6]
        # 1. Register user
        await ac.post("/api/v1/auth/register", json={
            "full_name": "Reset Test User",
            "username": f"reset_user_{uid}",
            "email": f"reset_{uid}@test.com",
            "phone": "+91-98765-22222",
            "password": "InitialPassword@123",
            "confirm_password": "InitialPassword@123",
            "role": "CUSTOMER"
        })

        # 2. Request forgot password
        forgot_res = await ac.post("/api/v1/auth/forgot-password", json={
            "email_or_username": f"reset_user_{uid}"
        })
        assert forgot_res.status_code == 200
        reset_code = forgot_res.json()["reset_code"]

        # 3. Reset password
        reset_res = await ac.post("/api/v1/auth/reset-password", json={
            "email_or_username": f"reset_user_{uid}",
            "new_password": "BrandNewPassword@456",
            "confirm_new_password": "BrandNewPassword@456",
            "reset_code": reset_code
        })
        assert reset_res.status_code == 200

        # 4. Login with new password
        login_new = await ac.post("/api/v1/auth/login", json={
            "username_or_email": f"reset_user_{uid}",
            "password": "BrandNewPassword@456",
            "role": "CUSTOMER"
        })
        assert login_new.status_code == 200
