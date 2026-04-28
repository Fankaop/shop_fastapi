from sqlalchemy import Column, Float, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.database import Base


class ProductInOrder(Base):
    __tablename__ = 'products_in_orders'

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False)
    total_products_in_order = Column(Integer, nullable=False)
    total_order_amount = Column(Float, nullable=False)

    product = relationship('Product', back_populates='products_in_orders')
    order = relationship('Order', back_populates='products_in_orders')
