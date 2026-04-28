from pydantic import BaseModel, Field


class ProductInOrderBase(BaseModel):
    product_id: int
    order_id: int
    total_products_in_order: int = Field(..., ge=0)
    total_order_amount: float = Field(..., ge=0)


class ProductInOrderCreate(ProductInOrderBase):
    pass


class ProductInOrderResponse(ProductInOrderBase):
    id: int

    class Config:
        from_attributes = True
