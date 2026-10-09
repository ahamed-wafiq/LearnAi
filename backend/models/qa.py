"""
Question & Citation Models — Persistent store for Q&A interactions and source citations.
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
    from models.study_session import StudySession


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    study_session_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("study_sessions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    document_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    answer_text: Mapped[str] = mapped_column(Text, nullable=False)
    key_takeaways: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    follow_up_questions: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="questions")
    study_session: Mapped[Optional["StudySession"]] = relationship(
        "StudySession", back_populates="questions"
    )
    document: Mapped[Optional["Document"]] = relationship(
        "Document", back_populates="questions"
    )
    citations: Mapped[List["Citation"]] = relationship(
        "Citation", back_populates="question", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Question(id={self.id}, user_id={self.user_id}, created_at={self.created_at})>"


class Citation(Base):
    __tablename__ = "citations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    document_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    chunk_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    quote: Mapped[str] = mapped_column(Text, nullable=False)
    similarity_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    question: Mapped["Question"] = relationship("Question", back_populates="citations")
    document: Mapped["Document"] = relationship("Document", back_populates="citations")

    def __repr__(self) -> str:
        return f"<Citation(id={self.id}, q_id={self.question_id}, doc_id='{self.document_id}', page={self.page_number})>"
