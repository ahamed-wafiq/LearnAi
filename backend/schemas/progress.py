"""
Progress Pydantic Schemas.
"""

import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ProgressRead(BaseModel):
    id: uuid.UUID
    topic: str
    questions_answered: int
    correct_answers: int
    mastery_level: float
    study_time: int
    last_studied_at: datetime

    model_config = ConfigDict(from_attributes=True)
