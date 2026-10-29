from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from decimal import Decimal
from datetime import datetime

class OrderItem(BaseModel):
    product_id: Optional[str] = None
    sku: str
    name: str
    quantity: int = 1
    unit_price: Decimal
    total: Decimal

class OrderCreate(BaseModel):
    customer_id: str
    items: List[OrderItem]
    total_amount: Decimal
    currency: str = "USD"
    payment_status: str = "PAID"
    payment_method: str = "CREDIT_CARD"
    shipping_address: Optional[str] = None
    delivery_notes: Optional[str] = None

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    tracking_number: Optional[str] = None
    courier_name: Optional[str] = None
    estimated_delivery: Optional[datetime] = None
    delivery_notes: Optional[str] = None

class OrderResponse(BaseModel):
    id: str
    order_number: str
    customer_id: str
    items: List[Dict[str, Any]]
    total_amount: Decimal
    currency: str
    status: str
    payment_status: str
    payment_method: str
    tracking_number: Optional[str] = None
    courier_name: Optional[str] = None
    estimated_delivery: Optional[datetime] = None
    delivery_notes: Optional[str] = None
    shipping_address: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

