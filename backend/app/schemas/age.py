from pydantic import BaseModel, Field


class AgeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class AgeCreate(AgeBase):
    pass


class AgeResponse(AgeBase):
    id: int

    class Config:
        from_attributes = True
