import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Numeric, Integer, Boolean, DateTime, ForeignKey, JSON
from app.core.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=True)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False, index=True)
    
    # Sequential unique Order ID (e.g., ORD-2026-00001)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    
    # Customer Details snapshot at time of order
    customer_name = Column(String(255), nullable=True)
    customer_phone = Column(String(50), nullable=True)
    customer_email = Column(String(255), nullable=True)
    
    # Items: [{ product_id, sku, name, image_url, quantity, unit_price, total }]
    items = Column(JSON, default=list)
    
    # Financial Breakdown
    subtotal = Column(Numeric(10, 2), default=0.0)
    delivery_fee = Column(Numeric(10, 2), default=0.0)
    discount_amount = Column(Numeric(10, 2), default=0.0)
    coupon_code = Column(String(50), nullable=True)
    total_amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="INR")
    
    # Lifecycle Order Status:
    # ORDER_PLACED, PAYMENT_SUCCESSFUL, ORDER_CONFIRMED, PROCESSING, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, RETURNED, REFUNDED
    status = Column(String(50), default="ORDER_PLACED", index=True)
    
    # Payment Status & Details:
    # PENDING, PAID, REFUNDED, FAILED
    payment_status = Column(String(50), default="PENDING", index=True)
    payment_method = Column(String(50), default="UPI") # UPI, DEBIT_CARD, CREDIT_CARD, NET_BANKING, CASH_ON_DELIVERY
    transaction_id = Column(String(100), nullable=True)
    
    # Logistics & Fulfillment
    tracking_number = Column(String(100), nullable=True)
    courier_name = Column(String(100), default="BlueDart Express")
    estimated_delivery = Column(DateTime, nullable=True)
    delivery_notes = Column(Text, nullable=True)
    shipping_address = Column(Text, nullable=True)
    
    # AI Outbound Confirmation Calling Telemetry:
    # PENDING, INITIATED, RINGING, CONNECTED, COMPLETED, NOT_ANSWERED, FAILED, RETRY_SCHEDULED, ESCALATED
    ai_call_status = Column(String(50), default="PENDING", index=True)
    ai_call_id = Column(String(36), nullable=True)
    ai_call_summary = Column(Text, nullable=True)
    customer_confirmed = Column(Boolean, nullable=True)
    retry_count = Column(Integer, default=0)
    preferred_language = Column(String(10), default="en")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
