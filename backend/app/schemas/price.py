from datetime import datetime

from pydantic import BaseModel, Field


class PriceBase(BaseModel):
    price: float = Field(..., gt=0)
    product_id: int


class PriceCreate(PriceBase):
    pass


class PriceResponse(PriceBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
