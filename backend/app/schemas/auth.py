from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    login: str = Field(..., min_length=1, max_length=255)
    phone: str = Field(..., min_length=1, max_length=50)
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=1, max_length=255)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=1, max_length=255)


class AuthUserResponse(BaseModel):
    id: int
    login: str
    phone: str
    email: str

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    user: AuthUserResponse
