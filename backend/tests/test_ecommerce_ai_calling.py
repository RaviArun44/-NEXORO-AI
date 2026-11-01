import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_customer_registration_and_id_generation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        phone = "+91-99999-11111"
        res = await ac.post("/api/v1/customer/auth/register", json={
            "name": "Kavitha Sundaram",
            "phone": phone,
            "email": "kavitha.sundaram@test.example",
            "password": "Password@123",
            "address_line1": "Flat 4A, Orchid Residency, Velachery",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "pincode": "600042",
            "preferred_language": "ta"
        })
        
        # If already exists from prior run, login instead
        if res.status_code == 400:
            login_res = await ac.post("/api/v1/customer/auth/login", json={
                "identifier": phone,
                "password": "Password@123"
            })
            assert login_res.status_code == 200
            data = login_res.json()
        else:
            assert res.status_code == 200
            data = res.json()

        assert "access_token" in data
        cust = data["customer"]
        assert cust["customer_code"].startswith("CUST-2026-")
        assert cust["preferred_language"] == "ta"

@pytest.mark.asyncio
async def test_sanitized_multi_marketplace_catalog():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Check categories
        cat_res = await ac.get("/api/v1/products/categories")
        assert cat_res.status_code == 200
        cats = cat_res.json()
        assert len(cats) >= 16

        # Check public catalog (Ensure zero third-party marketplace leakage)
        prod_res = await ac.get("/api/v1/products/public")
        assert prod_res.status_code == 200
        prods = prod_res.json()
        assert len(prods) > 0
        for p in prods:
            assert "source_marketplace" not in p
            assert "source_product_id" not in p
            assert "supplier_cost" not in p
            assert p["currency"] in ["INR", "USD"]

@pytest.mark.asyncio
async def test_shopping_cart_and_coupon():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Customer Login
        login_res = await ac.post("/api/v1/customer/auth/login", json={
            "identifier": "+91-98401-23456",
            "password": "Customer@123"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Clear cart
        await ac.delete("/api/v1/cart/clear", headers=headers)

        # Get a product
        prod_res = await ac.get("/api/v1/products/public")
        prods = prod_res.json()
        prod = prods[0]

        # Add to cart
        add_res = await ac.post("/api/v1/cart/add", json={
            "product_id": prod["id"],
            "quantity": 2
        }, headers=headers)
        assert add_res.status_code == 200
        cart = add_res.json()
        assert cart["items_count"] == 2
        assert cart["subtotal"] > 0

        # Apply Coupon WELCOME10
        coupon_res = await ac.post("/api/v1/cart/apply-coupon", json={
            "coupon_code": "WELCOME10"
        }, headers=headers)
        assert coupon_res.status_code == 200
        cart_after_coupon = coupon_res.json()
        assert cart_after_coupon["coupon_code"] == "WELCOME10"
        assert cart_after_coupon["discount"] > 0

@pytest.mark.asyncio
async def test_checkout_and_ai_confirmation_call():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Customer Login (Ananya Sharma - Tamil)
        login_res = await ac.post("/api/v1/customer/auth/login", json={
            "identifier": "+91-98401-23456",
            "password": "Customer@123"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Ensure item in cart
        prod_res = await ac.get("/api/v1/products/public")
        prod = prod_res.json()[0]
        await ac.post("/api/v1/cart/add", json={
            "product_id": prod["id"],
            "quantity": 1
        }, headers=headers)

        # Checkout with Cash on Delivery to trigger AI call immediately
        checkout_res = await ac.post("/api/v1/orders/checkout", json={
            "shipping_address": "12 Anna Salai, T. Nagar",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "pincode": "600017",
            "payment_method": "CASH_ON_DELIVERY",
            "preferred_language": "ta"
        }, headers=headers)
        assert checkout_res.status_code == 200
        data = checkout_res.json()
        assert data["success"] is True
        order_info = data["order"]
        assert order_info["order_number"].startswith("ORD-2026-")
        assert order_info["status"] == "ORDER_CONFIRMED"
        assert order_info["preferred_language"] == "ta"

        # AI Call must be triggered
        ai_call = data["ai_call"]
        assert ai_call is not None
        assert ai_call["status"] == "COMPLETED"
        assert ai_call["language"] == "ta"
        assert ai_call["confirmation_status"] == "CONFIRMED"
        assert len(ai_call["transcript"]) >= 2
