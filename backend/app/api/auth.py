from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest
from app.services.auth import AuthService


router = APIRouter(prefix='/api/auth', tags=['auth'])


@router.post('/register', response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    service = AuthService(db)
    return service.register(payload)


@router.post('/login', response_model=AuthResponse, status_code=status.HTTP_200_OK)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    service = AuthService(db)
    return service.login(payload)
