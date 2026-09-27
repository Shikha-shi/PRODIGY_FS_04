from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL

from app.settings import settings


# PostgreSQL Database Connection

database_url = URL.create(
    drivername="postgresql+psycopg",
    username=settings.DB_USERNAME,
    password=settings.DB_PASSWORD,
    host=settings.DB_HOST,
    port=settings.DB_PORT,
    database="postgres"
)


engine = create_engine(
    database_url,
    isolation_level="AUTOCOMMIT"
)


# Chirp Database Creation

with engine.connect() as connection:
    database_exists = connection.execute(
        text(
            "SELECT 1 FROM pg_database WHERE datname = 'chirp_db'"
        )
    ).scalar()

    if not database_exists:
        connection.execute(
            text("CREATE DATABASE chirp_db")
        )
        print("Database 'chirp_db' created successfully.")
    else:
        print("Database 'chirp_db' already exists.")