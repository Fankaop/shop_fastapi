from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Product(Base):
    __tablename__ = 'products'

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    image = Column(String(500))
    available_quantity = Column(Integer, nullable=False, default=0)
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=False)
    age_id = Column(Integer, ForeignKey('ages.id'), nullable=False)
    gender_id = Column(Integer, ForeignKey('genders.id'), nullable=False)
    size_id = Column(Integer, ForeignKey('sizes.id'), nullable=False)

    category = relationship('Category', back_populates='products')
    age = relationship('Age', back_populates='products')
    gender = relationship('Gender', back_populates='products')
    size = relationship('Size', back_populates='products')
    prices = relationship('Price', back_populates='product')
    products_in_orders = relationship('ProductInOrder', back_populates='product')
