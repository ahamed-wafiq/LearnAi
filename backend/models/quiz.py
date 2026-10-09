"""
Quiz Models — Tracks generated quizzes, questions, and student quiz attempts.
"""

import uuid
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, Float, Text, JSON, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from models.base import Base

if TYPE_CHECKING:
    from models.user import User
    from models.document import Document


class Quiz(Base):
    __tablename__ = "quizzes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    document_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    topic: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    difficulty: Mapped[str] = mapped_column(String(32), default="Medium", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="quizzes")
    document: Mapped[Optional["Document"]] = relationship("Document")
    questions: Mapped[List["QuizQuestion"]] = relationship(
        "QuizQuestion", back_populates="quiz", cascade="all, delete-orphan"
    )
    attempts: Mapped[List["QuizAttempt"]] = relationship(
        "QuizAttempt", back_populates="quiz", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Quiz(id={self.id}, title='{self.title}', diff='{self.difficulty}')>"


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    quiz_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("quizzes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(
        String(32), default="multiple_choice", nullable=False
    )
    options: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    correct_answer: Mapped[str] = mapped_column(Text, nullable=False)
    correct_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source_chunk_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    quiz: Mapped["Quiz"] = relationship("Quiz", back_populates="questions")

    def __repr__(self) -> str:
        return f"<QuizQuestion(id={self.id}, quiz_id={self.quiz_id})>"


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    quiz_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("quizzes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    total_questions: Mapped[int] = mapped_column(Integer, nullable=False)
    percentage: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    time_taken_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    user_answers: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    quiz: Mapped["Quiz"] = relationship("Quiz", back_populates="attempts")
    user: Mapped["User"] = relationship("User", back_populates="quiz_attempts")

    def __repr__(self) -> str:
        return f"<QuizAttempt(id={self.id}, score={self.score}/{self.total_questions})>"
