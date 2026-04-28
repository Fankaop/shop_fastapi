from pydantic import BaseModel, Field


class GenderBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class GenderCreate(GenderBase):
    pass


class GenderResponse(GenderBase):
    id: int

    class Config:
        from_attributes = True
