from sqlalchemy.orm import Session
from typing import List

from starlette.status import HTTP_404_NOT_FOUND 
from ..repository.product import ProductRepository 
from ..repository.category import CategoryRepository
from ..schemas. product import ProductListResponse, ProductCreate, ProductResponse
from fastapi import HTTPException, status

class ProductService:
    def __init__(self, db: Session) -> None:
        self.product_repository = ProductRepository(db)
        self.category_repository = CategoryRepository(db)

    def get_all_products(self) -> ProductListResponse: 
        products = self.product_repository.get_all()
        products_response = [ProductResponse.model_validate(prod) for prod in products]
        return ProductListResponse(products=products_response, total=len(products_response))
    
    def get_products_by_category(self, category_id: int) -> ProductListResponse:
        category = self.category_repository.get_by_id(category_id)
        
        if not category:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail=f'Category id with {category_id} not found'
            )
        
        products = self.product_repository.get_by_category(category)
        products_response = [ProductResponse.model_validate(prod) for prod in products]
        return ProductListResponse(products=products_response, total=len(products_response))

    def create_product(self, product_data: ProductCreate) -> ProductResponse:
        category = self.category_repository.get_by_id(product_data.category_id)
        if not category:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail=f'Category id with {product_data.category_id} not found'
            )
        products = self.product_repository.create(product_data)
        return ProductResponse.model_validate(products)
    