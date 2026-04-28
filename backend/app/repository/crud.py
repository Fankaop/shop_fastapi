from typing import Generic, TypeVar, Type

from sqlalchemy.orm import Session


ModelT = TypeVar('ModelT')


class CRUDRepository(Generic[ModelT]):
    def __init__(self, db: Session, model: Type[ModelT]):
        self.db = db
        self.model = model

    def get_all(self) -> list[ModelT]:
        return self.db.query(self.model).all()

    def get_by_id(self, item_id: int) -> ModelT | None:
        return self.db.query(self.model).filter(self.model.id == item_id).first()

    def create(self, data: dict) -> ModelT:
        obj = self.model(**data)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj
