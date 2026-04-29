from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.cart import CartService
from ..schemas.cart import CartItemCreate, CartItemUpdate
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/cart",
    tags=["cart"]
)

class AddToCartRequest(BaseModel):
    product_id: int
    quantity: int

class UpdateCartRequest(BaseModel):
    product_id: int
    quantity: int

@router.post("/add", status_code=status.HTTP_200_OK)
def add_to_cart(request: AddToCartRequest, db: Session = Depends(get_db)):
    service = CartService(db)
    item = CartItemCreate(product_id=request.product_id, quantity=request.quantity)
    updated_cart = service.add_to_cart(item)
    return {"cart": updated_cart}

@router.get("/raw", status_code=status.HTTP_200_OK)
def get_raw_cart(db: Session = Depends(get_db)):
    service = CartService(db)
    return {"cart": service.get_raw_cart()}

@router.put("/update", status_code=status.HTTP_200_OK)
def update_cart_item(request: UpdateCartRequest, db: Session = Depends(get_db)):
    service = CartService(db)
    item = CartItemUpdate(product_id=request.product_id, quantity=request.quantity)
    updated_cart = service.cart_item_update(item)
    return {"cart": updated_cart}

@router.delete("/remove/{product_id}", status_code=status.HTTP_200_OK)
def remove_from_cart(product_id: int, db: Session = Depends(get_db)):
    service = CartService(db)
    updated_cart = service.remove_from_cart(product_id)
    return {"cart": updated_cart}