from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime

class ProductBase(BaseModel):
    sku: str
    name: str
    category: str = "Electronics"
    description: Optional[str] = None
    price: Decimal
    currency: str = "USD"
    stock_quantity: int = 0
    reorder_level: int = 5
    is_active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    currency: Optional[str] = None
    stock_quantity: Optional[int] = None
    reorder_level: Optional[int] = None
    is_active: Optional[bool] = None

class ProductResponse(ProductBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

