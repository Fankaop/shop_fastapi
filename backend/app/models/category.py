from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from ..database import Base


class Category(Base):
    __tablename__ = 'categories'

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, index=True)

    products = relationship('Product', back_populates='category')

    def __repr__(self):
        return f"<Category(id={self.id}, name={self.name})>"
        
    