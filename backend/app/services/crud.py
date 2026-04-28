from typing import Generic, TypeVar

from fastapi import HTTPException, status

from app.repository.crud import CRUDRepository


ModelT = TypeVar('ModelT')


class CRUDService(Generic[ModelT]):
    def __init__(self, repository: CRUDRepository[ModelT], entity_name: str):
        self.repository = repository
        self.entity_name = entity_name

    def get_all(self) -> list[ModelT]:
        return self.repository.get_all()

    def get_by_id(self, item_id: int) -> ModelT:
        item = self.repository.get_by_id(item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'{self.entity_name} with id {item_id} not found',
            )
        return item

    def create(self, payload) -> ModelT:
        return self.repository.create(payload.model_dump())
