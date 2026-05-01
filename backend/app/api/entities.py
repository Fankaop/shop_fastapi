from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Age, Address, Category, Gender, Order, Password, Price, Product, ProductInOrder, Size, User
from app.repository.crud import CRUDRepository
from app.schemas.address import AddressCreate, AddressResponse
from app.schemas.age import AgeCreate, AgeResponse
from app.schemas.category import CategoryCreate, CategoryResponse
from app.schemas.gender import GenderCreate, GenderResponse
from app.schemas.order import OrderCreate, OrderResponse
from app.schemas.password import PasswordCreate, PasswordResponse
from app.schemas.price import PriceCreate, PriceResponse
from app.schemas.product import ProductCreate, ProductResponse
from app.schemas.product_in_order import ProductInOrderCreate, ProductInOrderResponse
from app.schemas.size import SizeCreate, SizeResponse
from app.schemas.user import UserCreate, UserResponse
from app.services.crud import CRUDService


router = APIRouter(prefix='/api/entities', tags=['entities'])


def _register_crud(entity: str, model, create_schema, response_schema):
    @router.get(f'/{entity}', response_model=list[response_schema], status_code=status.HTTP_200_OK)
    def list_items(db: Session = Depends(get_db)):
        service = CRUDService(CRUDRepository(db, model), model.__name__)
        return service.get_all()

    @router.get(f'/{entity}' + '/{item_id}', response_model=response_schema, status_code=status.HTTP_200_OK)
    def get_item(item_id: int, db: Session = Depends(get_db)):
        service = CRUDService(CRUDRepository(db, model), model.__name__)
        return service.get_by_id(item_id)

    @router.post(f'/{entity}', response_model=response_schema, status_code=status.HTTP_201_CREATED)
    def create_item(payload: create_schema, db: Session = Depends(get_db)):
        service = CRUDService(CRUDRepository(db, model), model.__name__)
        return service.create(payload)

    @router.delete(f'/{entity}' + '/{item_id}', response_model=response_schema, status_code=status.HTTP_200_OK)
    def delete_item(item_id: int, db: Session = Depends(get_db)):
        service = CRUDService(CRUDRepository(db, model), model.__name__)
        return service.delete(item_id)


_register_crud('ages', Age, AgeCreate, AgeResponse)
_register_crud('genders', Gender, GenderCreate, GenderResponse)
_register_crud('categories', Category, CategoryCreate, CategoryResponse)
_register_crud('sizes', Size, SizeCreate, SizeResponse)
_register_crud('products', Product, ProductCreate, ProductResponse)
_register_crud('prices', Price, PriceCreate, PriceResponse)
_register_crud('orders', Order, OrderCreate, OrderResponse)
_register_crud('products-in-orders', ProductInOrder, ProductInOrderCreate, ProductInOrderResponse)
_register_crud('users', User, UserCreate, UserResponse)
_register_crud('addresses', Address, AddressCreate, AddressResponse)
_register_crud('passwords', Password, PasswordCreate, PasswordResponse)
