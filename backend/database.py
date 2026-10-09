"""
Learn AI Database Layer — SQLAlchemy 2.x configuration, session management, and connectivity checks.
"""

import uuid
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase
from config import DATABASE_URL

# Modern SQLAlchemy 2.x declarative base
class Base(DeclarativeBase):
    pass

# Create engine with connection health pre-ping
engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a transactional database session.
    Automatically closes session upon request completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> dict:
    """
    Check the current database connection health.
    Returns structured status without exposing sensitive credentials.
    """
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            result.scalar()
            return {"status": "connected", "database": "postgresql"}
    except Exception as e:
        return {"status": "unavailable", "error": str(e)}


# ── Development helper: default user for unauthenticated requests ─────────

DEV_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEV_USER_EMAIL = "dev@learnai.local"
DEV_USER_NAME = "Learn AI Student"


def get_or_create_dev_user(db: Session):
    """
    Ensure the standard development user exists in PostgreSQL.
    Provides seamless compatibility before full authentication is introduced.
    """
    from models.user import User

    user = db.query(User).filter(User.id == DEV_USER_ID).first()
    if not user:
        # Also check by email
        user = db.query(User).filter(User.email == DEV_USER_EMAIL).first()
        if not user:
            user = User(
                id=DEV_USER_ID,
                email=DEV_USER_EMAIL,
                name=DEV_USER_NAME,
                password_hash="dev_placeholder_hash",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
    return user
