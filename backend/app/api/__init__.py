from fastapi import APIRouter

from .auth import router as auth_router
from .cart import router as cart_router
from .category import router as category_router
from .entities import router as entities_router
from .product import router as product_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(entities_router)
api_router.include_router(category_router)
api_router.include_router(product_router)
api_router.include_router(cart_router)

__all__ = ["api_router"]