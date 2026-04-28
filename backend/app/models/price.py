from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.database import Base


class Price(Base):
    __tablename__ = 'prices'

    id = Column(Integer, primary_key=True)
    price = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)

    product = relationship('Product', back_populates='prices')
