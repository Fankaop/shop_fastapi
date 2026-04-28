from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    image: str | None = Field(default=None, max_length=500)
    available_quantity: int = Field(..., ge=0)
    category_id: int
    age_id: int
    gender_id: int
    size_id: int


class ProductCreate(ProductBase):
    pass


class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True
