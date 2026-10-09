"""
User Model — Represents registered students/users.
"""

import uuid
from datetime import datetime
from typing import List, TYPE_CHECKING
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from models.base import Base

if TYPE_CHECKING:
    from models.document import Document
    from models.study_session import StudySession
    from models.qa import Question
    from models.quiz import Quiz, QuizAttempt
    from models.progress import Progress


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    documents: Mapped[List["Document"]] = relationship(
        "Document", back_populates="user", cascade="all, delete-orphan"
    )
    study_sessions: Mapped[List["StudySession"]] = relationship(
        "StudySession", back_populates="user", cascade="all, delete-orphan"
    )
    questions: Mapped[List["Question"]] = relationship(
        "Question", back_populates="user", cascade="all, delete-orphan"
    )
    quizzes: Mapped[List["Quiz"]] = relationship(
        "Quiz", back_populates="user", cascade="all, delete-orphan"
    )
    quiz_attempts: Mapped[List["QuizAttempt"]] = relationship(
        "QuizAttempt", back_populates="user", cascade="all, delete-orphan"
    )
    progress_records: Mapped[List["Progress"]] = relationship(
        "Progress", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', name='{self.name}')>"
