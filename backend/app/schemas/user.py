from pydantic import BaseModel, Field


class UserBase(BaseModel):
    login: str = Field(..., min_length=1, max_length=255)
    phone: str = Field(..., min_length=1, max_length=50)
    email: str = Field(..., min_length=3, max_length=255)


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True
