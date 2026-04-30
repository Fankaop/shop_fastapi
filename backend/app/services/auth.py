from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.password import Password
from app.models.user import User
from app.schemas.auth import AuthResponse, AuthUserResponse, LoginRequest, RegisterRequest


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def register(self, payload: RegisterRequest) -> AuthResponse:
        existing_user = self.db.query(User).filter(User.email == payload.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='User with this email already exists',
            )

        user = User(login=payload.login, phone=payload.phone, email=payload.email)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        password_row = Password(password=payload.password, user_id=user.id)
        self.db.add(password_row)
        self.db.commit()

        return AuthResponse(user=AuthUserResponse.model_validate(user))

    def login(self, payload: LoginRequest) -> AuthResponse:
        user = self.db.query(User).filter(User.email == payload.email).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

        password_row = (
            self.db.query(Password)
            .filter(Password.user_id == user.id)
            .order_by(Password.id.desc())
            .first()
        )
        if password_row is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

        if str(password_row.password) != payload.password:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

        return AuthResponse(user=AuthUserResponse.model_validate(user))
