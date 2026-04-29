from fastapi import HTTPException
from sqlalchemy.orm import Session
from typing import Any, Dict, cast

from starlette.status import HTTP_404_NOT_FOUND

from app.schemas.cart import CartItem, CartItemCreate, CartItemUpdate, CartResponse
from app.services.product import ProductRepository



class CartService:
    _cart_data: Dict[int, int] = {}

    def __init__(self, db: Session) -> None:
        self.product_repository = ProductRepository(db)

    def add_to_cart(self, item: CartItemCreate) -> Dict[int, int]:
        product = self.product_repository.get_by_id(item.product_id)
        if not product:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail=f'Product not found id with {item.product_id}'
            )
        if item.product_id in self._cart_data:
            self._cart_data[item.product_id] += item.quantity
        else:
            self._cart_data[item.product_id] = item.quantity
        return self._cart_data

    def cart_item_update(self, item: CartItemUpdate) -> Dict[int, int]:
        if item.product_id not in self._cart_data:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail=f'Product {item.product_id} not found in cart'
            )
        self._cart_data[item.product_id] = item.quantity
        return self._cart_data

    def remove_from_cart(self, product_id: int) -> Dict[int, int]:
        if product_id not in self._cart_data:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail=f'Product id{product_id} not found in cart'
            )
        del self._cart_data[product_id]
        return self._cart_data

    def get_raw_cart(self) -> Dict[int, int]:
        return self._cart_data

    def get_cart_details(self, cart_data: Dict[int, int] | None = None) -> CartResponse:
        cart_data = cart_data if cart_data is not None else self._cart_data
        if not cart_data:
            return CartResponse(items=[], total=0.0, items_count=0)

        products_ids = list(cart_data.keys())
        products = self.product_repository.get_multiply_by_ids(products_ids)
        product_dict: Dict[int, Any] = {cast(int, product.id): product for product in products}

        cart_items: list[CartItem] = []
        total_price = 0.0
        total_items = 0

        for product_id, quantity in cart_data.items():
            if product_id in product_dict:
                product = product_dict[product_id]

                product_price = cast(float, product.price)
                subtotal = product_price * quantity
                image_url = cast(str | None, product.image_url)

                cart_item = CartItem(
                    product_id=cast(int, product.id),
                    name=cast(str, product.name),
                    price=product_price,
                    quantity=quantity,
                    subtotal=subtotal,
                    image_url=image_url or "",
                )
                cart_items.append(cart_item)
                total_price += subtotal
                total_items += quantity

        return CartResponse(items=cart_items, total=round(total_price), items_count=total_items)
        