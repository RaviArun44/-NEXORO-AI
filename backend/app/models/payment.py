import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Numeric, DateTime, ForeignKey, JSON
from app.core.database import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False, index=True)
    
    # Sequential unique Transaction ID (e.g. TXN-2026-00001)
    transaction_id = Column(String(100), unique=True, index=True, nullable=False)
    
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="INR")
    
    # UPI, DEBIT_CARD, CREDIT_CARD, NET_BANKING, WALLET, CASH_ON_DELIVERY
    payment_method = Column(String(50), default="UPI", nullable=False)
    
    # PENDING, SUCCESS, FAILED, REFUNDED
    status = Column(String(50), default="PENDING", nullable=False)
    
    # RAZORPAY, CASHFREE, OFFLINE_COD
    gateway_name = Column(String(50), default="RAZORPAY")
    gateway_order_id = Column(String(100), nullable=True)
    gateway_payment_id = Column(String(100), nullable=True)
    gateway_signature = Column(String(255), nullable=True)
    
    receipt_number = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)
    metadata_json = Column(JSON, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

