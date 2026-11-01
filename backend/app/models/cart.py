import uuid
from datetime import datetime
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, JSON
from app.core.database import Base

class Cart(Base):
    __tablename__ = "carts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String(36), ForeignKey("customers.id"), unique=True, index=True, nullable=False)
    
    # Items: [{ product_id, sku, name, image_url, price, quantity, total }]
    items = Column(JSON, default=list)
    
    subtotal = Column(Numeric(10, 2), default=0.0)
    delivery_charge = Column(Numeric(10, 2), default=0.0)
    discount = Column(Numeric(10, 2), default=0.0)
    coupon_code = Column(String(50), nullable=True)
    final_amount = Column(Numeric(10, 2), default=0.0)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
