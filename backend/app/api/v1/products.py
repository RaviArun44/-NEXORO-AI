from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter()

@router.get("", response_model=List[ProductResponse])
async def list_products(
    search: Optional[str] = None,
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    query = select(Product).order_by(Product.name.asc())
    if search:
        query = query.where(Product.name.contains(search) | Product.sku.contains(search))
    if category:
        query = query.where(Product.category == category)
    if is_active is not None:
        query = query.where(Product.is_active == is_active)
    query = query.offset(offset).limit(limit)
    res = await db.execute(query)
    return res.scalars().all()

@router.post("", response_model=ProductResponse)
async def create_product(req: ProductCreate, db: AsyncSession = Depends(get_db)):
    stmt = select(Product).where(Product.sku == req.sku)
    res = await db.execute(stmt)
    if res.scalars().first():
        raise HTTPException(status_code=400, detail="Product SKU already exists")

    prod = Product(**req.model_dump())
    db.add(prod)
    await db.commit()
    await db.refresh(prod)
    return prod

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Product).where(Product.id == product_id)
    res = await db.execute(stmt)
    prod = res.scalars().first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    return prod

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, req: ProductUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Product).where(Product.id == product_id)
    res = await db.execute(stmt)
    prod = res.scalars().first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = req.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(prod, field, val)

    await db.commit()
    await db.refresh(prod)
    return prod

@router.delete("/{product_id}")
async def delete_product(product_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Product).where(Product.id == product_id)
    res = await db.execute(stmt)
    prod = res.scalars().first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    await db.delete(prod)
    await db.commit()
    return {"status": "DELETED", "product_id": product_id}
