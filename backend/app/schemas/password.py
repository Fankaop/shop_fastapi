from datetime import datetime

from pydantic import BaseModel, Field


class PasswordBase(BaseModel):
    password: str = Field(..., min_length=1, max_length=255)
    user_id: int


class PasswordCreate(PasswordBase):
    pass


class PasswordResponse(PasswordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
