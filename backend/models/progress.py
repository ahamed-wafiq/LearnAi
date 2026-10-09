"""
Progress Model — Topic-level mastery and learning metrics.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from models.base import Base

if TYPE_CHECKING:
    from models.user import User


class Progress(Base):
    __tablename__ = "progress"
    __table_args__ = (
        UniqueConstraint("user_id", "topic", name="uq_user_topic_progress"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    topic: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    questions_answered: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    correct_answers: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    mastery_level: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    study_time: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # in seconds
    last_studied_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="progress_records")

    def __repr__(self) -> str:
        return f"<Progress(user_id={self.user_id}, topic='{self.topic}', mastery={self.mastery_level:.1f}%)>"
