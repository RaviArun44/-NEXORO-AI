from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from decimal import Decimal
from datetime import datetime

class ProductBase(BaseModel):
    sku: str
    name: str
    category: str = "Electronics"
    description: Optional[str] = None
    price: Decimal
    original_price: Optional[Decimal] = None
    discount_pct: int = 0
    currency: str = "INR"
    image_url: Optional[str] = None
    rating: float = 4.5
    reviews_count: int = 120
    stock_quantity: int = 50
    in_stock: bool = True
    delivery_estimate: Optional[str] = "Delivery in 2-3 business days"
    specifications: Dict[str, Any] = {}
    is_active: bool = True

class ProductCreate(ProductBase):
    source_marketplace: Optional[str] = "AMAZON"
    source_product_id: Optional[str] = None
    supplier_cost: Optional[Decimal] = None

class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    original_price: Optional[Decimal] = None
    discount_pct: Optional[int] = None
    currency: Optional[str] = None
    image_url: Optional[str] = None
    rating: Optional[float] = None
    reviews_count: Optional[int] = None
    stock_quantity: Optional[int] = None
    in_stock: Optional[bool] = None
    delivery_estimate: Optional[str] = None
    specifications: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    source_marketplace: Optional[str] = None
    source_product_id: Optional[str] = None
    supplier_cost: Optional[Decimal] = None

class ProductResponse(ProductBase):
    id: str
    source_marketplace: Optional[str] = None
    source_product_id: Optional[str] = None
    supplier_cost: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CustomerProductResponse(ProductBase):
    """Sanitized product representation for public customer store (zero marketplace branding)"""
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class CategoryResponse(BaseModel):
    id: str
    name: str
    slug: str
    icon: str
    description: Optional[str] = None
    product_count: int = 0

    class Config:
        from_attributes = True
