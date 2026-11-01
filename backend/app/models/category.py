import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime
from app.core.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, index=True, nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    icon = Column(String(50), default="Package")
    description = Column(Text, nullable=True)
    product_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
