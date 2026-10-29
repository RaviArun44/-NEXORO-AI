import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Numeric, DateTime, ForeignKey, JSON
from app.core.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=True)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    
    # Items: [{ product_id, sku, name, quantity, unit_price, total }]
    items = Column(JSON, default=list)
    total_amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="USD")
    
    status = Column(String(50), default="CONFIRMED") # PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
    payment_status = Column(String(50), default="PAID") # PENDING, PAID, REFUNDED, FAILED
    payment_method = Column(String(50), default="CREDIT_CARD")
    
    tracking_number = Column(String(100), nullable=True)
    courier_name = Column(String(100), default="FedEx Express")
    estimated_delivery = Column(DateTime, nullable=True)
    delivery_notes = Column(Text, nullable=True)
    shipping_address = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
