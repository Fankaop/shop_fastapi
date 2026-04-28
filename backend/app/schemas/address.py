from pydantic import BaseModel, Field


class AddressBase(BaseModel):
    address: str = Field(..., min_length=1, max_length=500)
    user_id: int


class AddressCreate(AddressBase):
    pass


class AddressResponse(AddressBase):
    id: int

    class Config:
        from_attributes = True
