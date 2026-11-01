from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from decimal import Decimal
from datetime import datetime

class OrderItem(BaseModel):
    product_id: Optional[str] = None
    sku: str
    name: str
    image_url: Optional[str] = None
    quantity: int = 1
    unit_price: Decimal
    total: Decimal

class CheckoutRequest(BaseModel):
    shipping_address: str
    city: Optional[str] = "Chennai"
    state: Optional[str] = "Tamil Nadu"
    pincode: Optional[str] = "600001"
    payment_method: str = "UPI" # UPI, DEBIT_CARD, CREDIT_CARD, NET_BANKING, CASH_ON_DELIVERY
    preferred_language: Optional[str] = "en"
    delivery_notes: Optional[str] = None

class OrderCreate(BaseModel):
    customer_id: str
    items: List[OrderItem]
    subtotal: Optional[Decimal] = Decimal("0.00")
    delivery_fee: Optional[Decimal] = Decimal("0.00")
    discount_amount: Optional[Decimal] = Decimal("0.00")
    coupon_code: Optional[str] = None
    total_amount: Decimal
    currency: str = "INR"
    payment_status: str = "PENDING"
    payment_method: str = "UPI"
    shipping_address: Optional[str] = None
    delivery_notes: Optional[str] = None
    preferred_language: Optional[str] = "en"

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    tracking_number: Optional[str] = None
    courier_name: Optional[str] = None
    estimated_delivery: Optional[datetime] = None
    delivery_notes: Optional[str] = None
    ai_call_status: Optional[str] = None
    customer_confirmed: Optional[bool] = None

class OrderResponse(BaseModel):
    id: str
    order_number: str
    customer_id: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    items: List[Dict[str, Any]]
    subtotal: Optional[Decimal] = None
    delivery_fee: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None
    coupon_code: Optional[str] = None
    total_amount: Decimal
    currency: str = "INR"
    status: str
    payment_status: str
    payment_method: str
    transaction_id: Optional[str] = None
    tracking_number: Optional[str] = None
    courier_name: Optional[str] = None
    estimated_delivery: Optional[datetime] = None
    delivery_notes: Optional[str] = None
    shipping_address: Optional[str] = None
    ai_call_status: Optional[str] = "PENDING"
    ai_call_id: Optional[str] = None
    ai_call_summary: Optional[str] = None
    customer_confirmed: Optional[bool] = None
    preferred_language: Optional[str] = "en"
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
