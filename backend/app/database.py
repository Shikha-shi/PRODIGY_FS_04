from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.settings import settings


# Database URL

database_url = URL.create(
    drivername="postgresql+psycopg",
    username=settings.DB_USERNAME,
    password=settings.DB_PASSWORD,
    host=settings.DB_HOST,
    port=settings.DB_PORT,
    database=settings.DB_NAME
)


# Database Engine

engine = create_engine(
    database_url,
    echo=True
)


# SQLAlchemy Base

class Base(DeclarativeBase):
    pass


# Database Session

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)


# Database Dependency

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()