from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field
from pydantic.mypy import from_attributes_callback

from app.schemas.category import CategoryResponse


class ProductBase(BaseModel):
    name: str = Field(..., min_length=5, max_length=150, description='Product name')
    description: Optional[str] = Field(None, description='Product description')
    price: float = Field(..., gt=0, description='Product price must be > 0')
    category_id: int = Field(..., description='Category id for product')
    image_url: Optional[str] = Field(None, description='ImageUrl for product')

class ProductCreate(ProductBase):
    pass


class ProductResponse(BaseModel):
    id: int = Field(..., description='Unique product id')
    name: str
    description: Optional[str]
    price: float
    category_id: int
    image_url: Optional[str]
    created_at: datetime
    category: CategoryResponse = Field(..., description='Category information for current product')
    
    class Config:
        from_attributes = True

class ProductListResponse(BaseModel):
    products: list[ProductResponse]
    total: int = Field(..., description='Total number of products')