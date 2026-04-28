from pydantic import BaseModel, Field


class SizeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class SizeCreate(SizeBase):
    pass


class SizeResponse(SizeBase):
    id: int

    class Config:
        from_attributes = True
