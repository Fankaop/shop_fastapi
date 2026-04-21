from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import Settings


engine = create_engine(
    Settings.database_url,
    connect_args={'check_some_thread': False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield 
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)