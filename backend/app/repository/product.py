from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from ..models.product import Product
from ..schemas.product import ProductCreate

class ProductRepository:
    def __init__(self, db:Session) -> None:
        self.db = db
    
    def get_all(self) -> List[Product]:
        return self.db.query(Product).options(joinedload(Product.category)).all()

    def get_by_id(self, product_id: int) -> Optional[Product]:
        return self.db.query(Product).options(joinedload(Product.category)).filter(Product.id==product_id).first()
    
    def get_by_category(self, product_category: str) -> List[Product]:
        return self.db.query(Product).options(joinedload(Product.category)).filter(Product.category==product_category).all()
    
    def create(self, product_data: ProductCreate) -> Optional[Product]:
        db_product = Product(**product_data.model_dump())
        self.db.add(db_product)
        self.db.commit()
        self.db.refresh(db_product)
        return db_product

    def get_multiply_by_ids(self, product_ids: List[int]) -> List[Product]:
        return self.db.query(Product).options(joinedload(Product.category)).filter(Product.id.in_(product_ids)).all()