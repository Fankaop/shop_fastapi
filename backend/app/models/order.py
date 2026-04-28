from datetime import datetime

from sqlalchemy import Column, DateTime, Integer
from sqlalchemy.orm import relationship

from app.database import Base


class Order(Base):
    __tablename__ = 'orders'

    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    products_in_orders = relationship('ProductInOrder', back_populates='order')
