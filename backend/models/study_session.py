"""
Study Session Model — Tracks active study sessions per user and document.
"""

import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from models.base import Base

if TYPE_CHECKING:
    from models.user import User
    from models.document import Document
    from models.qa import Question


class StudySession(Base):
    __tablename__ = "study_sessions"

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
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    ended_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="study_sessions")
    document: Mapped[Optional["Document"]] = relationship("Document")
    questions: Mapped[List["Question"]] = relationship(
        "Question", back_populates="study_session"
    )

    def __repr__(self) -> str:
        return f"<StudySession(id={self.id}, user_id={self.user_id}, duration={self.duration_seconds}s)>"
