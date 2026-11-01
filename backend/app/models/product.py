import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Numeric, Integer, Float, Boolean, DateTime, ForeignKey, JSON
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=True)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), index=True, nullable=False)
    category = Column(String(100), default="Electronics", index=True)
    description = Column(Text, nullable=True)
    
    # Pricing & Currency (INR default for Indian e-commerce platform)
    price = Column(Numeric(10, 2), nullable=False) # Selling price
    original_price = Column(Numeric(10, 2), nullable=True) # MRP
    discount_pct = Column(Integer, default=0)
    currency = Column(String(10), default="INR")
    
    # Visuals & Social Proof
    image_url = Column(String(500), nullable=True)
    rating = Column(Float, default=4.5)
    reviews_count = Column(Integer, default=120)
    
    # Inventory & Fulfillment
    stock_quantity = Column(Integer, default=50)
    in_stock = Column(Boolean, default=True)
    reorder_level = Column(Integer, default=5)
    is_active = Column(Boolean, default=True)
    delivery_estimate = Column(String(100), default="Delivery in 2-3 business days")
    
    # Rich Technical & Product Specifications
    specifications = Column(JSON, default=dict)
    
    # Internal multi-marketplace source tracking (NEVER exposed to customer)
    source_marketplace = Column(String(50), default="AMAZON") # AMAZON, FLIPKART, MEESHO, DIRECT
    source_product_id = Column(String(100), nullable=True)
    supplier_cost = Column(Numeric(10, 2), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
